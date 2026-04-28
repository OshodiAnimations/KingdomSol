'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store';
import { supabase, getPlayerId, SharedGameState } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/store';
import type { Card, CardSuit, Player } from '@/lib/store';
import { RealtimeChannel } from '@supabase/supabase-js';

// This hook keeps multiplayer game state in sync with Supabase in real time
// It runs inside GameBoard for multiplayer games only
export function useMultiplayerSync() {
  const { gameMode, inviteCode, players, humanPlayerIndex } = useGameStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerId = getPlayerId();

  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    // Subscribe to room updates during the game
    channelRef.current = supabase
      .channel(`game:${inviteCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `code=eq.${inviteCode}`,
      }, (payload) => {
        const room = payload.new as any;
        if (!room.game_state) return;

        const shared = room.game_state as SharedGameState;
        const state = useGameStore.getState();

        // Don't apply if it's our own broadcast (we already have this state)
        // Check by comparing currentPlayerIndex — if it just became our turn, apply
        const myIdx = shared.playerOrder.indexOf(playerId);
        if (myIdx === -1) return;

        // Rebuild players from shared state
        const currentPlayers = state.players;
        const updatedPlayers: Player[] = shared.playerOrder.map((pid, idx) => {
          const existing = currentPlayers.find(p => p.id === pid);
          const char = CHARACTERS.find(c => c.key === existing?.character) || CHARACTERS[0];
          const isMe = pid === playerId;
          return {
            id: pid,
            name: existing?.name || `Player ${idx + 1}`,
            avatar: existing?.avatar || char.icon,
            character: existing?.character || char.key,
            hand: isMe ? (shared.hands[pid] || []) : (shared.hands[pid] || []),
            xp: existing?.xp || 0,
            level: existing?.level || 1,
            solBalance: existing?.solBalance || 0,
            isBot: false,
            abilityUsed: existing?.abilityUsed || false,
          };
        });

        let winner = null;
        if (shared.winner) {
          winner = updatedPlayers.find(p => p.id === shared.winner) || null;
        }

        // Apply the incoming shared state
        useGameStore.setState({
          players: updatedPlayers,
          pile: shared.pile as Card[],
          topCard: shared.topCard as Card,
          currentSuit: shared.currentSuit as CardSuit,
          currentPlayerIndex: shared.currentPlayerIndex,
          direction: shared.direction,
          pendingPick: shared.pendingPick,
          deck: shared.deck as Card[],
          winner,
        });

        if (winner) {
          setTimeout(() => {
            useGameStore.setState({ screen: 'board' }); // triggers win modal
          }, 100);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [gameMode, inviteCode]);

  // Heartbeat: re-fetch game state every 5 seconds as a fallback
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('rooms')
        .select('game_state, status')
        .eq('code', inviteCode)
        .single();

      if (!data || !data.game_state) return;
      if (data.status === 'finished') {
        useGameStore.setState({ screen: 'menu' });
        return;
      }

      const shared = data.game_state as SharedGameState;
      const state = useGameStore.getState();

      // Only apply if something changed (compare currentPlayerIndex)
      if (shared.currentPlayerIndex === state.currentPlayerIndex &&
          shared.pile.length === state.pile.length) return;

      const myIdx = shared.playerOrder.indexOf(playerId);
      if (myIdx === -1) return;

      const updatedPlayers: Player[] = shared.playerOrder.map((pid, idx) => {
        const existing = state.players.find(p => p.id === pid);
        const char = CHARACTERS.find(c => c.key === existing?.character) || CHARACTERS[0];
        return {
          id: pid,
          name: existing?.name || `Player ${idx + 1}`,
          avatar: existing?.avatar || char.icon,
          character: existing?.character || char.key,
          hand: shared.hands[pid] || [],
          xp: existing?.xp || 0,
          level: existing?.level || 1,
          solBalance: existing?.solBalance || 0,
          isBot: false,
          abilityUsed: existing?.abilityUsed || false,
        };
      });

      useGameStore.setState({
        players: updatedPlayers,
        pile: shared.pile as Card[],
        topCard: shared.topCard as Card,
        currentSuit: shared.currentSuit as CardSuit,
        currentPlayerIndex: shared.currentPlayerIndex,
        direction: shared.direction,
        pendingPick: shared.pendingPick,
        deck: shared.deck as Card[],
        winner: shared.winner ? updatedPlayers.find(p => p.id === shared.winner) || null : null,
      });
    }, 5000); // Every 5 seconds fallback sync

    return () => clearInterval(interval);
  }, [gameMode, inviteCode]);
}

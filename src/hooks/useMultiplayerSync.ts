'use client';
import { useEffect, useRef } from 'react';
import { useGameStore, CHARACTERS } from '@/lib/store';
import { supabase, getPlayerId, SharedGameState } from '@/lib/supabase';
import type { Card, CardSuit, Player } from '@/lib/store';

export function useMultiplayerSync() {
  const gameMode = useGameStore(s => s.gameMode);
  const inviteCode = useGameStore(s => s.inviteCode);
  const myPlayerIdRef = useRef(getPlayerId());
  const lastPileLengthRef = useRef(0);
  const lastTurnRef = useRef(-1);

  // ─── Core function: apply incoming Supabase state correctly ───────────────
  function applyIncomingState(shared: SharedGameState) {
    const myPlayerId = myPlayerIdRef.current;
    const state = useGameStore.getState();

    // Find MY index in the player order — this NEVER changes
    const myIndex = shared.playerOrder.indexOf(myPlayerId);
    if (myIndex === -1) return; // not in this game

    // Skip if nothing actually changed (avoid re-render loops)
    if (
      shared.pile.length === lastPileLengthRef.current &&
      shared.currentPlayerIndex === lastTurnRef.current &&
      !shared.winner
    ) return;

    lastPileLengthRef.current = shared.pile.length;
    lastTurnRef.current = shared.currentPlayerIndex;

    // Rebuild player list — each player ALWAYS sees themselves at humanPlayerIndex
    const updatedPlayers: Player[] = shared.playerOrder.map((pid, idx) => {
      const existing = state.players.find(p => p.id === pid);
      const char = CHARACTERS.find(c => c.key === existing?.character) || CHARACTERS[0];
      return {
        id: pid,
        name: existing?.name || `Player ${idx + 1}`,
        avatar: existing?.avatar || char.icon,
        character: existing?.character || char.key,
        // Each player sees their OWN full hand, others are shown face-down in UI
        hand: shared.hands[pid] || [],
        xp: existing?.xp || 0,
        level: existing?.level || 1,
        solBalance: existing?.solBalance || 0,
        isBot: false,
        abilityUsed: existing?.abilityUsed || false,
      };
    });

    const winner = shared.winner
      ? updatedPlayers.find(p => p.id === shared.winner) || null
      : null;

    // KEY FIX: humanPlayerIndex is always MY index — never overwrite with 0
    useGameStore.setState({
      players: updatedPlayers,
      pile: shared.pile as Card[],
      topCard: shared.topCard as Card,
      currentSuit: shared.currentSuit as CardSuit,
      currentPlayerIndex: shared.currentPlayerIndex,
      humanPlayerIndex: myIndex, // ← THIS is the critical fix
      direction: shared.direction,
      pendingPick: shared.pendingPick,
      deck: shared.deck as Card[],
      winner,
      selectedCardIds: [], // clear any pending selection on state update
    });

    if (winner) {
      setTimeout(() => useGameStore.setState(s => ({ ...s })), 200);
    }
  }

  // ─── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const channel = supabase
      .channel(`game-sync:${inviteCode}:${myPlayerIdRef.current}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `code=eq.${inviteCode}`,
      }, (payload) => {
        const room = payload.new as any;
        if (room?.game_state) {
          applyIncomingState(room.game_state as SharedGameState);
        }
        if (room?.status === 'finished') {
          useGameStore.setState({ screen: 'menu' });
        }
      })
      .subscribe((status) => {
        console.log('[Multiplayer] Realtime status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [gameMode, inviteCode]);

  // ─── Heartbeat fallback every 4 seconds ──────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('rooms')
          .select('game_state, status')
          .eq('code', inviteCode)
          .single();

        if (!data) return;
        if (data.status === 'finished') {
          useGameStore.setState({ screen: 'menu' });
          return;
        }
        if (data.game_state) {
          applyIncomingState(data.game_state as SharedGameState);
        }
      } catch (e) {
        // Silent fail — realtime should cover this
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [gameMode, inviteCode]);
}

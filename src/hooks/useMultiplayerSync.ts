'use client';
import { useEffect, useRef } from 'react';
import { useGameStore, CHARACTERS } from '@/lib/store';
import { supabase, getPlayerId, SharedGameState, handlePlayerDisconnect, leaveRoom } from '@/lib/supabase';
import type { Card, CardSuit, Player } from '@/lib/store';

export function useMultiplayerSync() {
  const gameMode = useGameStore(s => s.gameMode);
  const inviteCode = useGameStore(s => s.inviteCode);
  const myPlayerIdRef = useRef(getPlayerId());
  const lastAppliedRef = useRef<string>('');
  const applyingRef = useRef(false);

  function applyIncomingState(shared: SharedGameState) {
    // Deduplicate: skip if we already applied this exact state
    const stateKey = `${shared.currentPlayerIndex}-${shared.pile.length}-${shared.winner || ''}`;
    if (stateKey === lastAppliedRef.current) return;
    if (applyingRef.current) return;
    applyingRef.current = true;

    const myPlayerId = myPlayerIdRef.current;
    const state = useGameStore.getState();
    const myIndex = shared.playerOrder.indexOf(myPlayerId);

    // Don't apply if we're not in this game
    if (myIndex === -1) { applyingRef.current = false; return; }

    // Don't apply our OWN moves (we already applied them locally)
    const currentTurnPlayerId = shared.playerOrder[shared.currentPlayerIndex];
    const prevTurnPlayerId = shared.playerOrder[
      ((shared.currentPlayerIndex - 1) + shared.playerOrder.length) % shared.playerOrder.length
    ];
    // If we just played (prev turn was ours), skip — we already have this state
    if (prevTurnPlayerId === myPlayerId && shared.pile.length > state.pile.length) {
      applyingRef.current = false;
      return;
    }

    lastAppliedRef.current = stateKey;

    const updatedPlayers: Player[] = shared.playerOrder.map((pid, idx) => {
      const existing = state.players.find(p => p.id === pid);
      const char = CHARACTERS.find(c => c.key === existing?.character) || CHARACTERS[0];
      return {
        id: pid,
        name: shared.playerNames?.[pid] || existing?.name || `Player ${idx + 1}`,
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

    const winner = shared.winner
      ? updatedPlayers.find(p => p.id === shared.winner) || null
      : null;

    // Batch the state update — single setState call, no cascading
    useGameStore.setState({
      players: updatedPlayers,
      pile: shared.pile as Card[],
      topCard: shared.topCard as Card,
      currentSuit: shared.currentSuit as CardSuit,
      currentPlayerIndex: shared.currentPlayerIndex,
      humanPlayerIndex: myIndex,  // Always my own index — never changes
      direction: shared.direction,
      pendingPick: shared.pendingPick,
      deck: shared.deck as Card[],
      winner,
      selectedCardIds: [],  // Clear selection on state sync
    });

    applyingRef.current = false;
  }

  // Realtime subscription
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const channel = supabase
      .channel(`mpsync:${inviteCode}:${myPlayerIdRef.current}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `code=eq.${inviteCode}`,
      }, (payload) => {
        const room = payload.new as any;
        if (room?.status === 'finished') {
          useGameStore.setState({
            notification: { message: 'Game ended — a player disconnected.', type: 'info' },
            screen: 'menu'
          });
          return;
        }
        if (room?.game_state) {
          applyIncomingState(room.game_state as SharedGameState);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'room_players',
        filter: `room_code=eq.${inviteCode}`,
      }, async (payload) => {
        const disconnectedId = (payload.old as any)?.player_id;
        if (!disconnectedId || disconnectedId === myPlayerIdRef.current) return;
        const state = useGameStore.getState();
        if (!state.isGameStarted) return;
        const shared: SharedGameState = {
          pile: state.pile,
          topCard: state.topCard,
          currentSuit: state.currentSuit || 'cowrie',
          currentPlayerIndex: state.currentPlayerIndex,
          direction: state.direction,
          pendingPick: state.pendingPick,
          winner: state.winner?.id || null,
          hands: Object.fromEntries(state.players.map(p => [p.id, p.hand])),
          playerOrder: state.players.map(p => p.id),
          playerNames: Object.fromEntries(state.players.map(p => [p.id, p.name])),
          deck: state.deck,
          multiMode: state.multiMode || 'war',
          stakeToken: state.stakeToken,
          stakeAmount: state.stakeAmount,
        };
        await handlePlayerDisconnect(inviteCode!, disconnectedId, shared);
      })
      .subscribe();

    // Handle own disconnect
    const handleUnload = async () => {
      const state = useGameStore.getState();
      if (state.gameMode === 'multiplayer' && inviteCode && state.isGameStarted) {
        await leaveRoom(inviteCode, myPlayerIdRef.current);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [gameMode, inviteCode]);

  // Heartbeat fallback — only if realtime missed something
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const interval = setInterval(async () => {
      if (applyingRef.current) return; // skip if mid-apply

      try {
        const { data } = await supabase
          .from('rooms')
          .select('game_state, status')
          .eq('code', inviteCode)
          .single();

        if (!data) return;
        if (data.status === 'finished') { useGameStore.setState({ screen: 'menu' }); return; }

        const shared = data.game_state as SharedGameState;
        if (!shared) return;

        const state = useGameStore.getState();
        // Only apply if something actually changed
        if (shared.currentPlayerIndex !== state.currentPlayerIndex ||
            shared.pile.length !== state.pile.length) {
          applyIncomingState(shared);
        }
      } catch {}
    }, 5000); // Every 5 seconds — reduced frequency stops the shake

    return () => clearInterval(interval);
  }, [gameMode, inviteCode]);
}

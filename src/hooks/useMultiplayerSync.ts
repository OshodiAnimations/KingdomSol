'use client';
import { useEffect, useRef } from 'react';
import { useGameStore, CHARACTERS } from '@/lib/store';
import { supabase, getPlayerId, SharedGameState, leaveRoom } from '@/lib/supabase';
import type { Card, CardSuit, Player } from '@/lib/store';

export function useMultiplayerSync() {
  const gameMode = useGameStore(s => s.gameMode);
  const inviteCode = useGameStore(s => s.inviteCode);
  const myPlayerIdRef = useRef(getPlayerId());
  const lastAppliedRef = useRef<string>('');
  const applyingRef = useRef(false);

  // ── Core: apply incoming shared state ──────────────────────────────────────
  function applyIncomingState(shared: SharedGameState) {
    const stateKey = `${shared.currentPlayerIndex}-${shared.pile.length}-${shared.winner || ''}-${shared.currentSuit}`;
    if (stateKey === lastAppliedRef.current) return;
    if (applyingRef.current) return;
    applyingRef.current = true;

    const myPlayerId = myPlayerIdRef.current;
    const state = useGameStore.getState();
    const myIndex = shared.playerOrder.indexOf(myPlayerId);
    if (myIndex === -1) { applyingRef.current = false; return; }

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

    // Fix: winner lookup — always resolve to full player object
    const winner = shared.winner
      ? updatedPlayers.find(p => p.id === shared.winner) || {
          id: shared.winner,
          name: shared.playerNames?.[shared.winner] || 'Winner',
          avatar: '👑', character: 'okonkwo' as const,
          hand: [], xp: 0, level: 1, solBalance: 0, isBot: false, abilityUsed: false,
        }
      : null;

    // Fix SOL CARD: don't overwrite suit selector state if it's currently open
    // Only update currentSuit from shared state, don't hide local UI
    const currentState = useGameStore.getState();

    useGameStore.setState({
      players: updatedPlayers,
      pile: shared.pile as Card[],
      topCard: shared.topCard as Card,
      currentSuit: shared.currentSuit as CardSuit,
      currentPlayerIndex: shared.currentPlayerIndex,
      humanPlayerIndex: myIndex,
      direction: shared.direction,
      pendingPick: shared.pendingPick,
      deck: shared.deck as Card[],
      winner,
      selectedCardIds: [],
    });

    // Fix 2 & 3: If winner arrived via sync, show win/loss screen immediately
    if (winner && !currentState.winner) {
      setTimeout(() => {
        // Trigger win modal via existing winner state being set above
        useGameStore.setState(s => ({ ...s })); // force re-render
      }, 100);
    }

    // SOL CARD: if topCard is WHOT and I played it, show suit selector
    if (shared.topCard?.value === 'WHOT' && shared.lastPlayerId === myPlayerId && !shared.winner) {
      // Only trigger if currentSuit hasn't been changed yet (still same as before play)
      setTimeout(() => {
        const s = useGameStore.getState();
        if (s.topCard?.value === 'WHOT' && !s.winner) {
          s.setNotification({ message: 'SOL CARD! Choose a suit', type: 'info' });
        }
      }, 150);
    }

    applyingRef.current = false;
  }

  // ── Handle room update (game state changes, winner, status) ───────────────
  function handleRoomUpdate(room: any) {
    const myPlayerId = myPlayerIdRef.current;

    if (room?.status === 'finished') {
      const shared = room.game_state as SharedGameState | null;
      if (shared?.winner) {
        // Apply final state — this sets winner in store which triggers win/loss screen
        applyIncomingState(shared);
        // Force winner state to be set with correct player object
        setTimeout(() => {
          const state = useGameStore.getState();
          if (!state.winner && shared.winner) {
            const winnerPlayer = state.players.find(p => p.id === shared.winner) || {
              id: shared.winner,
              name: shared.playerNames?.[shared.winner] || 'Winner',
              avatar: '👑', character: 'okonkwo' as const,
              hand: [], xp: 0, level: 1, solBalance: 0, isBot: false, abilityUsed: false,
            };
            useGameStore.setState({ winner: winnerPlayer });
          }
        }, 200);
      } else {
        useGameStore.setState({
          notification: { message: 'Game ended — a player disconnected.', type: 'info' },
          screen: 'menu',
        });
      }
      return;
    }

    if (room?.game_state) {
      applyIncomingState(room.game_state as SharedGameState);
    }
  }

  // ── Handle player disconnect from room_players table ──────────────────────
  async function handleDisconnect(disconnectedId: string) {
    const myPlayerId = myPlayerIdRef.current;
    if (disconnectedId === myPlayerId) return;

    const state = useGameStore.getState();
    if (!state.isGameStarted || state.winner) return;

    // Get current active players from Supabase (most accurate)
    const { data: activePlayers } = await supabase
      .from('room_players')
      .select('player_id, player_name, joined_at')
      .eq('room_code', inviteCode!)
      .order('joined_at', { ascending: true });

    const remaining = (activePlayers || []).map((p: any) => p.player_id);

    if (remaining.length === 0) {
      // Everyone left
      await supabase.from('rooms').update({ status: 'finished', updated_at: new Date().toISOString() }).eq('code', inviteCode!);
      useGameStore.setState({ screen: 'menu' });
      return;
    }

    if (remaining.length === 1 && remaining[0] === myPlayerId) {
      // Fix 1: I am the LAST player remaining — I win immediately
      const myPlayer = state.players.find(p => p.id === myPlayerId)
        || state.players[state.humanPlayerIndex]
        || state.players[0];
      if (!myPlayer) return;

      // Set winner locally FIRST so win screen shows immediately
      useGameStore.setState({ winner: myPlayer });

      // Build final winner state
      const winnerState: SharedGameState = {
        pile: state.pile,
        topCard: state.topCard,
        currentSuit: state.currentSuit || 'cowrie',
        currentPlayerIndex: state.currentPlayerIndex,
        direction: state.direction,
        pendingPick: 0,
        winner: myPlayerId,  // I win
        hands: Object.fromEntries(state.players.map(p => [p.id, p.hand])),
        playerOrder: state.players.map(p => p.id),
        playerNames: Object.fromEntries(state.players.map(p => [p.id, p.name])),
        deck: state.deck,
        multiMode: state.multiMode || 'war',
        stakeToken: state.stakeToken,
        stakeAmount: state.stakeAmount,
      };

      // Broadcast win immediately
      const { broadcastGameState } = await import('@/lib/supabase');
      await broadcastGameState(inviteCode!, winnerState);

      // Mark room finished in Supabase
      await supabase.from('rooms')
        .update({ status: 'finished', game_state: winnerState, updated_at: new Date().toISOString() })
        .eq('code', inviteCode!);

      return; // winner already set above
    }

    // 3+ players: remove disconnected player from order, continue game
    const newOrder = state.players.map(p => p.id).filter(id => remaining.includes(id));
    const newHands = Object.fromEntries(
      state.players.filter(p => remaining.includes(p.id)).map(p => [p.id, p.hand])
    );
    const newNames = Object.fromEntries(
      state.players.filter(p => remaining.includes(p.id)).map(p => [p.id, p.name])
    );
    let newCurrentIdx = state.currentPlayerIndex;
    if (newCurrentIdx >= newOrder.length) newCurrentIdx = 0;

    const continuedState: SharedGameState = {
      pile: state.pile,
      topCard: state.topCard,
      currentSuit: state.currentSuit || 'cowrie',
      currentPlayerIndex: newCurrentIdx,
      direction: state.direction,
      pendingPick: state.pendingPick,
      winner: null,
      hands: newHands,
      playerOrder: newOrder,
      playerNames: newNames,
      deck: state.deck,
      multiMode: state.multiMode || 'war',
      stakeToken: state.stakeToken,
      stakeAmount: state.stakeAmount,
    };

    const { broadcastGameState } = await import('@/lib/supabase');
    await broadcastGameState(inviteCode!, continuedState);
    applyIncomingState(continuedState);
  }

  // ── Realtime subscription ─────────────────────────────────────────────────
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
        handleRoomUpdate(payload.new);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'room_players',
        filter: `room_code=eq.${inviteCode}`,
      }, async (payload) => {
        const disconnectedId = (payload.old as any)?.player_id;
        if (disconnectedId) await handleDisconnect(disconnectedId);
      })
      .subscribe((status) => {
        console.log('[KSol Sync]', status, inviteCode);
      });

    // Clean disconnect on tab close
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

  // ── Heartbeat fallback every 5 seconds ───────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const interval = setInterval(async () => {
      if (applyingRef.current) return;
      try {
        const { data } = await supabase
          .from('rooms')
          .select('game_state, status')
          .eq('code', inviteCode)
          .single();

        if (!data) return;
        if (data.status === 'finished') {
          handleRoomUpdate({ status: 'finished', game_state: data.game_state });
          return;
        }
        if (data.game_state) {
          const shared = data.game_state as SharedGameState;
          const state = useGameStore.getState();
          if (shared.currentPlayerIndex !== state.currentPlayerIndex ||
              shared.pile.length !== state.pile.length ||
              shared.winner !== (state.winner?.id || null)) {
            applyIncomingState(shared);
          }
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [gameMode, inviteCode]);
}

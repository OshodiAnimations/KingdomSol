'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, CHARACTERS } from '@/lib/store';
import { supabase, getPlayerId, SharedGameState, leaveRoom } from '@/lib/supabase';
import type { Card, CardSuit, Player } from '@/lib/store';

export function useMultiplayerSync() {
  const gameMode = useGameStore(s => s.gameMode);
  const inviteCode = useGameStore(s => s.inviteCode);
  const myPlayerIdRef = useRef<string>('');
  const lastAppliedPileRef = useRef<number>(-1);
  const lastAppliedTurnRef = useRef<number>(-1);
  const lastAppliedWinnerRef = useRef<string>('');
  const applyingRef = useRef(false);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always get fresh playerId
  const getMyId = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const id = localStorage.getItem('kingdomsol-player-id') || '';
    myPlayerIdRef.current = id;
    return id;
  }, []);

  // ── Core apply function ───────────────────────────────────────────────────
  const applyIncomingState = useCallback((shared: SharedGameState) => {
    // Safety: always release applyingRef after 2 seconds max
    if (applyingRef.current) return;

    // Deduplicate: only apply if something meaningful changed
    const pileChanged = shared.pile.length !== lastAppliedPileRef.current;
    const turnChanged = shared.currentPlayerIndex !== lastAppliedTurnRef.current;
    const winnerChanged = (shared.winner || '') !== lastAppliedWinnerRef.current;

    if (!pileChanged && !turnChanged && !winnerChanged) return;

    applyingRef.current = true;
    // Safety release — never stay locked more than 1 second
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      applyingRef.current = false;
    }, 1000);

    try {
      const myPlayerId = getMyId();
      if (!myPlayerId) { applyingRef.current = false; return; }

      const state = useGameStore.getState();
      const myIndex = shared.playerOrder.indexOf(myPlayerId);

      if (myIndex === -1) {
        console.warn('[KSol] My ID not in playerOrder:', myPlayerId, shared.playerOrder);
        applyingRef.current = false;
        return;
      }

      // Update dedup refs
      lastAppliedPileRef.current = shared.pile.length;
      lastAppliedTurnRef.current = shared.currentPlayerIndex;
      lastAppliedWinnerRef.current = shared.winner || '';

      // Build player list with correct names
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

      // Resolve winner
      const winner = shared.winner
        ? updatedPlayers.find(p => p.id === shared.winner) || {
            id: shared.winner,
            name: shared.playerNames?.[shared.winner] || 'Winner',
            avatar: '👑', character: 'okonkwo' as const,
            hand: [], xp: 0, level: 1, solBalance: 0, isBot: false, abilityUsed: false,
          }
        : null;

      // Apply state — single atomic update
      useGameStore.setState({
        players: updatedPlayers,
        pile: shared.pile as Card[],
        topCard: shared.topCard as Card,
        currentSuit: shared.currentSuit as CardSuit,
        currentPlayerIndex: shared.currentPlayerIndex,
        humanPlayerIndex: myIndex,
        direction: shared.direction,
        pendingPick: shared.pendingPick,
        pendingSpecial: (shared as any).pendingSpecial || null,
        deck: shared.deck as Card[],
        winner,
        selectedCardIds: [],
        // Don't overwrite pendingNextPlayer — it's local only
      });

      // SOL CARD: if I played it and suit not yet chosen
      if (shared.suitPendingPlayerId === myPlayerId && !winner) {
        const currentIdx = shared.currentPlayerIndex;
        const dir = shared.direction || 1;
        const ni = ((currentIdx + dir) + shared.playerOrder.length) % shared.playerOrder.length;
        useGameStore.setState({ pendingNextPlayer: ni });
      } else if (!shared.suitPendingPlayerId) {
        useGameStore.setState({ pendingNextPlayer: null });
      }

      // Winner arrived via sync
      if (winner && !state.winner) {
        setTimeout(() => {
          const s = useGameStore.getState();
          if (!s.winner) useGameStore.setState({ winner });
        }, 200);
      }

    } catch (err) {
      console.error('[KSol] applyIncomingState error:', err);
    } finally {
      applyingRef.current = false;
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }
    }
  }, [getMyId]);

  // ── Handle room update ─────────────────────────────────────────────────────
  const handleRoomUpdate = useCallback((room: any) => {
    if (room?.status === 'finished') {
      const shared = room.game_state as SharedGameState | null;
      if (shared?.winner) {
        applyIncomingState(shared);
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
        }, 300);
      } else {
        useGameStore.setState({
          notification: { message: 'Game ended.', type: 'info' },
          screen: 'menu',
        });
      }
      return;
    }
    if (room?.game_state) {
      applyIncomingState(room.game_state as SharedGameState);
    }
  }, [applyIncomingState]);

  // ── Handle disconnect ──────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async (disconnectedId: string) => {
    const myPlayerId = getMyId();
    if (disconnectedId === myPlayerId) return;

    const state = useGameStore.getState();
    if (!state.isGameStarted || state.winner) return;

    // Get remaining players from Supabase
    const { data: activePlayers } = await supabase
      .from('room_players')
      .select('player_id, player_name, joined_at')
      .eq('room_code', inviteCode!)
      .order('joined_at', { ascending: true });

    const remaining = (activePlayers || []).map((p: any) => p.player_id);

    if (remaining.length === 1 && remaining[0] === myPlayerId) {
      // I'm last — I win
      const myPlayer = state.players.find(p => p.id === myPlayerId)
        || state.players[state.humanPlayerIndex]
        || state.players[0];
      if (!myPlayer) return;

      useGameStore.setState({ winner: myPlayer });

      const winnerState: SharedGameState = {
        pile: state.pile, topCard: state.topCard,
        currentSuit: state.currentSuit || 'cowrie',
        currentPlayerIndex: state.currentPlayerIndex,
        direction: state.direction, pendingPick: 0,
        winner: myPlayerId,
        hands: Object.fromEntries(state.players.map(p => [p.id, p.hand])),
        playerOrder: state.players.map(p => p.id),
        playerNames: Object.fromEntries(state.players.map(p => [p.id, p.name])),
        deck: state.deck, multiMode: state.multiMode || 'war',
        stakeToken: state.stakeToken, stakeAmount: state.stakeAmount,
      };

      const { broadcastGameState } = await import('@/lib/supabase');
      await broadcastGameState(inviteCode!, winnerState);
      await supabase.from('rooms')
        .update({ status: 'finished', game_state: winnerState, updated_at: new Date().toISOString() })
        .eq('code', inviteCode!);
      return;
    }

    if (remaining.length === 0) {
      await supabase.from('rooms')
        .update({ status: 'finished', updated_at: new Date().toISOString() })
        .eq('code', inviteCode!);
      useGameStore.setState({ screen: 'menu' });
      return;
    }

    // 3+ players: remove disconnected, continue
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
      pile: state.pile, topCard: state.topCard,
      currentSuit: state.currentSuit || 'cowrie',
      currentPlayerIndex: newCurrentIdx, direction: state.direction,
      pendingPick: state.pendingPick, winner: null,
      hands: newHands, playerOrder: newOrder, playerNames: newNames,
      deck: state.deck, multiMode: state.multiMode || 'war',
      stakeToken: state.stakeToken, stakeAmount: state.stakeAmount,
    };

    const { broadcastGameState } = await import('@/lib/supabase');
    await broadcastGameState(inviteCode!, continuedState);
    applyIncomingState(continuedState);
  }, [inviteCode, getMyId, applyIncomingState]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const channel = supabase
      .channel(`mpsync:${inviteCode}:${Date.now()}`) // unique channel name prevents stale subscriptions
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
        if (status === 'SUBSCRIBED') {
          console.log('[KSol] Realtime connected for room', inviteCode);
        }
      });

    const handleUnload = async () => {
      const state = useGameStore.getState();
      if (state.gameMode === 'multiplayer' && inviteCode && state.isGameStarted) {
        await leaveRoom(inviteCode, getMyId());
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', handleUnload);
      if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    };
  }, [gameMode, inviteCode, handleRoomUpdate, handleDisconnect, getMyId]);

  // ── Heartbeat — conservative, only apply if genuinely behind ─────────────
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !inviteCode) return;

    const interval = setInterval(async () => {
      // Skip if currently applying or game is over
      if (applyingRef.current) return;
      const state = useGameStore.getState();
      if (state.winner) return;

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

        if (!data.game_state) return;
        const shared = data.game_state as SharedGameState;

        // ONLY apply heartbeat if we're genuinely behind
        // Compare by both pile length AND currentPlayerIndex
        const pileOutOfSync = shared.pile.length !== state.pile.length;
        const turnOutOfSync = shared.currentPlayerIndex !== state.currentPlayerIndex;
        const winnerOutOfSync = !!shared.winner && !state.winner;

        if (pileOutOfSync || winnerOutOfSync || (turnOutOfSync && pileOutOfSync)) {
          console.log('[KSol] Heartbeat resync: pile', state.pile.length, '->', shared.pile.length);
          applyIncomingState(shared);
        }
        // Note: turnOutOfSync alone without pile change = normal race, don't resync
      } catch (err) {
        // Silent — realtime should cover this
      }
    }, 6000); // 6 seconds — slower heartbeat = less shake

    return () => clearInterval(interval);
  }, [gameMode, inviteCode, handleRoomUpdate, applyIncomingState]);
}

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sjqkuwfsgbggribuutax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcWt1d2ZzZ2JnZ3JpYnV1dGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTUzODgsImV4cCI6MjA5Mjg5MTM4OH0.oITQ5E_OiRck3fo_J_z7V5cpE_ygQFAEKbgzDsKIUXc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomRow {
  id: string;
  code: string;
  mode: string;
  status: 'waiting' | 'playing' | 'finished';
  host_id: string;
  stake_token: string;
  stake_amount: string;
  game_state: SharedGameState | null;
  updated_at: string;
}

export interface RoomPlayerRow {
  id: string;
  room_code: string;
  player_id: string;
  player_name: string;
  character_key: string;
  is_host: boolean;
  is_ready: boolean;
  hand: any[];
  joined_at: string;
}

export interface GameMoveRow {
  id: number;
  room_code: string;
  player_id: string;
  move_type: 'play_card' | 'draw_card' | 'change_suit' | 'game_over';
  payload: any;
  created_at: string;
}

// The ONE shared game state stored in Supabase
// Every player reads from this — nobody has their own version
export interface SharedGameState {
  // Shared between all players
  pile: any[];           // cards played so far
  topCard: any;          // current top card
  currentSuit: string;   // active suit
  currentPlayerIndex: number;
  direction: 1 | -1;
  pendingPick: number;
  winner: string | null; // player_id of winner

  // Each player's hand — stored by player_id
  // e.g. { "p-abc123": [...cards], "p-xyz456": [...cards] }
  hands: Record<string, any[]>;

  // Player order — array of player_ids in turn order
  playerOrder: string[];
  // Player names by ID so all clients know everyone's name
  playerNames: Record<string, string>;

  // Deck (shared, only host manages drawing)
  deck: any[];

  multiMode: string;
  stakeToken: string;
  stakeAmount: string;
}

// ─── Player ID ────────────────────────────────────────────────────────────────

export function getPlayerId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('kingdomsol-player-id');
  if (!id) {
    id = 'p-' + Math.random().toString(36).substr(2, 12);
    localStorage.setItem('kingdomsol-player-id', id);
  }
  return id;
}

// ─── Room API ─────────────────────────────────────────────────────────────────

export async function createRoom(params: {
  code: string;
  mode: string;
  hostId: string;
  hostName: string;
  hostCharacter: string;
  stakeToken: string;
  stakeAmount: string;
}): Promise<RoomRow | null> {
  // Delete any existing room with same code first
  await supabase.from('rooms').delete().eq('code', params.code);

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      id: params.code,
      code: params.code,
      mode: params.mode,
      status: 'waiting',
      host_id: params.hostId,
      stake_token: params.stakeToken,
      stake_amount: params.stakeAmount,
      game_state: null,
    })
    .select()
    .single();

  if (error) { console.error('createRoom error:', error); return null; }

  // Add host as player
  await supabase.from('room_players').upsert({
    id: `${params.code}-${params.hostId}`,
    room_code: params.code,
    player_id: params.hostId,
    player_name: params.hostName,
    character_key: params.hostCharacter,
    is_host: true,
    is_ready: true,
    hand: [],
  });

  return data;
}

export async function joinRoom(params: {
  code: string;
  playerId: string;
  playerName: string;
  characterKey: string;
}): Promise<{ room: RoomRow | null; players: RoomPlayerRow[] }> {
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', params.code)
    .single();

  if (!room) return { room: null, players: [] };
  if (room.status === 'finished') return { room: null, players: [] };

  // Add player (upsert in case reconnecting)
  await supabase.from('room_players').upsert({
    id: `${params.code}-${params.playerId}`,
    room_code: params.code,
    player_id: params.playerId,
    player_name: params.playerName,
    character_key: params.characterKey,
    is_host: false,
    is_ready: true,
    hand: [],
  });

  const { data: players } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_code', params.code)
    .order('joined_at', { ascending: true });

  return { room, players: players || [] };
}

export async function getRoomPlayers(code: string): Promise<RoomPlayerRow[]> {
  const { data } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_code', code)
    .order('joined_at', { ascending: true });
  return data || [];
}

export async function getRoom(code: string): Promise<RoomRow | null> {
  const { data } = await supabase.from('rooms').select('*').eq('code', code).single();
  return data;
}

// Host calls this to start the game — creates ONE shared state for everyone
export async function startSharedGame(params: {
  code: string;
  players: RoomPlayerRow[];
  multiMode: string;
  stakeToken: string;
  stakeAmount: string;
}): Promise<SharedGameState | null> {
  // Build shared deck
  const deck = buildSharedDeck();

  // Deal cards to each player
  const hands: Record<string, any[]> = {};
  const isRaid = params.multiMode === 'raid';
  const handSize = isRaid ? 3 : 6;
  let remaining = deck;

  for (const p of params.players) {
    hands[p.player_id] = remaining.slice(0, handSize);
    remaining = remaining.slice(handSize);
  }

  // First card on pile (non-special)
  const nonSpecial = remaining.filter((c: any) => !c.special && c.value !== 'WHOT');
  const startCard = nonSpecial[0];
  remaining = remaining.filter((c: any) => c.id !== startCard.id);

  // Sort players by joined_at to establish stable hierarchy (Player 1 = host, others in join order)
  const sortedPlayers = [...params.players].sort((a, b) =>
    new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  );
  const playerOrder = sortedPlayers.map(p => p.player_id);
  // Rebuild hands in sorted order
  const sortedHands: Record<string, any[]> = {};
  for (const p of sortedPlayers) sortedHands[p.player_id] = hands[p.player_id] || [];

  const playerNames: Record<string, string> = {};
  for (const p of params.players) playerNames[p.player_id] = p.player_name;

  const sharedState: SharedGameState = {
    pile: [startCard],
    topCard: startCard,
    currentSuit: startCard.suit,
    currentPlayerIndex: 0,
    direction: 1,
    pendingPick: 0,
    winner: null,
    hands,
    playerOrder,
    playerNames,
    deck: remaining,
    multiMode: params.multiMode,
    stakeToken: params.stakeToken,
    stakeAmount: params.stakeAmount,
  };

  // Save to Supabase — this triggers realtime update for all players
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'playing',
      game_state: sharedState,
      updated_at: new Date().toISOString(),
    })
    .eq('code', params.code);

  if (error) { console.error('startSharedGame error:', error); return null; }
  return sharedState;
}

// Broadcast a move — updates the shared game state in Supabase
export async function broadcastGameState(code: string, state: SharedGameState) {
  await supabase
    .from('rooms')
    .update({
      game_state: state,
      updated_at: new Date().toISOString(),
    })
    .eq('code', code);
}

export async function markRoomFinished(code: string) {
  await supabase.from('rooms').update({ status: 'finished', updated_at: new Date().toISOString() }).eq('code', code);
}

export async function leaveRoom(code: string, playerId: string) {
  await supabase.from('room_players').delete().eq('room_code', code).eq('player_id', playerId);
}

// Called when a player disconnects mid-game
// If 2 players: game stops, other player wins
// If 3+ players: last standing player wins all stakes
// ── Player Stats (global leaderboard) ────────────────────────────────────────

export interface PlayerStatRow {
  player_id: string;
  player_name: string;
  character_key: string;
  avatar_symbol: string;
  xp: number;
  level: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_streak: number;
  best_streak: number;
  cards_played: number;
  ksl_earned: number;
  sol_earned: number;
  multiplayer_wins: number;
  solo_wins: number;
  wallet_address?: string;
  last_played: string;
}

export async function upsertPlayerStats(stats: Partial<PlayerStatRow> & { player_id: string; player_name: string }) {
  try {
    const { error } = await supabase
      .from('player_stats')
      .upsert({
        ...stats,
        last_played: new Date().toISOString(),
      }, { onConflict: 'player_id' });
    if (error) console.error('upsertPlayerStats error:', error);
  } catch (e) {
    console.error('upsertPlayerStats exception:', e);
  }
}

export async function fetchGlobalLeaderboard(limit = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('global_leaderboard')
      .select('*')
      .order('xp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('fetchGlobalLeaderboard error:', e);
    return [];
  }
}

export async function fetchPlayerRank(playerId: string): Promise<number | null> {
  try {
    const { data } = await supabase
      .from('global_leaderboard')
      .select('rank, player_id')
      .eq('player_id', playerId)
      .single();
    return data?.rank || null;
  } catch { return null; }
}

export async function handlePlayerDisconnect(code: string, disconnectedPlayerId: string, currentState: SharedGameState) {
  const remaining = currentState.playerOrder.filter(id => id !== disconnectedPlayerId);
  
  if (remaining.length === 1) {
    // Last player standing wins
    const winnerId = remaining[0];
    const newState = { ...currentState, winner: winnerId };
    await broadcastGameState(code, newState);
    await supabase.from('rooms').update({ status: 'finished', game_state: newState, updated_at: new Date().toISOString() }).eq('code', code);
  } else if (remaining.length === 0) {
    // Everyone left - just close room
    await supabase.from('rooms').update({ status: 'finished', updated_at: new Date().toISOString() }).eq('code', code);
  } else {
    // Remove player from order and hands, continue game
    const newHands = { ...currentState.hands };
    delete newHands[disconnectedPlayerId];
    const newOrder = currentState.playerOrder.filter(id => id !== disconnectedPlayerId);
    const newNames = { ...currentState.playerNames };
    delete newNames[disconnectedPlayerId];
    let newCurrentIdx = currentState.currentPlayerIndex;
    if (newCurrentIdx >= newOrder.length) newCurrentIdx = 0;
    const newState = { ...currentState, playerOrder: newOrder, hands: newHands, playerNames: newNames, currentPlayerIndex: newCurrentIdx };
    await broadcastGameState(code, newState);
  }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToRoom(
  code: string,
  callbacks: {
    onPlayerJoin?: (player: RoomPlayerRow) => void;
    onPlayerLeave?: (playerId: string) => void;
    onGameStateUpdate?: (state: SharedGameState) => void;
    onRoomStatusChange?: (status: string) => void;
  }
): RealtimeChannel {
  const channel = supabase
    .channel(`room:${code}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'room_players',
      filter: `room_code=eq.${code}`,
    }, payload => {
      callbacks.onPlayerJoin?.(payload.new as RoomPlayerRow);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'room_players',
      filter: `room_code=eq.${code}`,
    }, payload => {
      callbacks.onPlayerLeave?.((payload.old as any).player_id);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `code=eq.${code}`,
    }, payload => {
      const room = payload.new as RoomRow;
      if (room.game_state) {
        callbacks.onGameStateUpdate?.(room.game_state as SharedGameState);
      }
      callbacks.onRoomStatusChange?.(room.status);
    })
    .subscribe();

  return channel;
}

export function unsubscribeFromRoom(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

// ─── Deck builder ─────────────────────────────────────────────────────────────

function buildSharedDeck(): any[] {
  const SUITS = ['manilla', 'amole', 'spearhead', 'bead', 'cowrie'];
  const deck: any[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (let v = 1; v <= 14; v++) {
      let special = null;
      if (v === 1) special = 'hold_on';
      if (v === 2) special = 'pick2';
      if (v === 5) special = 'pick4';
      if (v === 14) special = 'general_market';
      if (suit === 'cowrie' && v === 8) special = 'suspension';
      deck.push({ id: `c${id++}`, suit, value: v.toString(), special });
    }
  }
  for (let i = 0; i < 5; i++) {
    deck.push({ id: `w${i}`, suit: 'cowrie', value: 'WHOT', special: null });
  }

  // Shuffle
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

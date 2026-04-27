import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sjqkuwfsgbggribuutax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcWt1d2ZzZ2JnZ3JpYnV1dGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTUzODgsImV4cCI6MjA5Mjg5MTM4OH0.oITQ5E_OiRck3fo_J_z7V5cpE_ygQFAEKbgzDsKIUXc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomRow {
  id: string;
  code: string;
  mode: string;
  status: 'waiting' | 'stake_vote' | 'playing' | 'finished';
  host_id: string;
  stake_token: string;
  stake_amount: string;
  game_state: any;
  created_at: string;
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
  move_type: string;
  payload: any;
  created_at: string;
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
  // Insert room
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .insert({
      id: params.code,
      code: params.code,
      mode: params.mode,
      status: 'waiting',
      host_id: params.hostId,
      stake_token: params.stakeToken,
      stake_amount: params.stakeAmount,
      game_state: {},
    })
    .select()
    .single();

  if (roomErr) { console.error('createRoom error:', roomErr); return null; }

  // Insert host as player
  await supabase.from('room_players').insert({
    id: `${params.code}-${params.hostId}`,
    room_code: params.code,
    player_id: params.hostId,
    player_name: params.hostName,
    character_key: params.hostCharacter,
    is_host: true,
    is_ready: true,
    hand: [],
  });

  return room;
}

export async function joinRoom(params: {
  code: string;
  playerId: string;
  playerName: string;
  characterKey: string;
}): Promise<{ room: RoomRow | null; players: RoomPlayerRow[] }> {
  // Get room
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', params.code)
    .single();

  if (!room) return { room: null, players: [] };

  // Check if already in room
  const { data: existing } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_code', params.code)
    .eq('player_id', params.playerId)
    .single();

  if (!existing) {
    await supabase.from('room_players').insert({
      id: `${params.code}-${params.playerId}`,
      room_code: params.code,
      player_id: params.playerId,
      player_name: params.playerName,
      character_key: params.characterKey,
      is_host: false,
      is_ready: true,
      hand: [],
    });
  }

  // Get all players
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

export async function updateRoomStatus(code: string, status: RoomRow['status'], gameState?: any) {
  const update: any = { status, updated_at: new Date().toISOString() };
  if (gameState !== undefined) update.game_state = gameState;
  await supabase.from('rooms').update(update).eq('code', code);
}

export async function updateRoomStake(code: string, token: string, amount: string) {
  await supabase.from('rooms').update({ stake_token: token, stake_amount: amount, updated_at: new Date().toISOString() }).eq('code', code);
}

export async function broadcastMove(params: {
  roomCode: string;
  playerId: string;
  moveType: string;
  payload: any;
}) {
  await supabase.from('game_moves').insert({
    room_code: params.roomCode,
    player_id: params.playerId,
    move_type: params.moveType,
    payload: params.payload,
  });
}

export async function updateGameState(code: string, gameState: any) {
  await supabase.from('rooms').update({ game_state: gameState, updated_at: new Date().toISOString() }).eq('code', code);
}

export async function leaveRoom(code: string, playerId: string) {
  await supabase.from('room_players').delete().eq('room_code', code).eq('player_id', playerId);
}

export async function cleanupRoom(code: string) {
  await supabase.from('room_players').delete().eq('room_code', code);
  await supabase.from('game_moves').delete().eq('room_code', code);
  await supabase.from('rooms').delete().eq('code', code);
}

// ─── Realtime subscriptions ───────────────────────────────────────────────────

export function subscribeToRoom(
  code: string,
  callbacks: {
    onPlayerJoin?: (player: RoomPlayerRow) => void;
    onPlayerLeave?: (playerId: string) => void;
    onRoomUpdate?: (room: RoomRow) => void;
    onMove?: (move: GameMoveRow) => void;
  }
): RealtimeChannel {
  const channel = supabase
    .channel(`room-${code}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'room_players',
      filter: `room_code=eq.${code}`,
    }, (payload) => {
      callbacks.onPlayerJoin?.(payload.new as RoomPlayerRow);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'room_players',
      filter: `room_code=eq.${code}`,
    }, (payload) => {
      callbacks.onPlayerLeave?.((payload.old as any).player_id);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `code=eq.${code}`,
    }, (payload) => {
      callbacks.onRoomUpdate?.(payload.new as RoomRow);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'game_moves',
      filter: `room_code=eq.${code}`,
    }, (payload) => {
      callbacks.onMove?.(payload.new as GameMoveRow);
    })
    .subscribe();

  return channel;
}

export function unsubscribeFromRoom(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

// ─── Player ID (persistent per browser) ──────────────────────────────────────

export function getPlayerId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('kingdomsol-player-id');
  if (!id) {
    id = 'p-' + Math.random().toString(36).substr(2, 12);
    localStorage.setItem('kingdomsol-player-id', id);
  }
  return id;
}

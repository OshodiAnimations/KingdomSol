'use client';
import { supabase } from './supabase';

// ── Generate a stable visitor fingerprint (no real IP stored) ─────────────────
function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'ksol-vid';
  let id = localStorage.getItem(key);
  if (!id) {
    // Fingerprint from browser characteristics — not personally identifiable
    const raw = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      new Date().getTimezoneOffset(),
    ].join('|');
    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    id = `v_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

// ── Track page visit ──────────────────────────────────────────────────────────
export async function trackVisit(playerName?: string) {
  if (typeof window === 'undefined') return;
  const visitor_id = getVisitorId();

  try {
    // Upsert visitor record
    await supabase.from('page_visits').upsert({
      visitor_id,
      user_agent: navigator.userAgent.substring(0, 200),
      screen_width: screen.width,
      referrer: document.referrer || 'direct',
      last_seen: new Date().toISOString(),
    }, { onConflict: 'visitor_id', ignoreDuplicates: false });

    // Update visit count
    await supabase.rpc('increment_visit_count', { vid: visitor_id }).maybeSingle();

    // Track event
    await trackEvent('page_view', { referrer: document.referrer || 'direct', playerName });
  } catch (e) {
    // Silent fail — analytics should never break the game
  }
}

// ── Update active session (heartbeat every 30s) ───────────────────────────────
export async function updateSession(params: {
  playerName?: string;
  screen?: string;
  gameMode?: string;
}) {
  if (typeof window === 'undefined') return;
  const visitor_id = getVisitorId();

  try {
    await supabase.from('active_sessions').upsert({
      visitor_id,
      player_name: params.playerName || null,
      current_screen: params.screen || 'menu',
      game_mode: params.gameMode || null,
      last_heartbeat: new Date().toISOString(),
    }, { onConflict: 'visitor_id' });
  } catch (e) {
    // Silent fail
  }
}

// ── Remove session on page unload ─────────────────────────────────────────────
export async function removeSession() {
  if (typeof window === 'undefined') return;
  const visitor_id = getVisitorId();
  try {
    await supabase.from('active_sessions').delete().eq('visitor_id', visitor_id);
  } catch {}
}

// ── Track specific events ─────────────────────────────────────────────────────
export async function trackEvent(
  eventType:
    | 'page_view' | 'game_start' | 'game_end' | 'game_win' | 'game_loss'
    | 'wallet_connect' | 'room_create' | 'room_join' | 'tutorial_start'
    | 'tutorial_complete' | 'stake_placed' | 'airdrop_request',
  metadata: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;
  const visitor_id = getVisitorId();
  try {
    await supabase.from('analytics_events').insert({
      visitor_id,
      event_type: eventType,
      metadata,
    });
  } catch {}
}

// ── Fetch live analytics data ─────────────────────────────────────────────────
export async function fetchAnalyticsSummary() {
  try {
    const [visits, sessions, rooms, events] = await Promise.all([
      supabase.from('page_visits').select('visitor_id, first_seen, last_seen, screen_width', { count: 'exact' }),
      supabase.from('active_sessions')
        .select('visitor_id, player_name, current_screen, game_mode, last_heartbeat')
        .gt('last_heartbeat', new Date(Date.now() - 2 * 60 * 1000).toISOString()), // last 2 minutes
      supabase.from('rooms').select('code, mode, status, created_at', { count: 'exact' }),
      supabase.from('analytics_events').select('event_type, created_at').order('created_at', { ascending: false }).limit(500),
    ]);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const roomsData = rooms.data || [];
    const eventsData = events.data || [];
    const sessionsData = sessions.data || [];

    // Rooms created today only
    const roomsToday = roomsData.filter(r => new Date(r.created_at) >= todayStart);

    // Active games = status 'playing' AND updated in last 10 minutes (not stale)
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const activeGames = roomsData.filter(r =>
      r.status === 'playing' &&
      new Date(r.updated_at || r.created_at) >= tenMinsAgo
    );

    // Waiting rooms = status 'waiting' AND created today (not old abandoned rooms)
    const waitingRooms = roomsData.filter(r =>
      r.status === 'waiting' &&
      new Date(r.created_at) >= todayStart
    );

    // Completed = finished status
    const completedGames = roomsData.filter(r => r.status === 'finished');

    return {
      // Users
      totalUniqueVisitors: visits.count || 0,
      activeNow: sessionsData.length,
      activeSessions: sessionsData,

      // Rooms — accurate counts
      totalRooms: roomsData.length,
      roomsToday: roomsToday.length,
      activeGames: activeGames.length,
      completedGames: completedGames.length,
      waitingRooms: waitingRooms.length,

      // Mode breakdown — today only for relevance
      modeCounts: roomsToday.reduce((acc: Record<string, number>, r) => {
        acc[r.mode] = (acc[r.mode] || 0) + 1;
        return acc;
      }, {}),

      // Events
      gamesStartedToday: eventsData.filter(e => e.event_type === 'game_start' && new Date(e.created_at) >= todayStart).length,
      walletConnections: eventsData.filter(e => e.event_type === 'wallet_connect').length,
      tutorialStarts: eventsData.filter(e => e.event_type === 'tutorial_start').length,
      stakesPlaced: eventsData.filter(e => e.event_type === 'stake_placed').length,
    };
  } catch (e) {
    console.error('Analytics fetch error:', e);
    return null;
  }
}

export { getVisitorId };

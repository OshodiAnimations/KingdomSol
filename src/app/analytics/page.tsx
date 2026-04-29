'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchAnalyticsSummary } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  totalUniqueVisitors: number;
  activeNow: number;
  activeSessions: any[];
  totalRooms: number;
  roomsToday: number;
  activeGames: number;
  completedGames: number;
  waitingRooms: number;
  modeCounts: Record<string, number>;
  gamesStartedToday: number;
  walletConnections: number;
  tutorialStarts: number;
  stakesPlaced: number;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div style={{ padding:'20px', borderRadius:14, background:`${color}0d`, border:`1.5px solid ${color}33`, flex:'1 1 160px', minWidth:140 }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color, letterSpacing:'-0.01em', marginBottom:4 }}>{value}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.6)', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>{label}</div>
      {sub && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.35)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function PulsingDot({ color = '#14F195' }: { color?: string }) {
  return (
    <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}`, animation:'livepulse 1.5s ease-in-out infinite', flexShrink:0 }} />
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const load = useCallback(async () => {
    const [summary, rooms, events] = await Promise.all([
      fetchAnalyticsSummary(),
      supabase.from('rooms').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (summary) setData(summary);
    if (rooms.data) setRecentRooms(rooms.data);
    if (events.data) setRecentEvents(events.data);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  // Realtime subscription for active sessions
  useEffect(() => {
    const channel = supabase
      .channel('analytics-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_events' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const modeColors: Record<string, string> = {
    war: '#FF6FD8', friendly: '#14F195', raid: '#FF6432',
    story: '#E8B84B', classic: '#00C2FF', easy: '#14F195', warrior: '#FF4444'
  };

  const eventColors: Record<string, string> = {
    page_view: '#9945FF', game_start: '#14F195', game_end: '#E8B84B',
    wallet_connect: '#00C2FF', room_create: '#FF6FD8', room_join: '#FF6432',
    tutorial_start: '#00C2FF', stake_placed: '#E8B84B', airdrop_request: '#14F195',
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0D0A08', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #9945FF', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 20px' }} />
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'#9945FF', letterSpacing:'0.1em' }}>LOADING ANALYTICS...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 30% 10%, #1A0A2E 0%, #0D0A08 60%)', color:'#F5E6C8', fontFamily:'Arial, sans-serif', padding:'24px 20px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* ── HEADER ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'#E8B84B', letterSpacing:'0.08em' }}>
              KINGDOMSOL <span style={{ color:'#9945FF' }}>ANALYTICS</span>
            </div>
            <div style={{ fontFamily:'Arial', fontSize:13, color:'rgba(245,230,200,0.4)', marginTop:4 }}>
              Live data · Auto-refreshes every 15s
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <PulsingDot />
            <span style={{ fontFamily:'Arial', fontSize:12, color:'#14F195' }}>LIVE</span>
            <span style={{ fontFamily:'Arial', fontSize:11, color:'rgba(245,230,200,0.35)' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button onClick={load} style={{ padding:'6px 14px', borderRadius:7, background:'rgba(153,69,255,0.15)', border:'1px solid rgba(153,69,255,0.4)', color:'#9945FF', cursor:'pointer', fontSize:12, fontWeight:700 }}>
              ↻ REFRESH
            </button>
          </div>
        </div>

        {/* ── TOP STATS ── */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
          <StatCard icon="👥" label="Active Now" value={data?.activeNow || 0} sub="in last 2 minutes" color="#14F195" />
          <StatCard icon="🌍" label="Total Visitors" value={(data?.totalUniqueVisitors || 0).toLocaleString()} sub="unique devices ever" color="#9945FF" />
          <StatCard icon="🎮" label="Active Games" value={data?.activeGames || 0} sub="rooms in play right now" color="#FF6FD8" />
          <StatCard icon="🏆" label="Games Today" value={data?.gamesStartedToday || 0} sub="started in last 24h" color="#E8B84B" />
          <StatCard icon="🔗" label="Wallets Connected" value={data?.walletConnections || 0} sub="all time" color="#00C2FF" />
          <StatCard icon="🏠" label="Total Rooms" value={data?.totalRooms || 0} sub={`${data?.roomsToday || 0} today`} color="#FF6432" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

          {/* ── ACTIVE SESSIONS ── */}
          <div style={{ padding:'20px', borderRadius:16, background:'rgba(20,241,149,0.05)', border:'1.5px solid rgba(20,241,149,0.15)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <PulsingDot color="#14F195" />
              <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#14F195', letterSpacing:'0.1em' }}>
                WHO'S ONLINE NOW ({data?.activeNow || 0})
              </span>
            </div>
            {data?.activeSessions && data.activeSessions.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
                {data.activeSessions.map((s: any) => (
                  <div key={s.visitor_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(20,241,149,0.07)', border:'1px solid rgba(20,241,149,0.12)' }}>
                    <PulsingDot color="#14F195" />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(245,230,200,0.85)' }}>
                        {s.player_name || 'Anonymous'}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(245,230,200,0.4)', marginTop:2 }}>
                        {s.current_screen} {s.game_mode ? `· ${s.game_mode}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:'rgba(245,230,200,0.3)' }}>
                      {new Date(s.last_heartbeat).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(245,230,200,0.25)', fontSize:13 }}>
                No active sessions right now
              </div>
            )}
          </div>

          {/* ── ROOM BREAKDOWN ── */}
          <div style={{ padding:'20px', borderRadius:16, background:'rgba(153,69,255,0.05)', border:'1.5px solid rgba(153,69,255,0.15)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#9945FF', letterSpacing:'0.1em', marginBottom:16 }}>
              ROOM STATUS
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {[
                { label:'Waiting for players (today)', value: data?.waitingRooms || 0, color:'#E8B84B' },
                { label:'Active games (last 10 min)', value: data?.activeGames || 0, color:'#14F195' },
                { label:'Completed all time', value: data?.completedGames || 0, color:'rgba(245,230,200,0.4)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:13, color:'rgba(245,230,200,0.7)' }}>{label}</div>
                  <div style={{ fontSize:16, fontWeight:900, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Mode breakdown */}
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em', marginBottom:10 }}>BY MODE (TODAY)</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(data?.modeCounts || {}).map(([mode, count]) => (
                <div key={mode} style={{ padding:'4px 10px', borderRadius:20, background:`${modeColors[mode] || '#9945FF'}18`, border:`1px solid ${modeColors[mode] || '#9945FF'}44`, fontSize:12, fontWeight:700, color:modeColors[mode] || '#9945FF' }}>
                  {mode}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RECENT ROOMS ── */}
        <div style={{ padding:'20px', borderRadius:16, background:'rgba(26,20,16,0.8)', border:'1.5px solid rgba(232,184,75,0.12)', marginBottom:24 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#E8B84B', letterSpacing:'0.1em', marginBottom:16 }}>
            RECENT ROOMS
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Code', 'Mode', 'Status', 'Created', 'Host'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.1em', borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRooms.map(room => (
                  <tr key={room.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:14, fontWeight:700, color:'#9945FF', letterSpacing:'0.15em' }}>{room.code}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ padding:'3px 8px', borderRadius:20, background:`${modeColors[room.mode] || '#9945FF'}18`, border:`1px solid ${modeColors[room.mode] || '#9945FF'}44`, fontSize:11, fontWeight:700, color:modeColors[room.mode] || '#9945FF' }}>{room.mode}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ padding:'3px 8px', borderRadius:20, background: room.status==='playing'?'rgba(20,241,149,0.12)': room.status==='finished'?'rgba(255,255,255,0.06)':'rgba(232,184,75,0.12)', fontSize:11, fontWeight:700, color: room.status==='playing'?'#14F195': room.status==='finished'?'rgba(245,230,200,0.4)':'#E8B84B' }}>
                        {room.status}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'rgba(245,230,200,0.5)' }}>
                      {new Date(room.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:'rgba(245,230,200,0.4)', fontFamily:'monospace' }}>
                      {room.host_id?.substring(0, 12)}...
                    </td>
                  </tr>
                ))}
                {recentRooms.length === 0 && (
                  <tr><td colSpan={5} style={{ padding:'24px', textAlign:'center', color:'rgba(245,230,200,0.25)', fontSize:13 }}>No rooms yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RECENT EVENTS ── */}
        <div style={{ padding:'20px', borderRadius:16, background:'rgba(26,20,16,0.8)', border:'1.5px solid rgba(232,184,75,0.12)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#E8B84B', letterSpacing:'0.1em', marginBottom:16 }}>
            LIVE EVENT STREAM
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
            {recentEvents.map(ev => (
              <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:eventColors[ev.event_type] || '#9945FF', flexShrink:0 }} />
                <div style={{ flex:1, fontSize:12, color:'rgba(245,230,200,0.7)' }}>
                  <strong style={{ color:eventColors[ev.event_type] || '#9945FF' }}>{ev.event_type}</strong>
                  {ev.metadata?.playerName ? ` · ${ev.metadata.playerName}` : ''}
                  {ev.metadata?.mode ? ` · ${ev.metadata.mode}` : ''}
                </div>
                <div style={{ fontSize:10, color:'rgba(245,230,200,0.3)', whiteSpace:'nowrap' as const }}>
                  {new Date(ev.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <div style={{ textAlign:'center', padding:'24px', color:'rgba(245,230,200,0.25)', fontSize:13 }}>No events yet</div>
            )}
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:24, fontSize:12, color:'rgba(245,230,200,0.2)' }}>
          KingdomSol Analytics · Powered by Supabase Realtime
        </div>
      </div>

      <style>{`
        @keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
        ::-webkit-scrollbar-thumb{background:rgba(153,69,255,0.4);border-radius:2px}
      `}</style>
    </div>
  );
}

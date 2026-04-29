'use client';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore, CHARACTERS } from '@/lib/store';
import { fetchGlobalLeaderboard, fetchPlayerRank, getPlayerId, supabase } from '@/lib/supabase';

const TABS = [
  { id: 'xp',       label: 'XP',         icon: '⚡', col: 'xp' },
  { id: 'wins',     label: 'Wins',        icon: '🏆', col: 'games_won' },
  { id: 'streak',   label: 'Streak',      icon: '🔥', col: 'best_streak' },
  { id: 'mp',       label: 'Multiplayer', icon: '⚔️', col: 'multiplayer_wins' },
];

const RANK_ICONS: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' };
const RANK_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function SkeletonRow() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.03)', marginBottom:6 }}>
      <div style={{ width:28, height:14, borderRadius:4, background:'rgba(255,255,255,0.08)', animation:'shimmer 1.5s infinite' }} />
      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.06)', animation:'shimmer 1.5s infinite' }} />
      <div style={{ flex:1 }}>
        <div style={{ width:'40%', height:12, borderRadius:3, background:'rgba(255,255,255,0.08)', marginBottom:6, animation:'shimmer 1.5s infinite' }} />
        <div style={{ width:'25%', height:10, borderRadius:3, background:'rgba(255,255,255,0.05)', animation:'shimmer 1.5s infinite' }} />
      </div>
      <div style={{ width:50, height:18, borderRadius:4, background:'rgba(255,255,255,0.07)', animation:'shimmer 1.5s infinite' }} />
    </div>
  );
}

export function LeaderboardScreen() {
  const { setScreen, profile } = useGameStore();
  const [activeTab, setActiveTab] = useState('xp');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<any | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const playerId = getPlayerId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalLeaderboard(100);
      // Sort by active tab
      const tab = TABS.find(t => t.id === activeTab);
      const sorted = [...data].sort((a, b) => (b[tab?.col || 'xp'] || 0) - (a[tab?.col || 'xp'] || 0));
      setEntries(sorted);

      const me = sorted.find((e: any) => e.player_id === playerId);
      setMyEntry(me || null);
      const rank = me ? sorted.indexOf(me) + 1 : null;
      setMyRank(rank);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [activeTab, playerId]);

  useEffect(() => { load(); }, [load]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const char = CHARACTERS.find(c => c.key === profile?.character) || CHARACTERS[0];
  const activeTabData = TABS.find(t => t.id === activeTab)!;

  const getStatValue = (entry: any) => {
    switch (activeTab) {
      case 'xp': return `${(entry.xp || 0).toLocaleString()} XP`;
      case 'wins': return `${entry.games_won || 0}W`;
      case 'streak': return `${entry.best_streak || 0} 🔥`;
      case 'mp': return `${entry.multiplayer_wins || 0}MP`;
      default: return '';
    }
  };

  const getStatColor = (entry: any, rank: number) => {
    if (rank <= 3) return RANK_COLORS[rank];
    if (entry.player_id === playerId) return char.accentColor;
    return 'rgba(245,230,200,0.7)';
  };

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 30% 0%, #1A0035 0%, #1A1410 50%, #0D0A08 100%)', display:'flex', flexDirection:'column' }}>
      <div className="pattern-kente" style={{ position:'fixed', inset:0, opacity:0.25, pointerEvents:'none' }} />

      {/* ── NAV ── */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(232,184,75,0.08)', background:'rgba(13,10,8,0.7)', backdropFilter:'blur(12px)' }}>
        <button onClick={() => setScreen('menu')} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.55)', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.08em' }}>← MENU</button>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'#E8B84B', letterSpacing:'0.12em' }}>
          🏆 LEADERBOARD
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 6px rgba(20,241,149,0.8)', animation:'livepulse 1.5s infinite' }} />
          <span style={{ fontFamily:'var(--font-display)', fontSize:10, color:'#14F195', fontWeight:700 }}>LIVE</span>
          <button onClick={load} style={{ padding:'5px 10px', borderRadius:6, background:'rgba(153,69,255,0.12)', border:'1px solid rgba(153,69,255,0.3)', color:'#9945FF', cursor:'pointer', fontSize:11, fontWeight:700 }}>↻</button>
        </div>
      </div>

      <div style={{ position:'relative', zIndex:5, maxWidth:640, margin:'0 auto', width:'100%', padding:'20px 16px', flex:1 }}>

        {/* ── MY RANK CARD ── */}
        {myEntry && (
          <div style={{ padding:'16px 20px', borderRadius:14, marginBottom:20, background:`linear-gradient(135deg, ${char.accentColor}15, rgba(26,20,16,0.97))`, border:`2px solid ${char.accentColor}44`, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:32 }}>{myEntry.avatar_symbol || char.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:char.accentColor, letterSpacing:'0.06em' }}>
                {myEntry.player_name} <span style={{ fontSize:10, color:'rgba(245,230,200,0.4)' }}>(you)</span>
              </div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.5)', marginTop:3 }}>
                {myEntry.games_won}W · {myEntry.games_played}G · {myEntry.best_streak}🔥 best streak
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, color:myRank && myRank <= 3 ? RANK_COLORS[myRank] : char.accentColor }}>
                {myRank ? (myRank <= 3 ? RANK_ICONS[myRank] : `#${myRank}`) : '--'}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'rgba(245,230,200,0.4)', marginTop:2 }}>
                {(myEntry.xp || 0).toLocaleString()} XP
              </div>
            </div>
          </div>
        )}

        {!myEntry && profile && (
          <div style={{ padding:'14px 18px', borderRadius:12, marginBottom:20, background:'rgba(232,184,75,0.06)', border:'1px solid rgba(232,184,75,0.15)', textAlign:'center', fontFamily:'var(--font-display)', fontSize:12, color:'rgba(245,230,200,0.4)', letterSpacing:'0.06em' }}>
            Play a game to appear on the leaderboard!
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(26,20,16,0.7)', padding:6, borderRadius:12, border:'1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex:1, padding:'9px 6px', borderRadius:8, cursor:'pointer', transition:'all 0.2s',
              background:activeTab===tab.id ? 'rgba(232,184,75,0.18)' : 'transparent',
              border:`1.5px solid ${activeTab===tab.id ? 'rgba(232,184,75,0.45)' : 'transparent'}`,
              color:activeTab===tab.id ? '#E8B84B' : 'rgba(245,230,200,0.4)',
              fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.05em',
            }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── STATS SUMMARY ── */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[
            { label:'Total Players', value:entries.length },
            { label:'Active Today', value:entries.filter(e => new Date(e.last_played) > new Date(Date.now()-86400000)).length },
            { label:'Multiplayer Wins', value:entries.reduce((s,e)=>s+(e.multiplayer_wins||0),0) },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(26,20,16,0.7)', border:'1px solid rgba(232,184,75,0.08)', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#9945FF' }}>{value}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.08em', marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── ENTRIES ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : entries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0' }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🎴</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.08em' }}>No players yet</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.25)', marginTop:8 }}>Be the first to play and claim the top spot!</div>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = idx + 1;
              const entryChar = CHARACTERS.find(c => c.key === entry.character_key) || CHARACTERS[0];
              const isMe = entry.player_id === playerId;
              const isTop3 = rank <= 3;
              const winRate = entry.games_played > 0
                ? Math.round((entry.games_won / entry.games_played) * 100)
                : 0;

              return (
                <div key={entry.player_id} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12,
                  background: isMe
                    ? `linear-gradient(135deg, ${char.accentColor}12, rgba(26,20,16,0.9))`
                    : isTop3
                    ? `linear-gradient(135deg, ${RANK_COLORS[rank]}08, rgba(26,20,16,0.85))`
                    : 'rgba(26,20,16,0.6)',
                  border:`1.5px solid ${isMe ? char.accentColor+'44' : isTop3 ? RANK_COLORS[rank]+'33' : 'rgba(255,255,255,0.05)'}`,
                  transition:'all 0.2s',
                  animation: isMe ? 'none' : undefined,
                }}>
                  {/* Rank */}
                  <div style={{ minWidth:32, textAlign:'center', fontFamily:'var(--font-display)', fontSize: isTop3?22:14, fontWeight:900, color:RANK_COLORS[rank] || 'rgba(245,230,200,0.35)' }}>
                    {RANK_ICONS[rank] || `#${rank}`}
                  </div>

                  {/* Avatar */}
                  <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:`radial-gradient(circle, ${entryChar.accentColor}44, ${entryChar.color}77)`, border:`2px solid ${isMe?char.accentColor:entryChar.accentColor}${isMe?'88':'44'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:isTop3?`0 0 12px ${RANK_COLORS[rank]}44`:undefined }}>
                    {entry.avatar_symbol || entryChar.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:isMe?char.accentColor:isTop3?RANK_COLORS[rank]:'rgba(245,230,200,0.85)', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>
                      {entry.player_name}
                      {isMe && <span style={{ fontSize:9, color:'rgba(245,230,200,0.4)', marginLeft:6 }}>(you)</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.4)', marginTop:2 }}>
                      LVL {entry.level} · {entry.games_won}W / {entry.games_played}G · {winRate}% WR
                      {entry.multiplayer_wins > 0 && ` · ${entry.multiplayer_wins}⚔️MP`}
                    </div>
                  </div>

                  {/* Stat value */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:900, color:getStatColor(entry, rank) }}>
                      {getStatValue(entry)}
                    </div>
                    {activeTab !== 'xp' && (
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(245,230,200,0.3)', marginTop:2 }}>
                        {(entry.xp || 0).toLocaleString()} XP
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Last updated */}
        <div style={{ textAlign:'center', marginTop:24, fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.2)' }}>
          Updated {lastUpdated.toLocaleTimeString()} · Powered by Supabase Realtime
        </div>
      </div>

      <style>{`
        @keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}
        @keyframes shimmer{0%,100%{opacity:0.5}50%{opacity:1}}
      `}</style>
    </div>
  );
}

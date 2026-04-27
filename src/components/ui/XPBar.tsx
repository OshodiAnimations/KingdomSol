'use client';
import { useGameStore, CHARACTERS, levelFromXp } from '@/lib/store';

export function XPBar({ xp, level, compact=false }: { xp:number; level:number; compact?:boolean }) {
  const xpForLevel=(l:number)=>l*l*100;
  const current=xp-xpForLevel(level-1);
  const needed=xpForLevel(level)-xpForLevel(level-1);
  const pct=Math.min((current/needed)*100,100);
  if(compact){
    return (
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
        <div className="xp-bar" style={{ width:60 }}><div className="xp-fill" style={{ width:`${pct}%` }} /></div>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(245,230,200,0.35)' }}>{xp} XP</span>
      </div>
    );
  }
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'#9945FF', letterSpacing:'0.1em' }}>LEVEL {level}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(245,230,200,0.35)' }}>{xp} / {xpForLevel(level)} XP</span>
      </div>
      <div className="xp-bar"><div className="xp-fill" style={{ width:`${pct}%` }} /></div>
    </div>
  );
}

export function ProfileScreen() {
  const { profile, wallet, setScreen } = useGameStore();

  if (!profile) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at center, #2C1A08 0%, #0D0A08 100%)' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'#E8B84B', marginBottom:16 }}>No Profile Found</div>
        <button className="btn-primary" style={{ fontSize:13, padding:'12px 28px', fontWeight:900 }} onClick={() => setScreen('name_setup')}>CREATE PROFILE</button>
      </div>
    );
  }

  const char = CHARACTERS.find(c => c.key === profile.character) || CHARACTERS[0];
  const winRate = profile.gamesPlayed > 0 ? ((profile.gamesWon / profile.gamesPlayed) * 100).toFixed(1) : '0.0';
  const lossCount = profile.gamesPlayed - profile.gamesWon;
  const memberDays = Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 30% 10%, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)' }}>
      <div className="pattern-kente" style={{ position:'fixed', inset:0, opacity:0.3, pointerEvents:'none' }} />

      {/* Nav */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 28px', borderBottom:'1px solid rgba(232,184,75,0.08)', background:'rgba(13,10,8,0.6)', backdropFilter:'blur(12px)' }}>
        <button onClick={() => setScreen('menu')} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.6)', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.08em' }}>← MENU</button>
        <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:900, color:'#E8B84B', letterSpacing:'0.12em' }}>PROFILE</span>
        <div style={{ width:80 }} />
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'28px 24px', position:'relative', zIndex:5 }}>

        {/* Hero card */}
        <div style={{
          padding:'28px 28px', borderRadius:20, marginBottom:20,
          background:`linear-gradient(135deg, ${char.accentColor}18 0%, rgba(26,20,16,0.95) 60%, ${char.color}18 100%)`,
          border:`2px solid ${char.accentColor}33`,
          display:'flex', alignItems:'center', gap:24, flexWrap:'wrap',
        }}>
          <div style={{
            width:88, height:88, borderRadius:'50%', flexShrink:0,
            background:`radial-gradient(circle at 40% 35%, ${char.accentColor}55, ${char.color}88)`,
            border:`3px solid ${char.accentColor}77`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:44, boxShadow:`0 0 30px ${char.accentColor}33`,
          }}>{char.icon}</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:char.accentColor, letterSpacing:'0.06em', marginBottom:3 }}>
              {profile.name}
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.5)', marginBottom:14 }}>
              {char.title} · {char.origin}
            </div>
            <XPBar xp={profile.xp} level={profile.level} />
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:44, fontWeight:900, color:char.accentColor, lineHeight:1 }}>{profile.level}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.1em', marginTop:4 }}>LEVEL</div>
            {wallet.connected && (
              <div style={{ marginTop:10, padding:'5px 12px', borderRadius:20, background:'rgba(20,241,149,0.1)', border:'1px solid rgba(20,241,149,0.25)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'#14F195' }}>
                ◎ {wallet.balances.SOL.toFixed(3)}
              </div>
            )}
          </div>
        </div>

        {/* Member since */}
        <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.3)', textAlign:'center', marginBottom:20 }}>
          Member for {memberDays === 0 ? 'less than a day' : `${memberDays} day${memberDays !== 1 ? 's' : ''}`}
        </div>

        {/* Ability */}
        <div style={{ padding:'14px 18px', borderRadius:12, marginBottom:20, background:`${char.accentColor}10`, border:`1.5px solid ${char.accentColor}25`, display:'flex', alignItems:'flex-start', gap:12 }}>
          <span style={{ fontSize:22, flexShrink:0 }}>⚡</span>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:char.accentColor, letterSpacing:'0.06em', marginBottom:4 }}>ABILITY: {char.ability.toUpperCase()}</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.55)' }}>{char.abilityDesc}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'Games Played', value:profile.gamesPlayed, color:'#E8B84B' },
            { label:'Games Won', value:profile.gamesWon, color:'#14F195' },
            { label:'Games Lost', value:lossCount, color:'#FF6FD8' },
            { label:'Win Rate', value:`${winRate}%`, color:'#9945FF' },
            { label:'SOL Earned', value:`◎ ${profile.solEarned.toFixed(3)}`, color:'#9945FF' },
            { label:'Cards Played', value:profile.cardsPlayed.toLocaleString(), color:'#00C2FF' },
            { label:'Best Streak', value:`${profile.bestStreak} 🔥`, color:'#FF6432' },
            { label:'Current Streak', value:`${profile.winStreak} 🏆`, color:'#E8B84B' },
            { label:'Total XP', value:profile.xp.toLocaleString(), color:'#9945FF' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding:'14px 12px', borderRadius:12, textAlign:'center', background:'rgba(26,20,16,0.7)', border:'1px solid rgba(232,184,75,0.08)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color, letterSpacing:'-0.01em', marginBottom:4 }}>{value}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Devnet info */}
        <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(20,241,149,0.05)', border:'1px solid rgba(20,241,149,0.12)', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(20,241,149,0.6)', letterSpacing:'0.1em', marginBottom:4 }}>🧪 DEVNET MODE</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.4)' }}>
            Get free SOL for testing at <strong style={{ color:'#14F195' }}>faucet.solana.com</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

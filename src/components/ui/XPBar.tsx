'use client';
import { useState } from 'react';
import { useGameStore, CHARACTERS, levelFromXp, KSL_PER_USDC, KSL_USDC_RATE, KSL_PER_MULTIPLAYER_GAME } from '@/lib/store';

export function XPBar({ xp, level, compact=false }: { xp:number; level:number; compact?:boolean }) {
  const xpForLevel=(l:number)=>l*l*100;
  const current=xp-xpForLevel(level-1);
  const needed=xpForLevel(level)-xpForLevel(level-1);
  const pct=Math.min(needed>0?(current/needed)*100:100,100);
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
  const { profile, wallet, setScreen, topUpKSL, withdrawKSL, notification } = useGameStore();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topUpUSDC, setTopUpUSDC] = useState('5');
  const [withdrawKSLAmt, setWithdrawKSLAmt] = useState('100');

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
  const memberDays = Math.floor((Date.now() - profile.createdAt) / (1000*60*60*24));
  const kslBal = profile.kslBalance;
  const kslUSDCValue = (kslBal * KSL_USDC_RATE).toFixed(2);
  const topUpKSLPreview = Math.floor(parseFloat(topUpUSDC || '0') * KSL_PER_USDC);
  const withdrawUSDCPreview = (parseFloat(withdrawKSLAmt || '0') * KSL_USDC_RATE).toFixed(2);

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 30% 10%, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)', paddingBottom:60 }}>
      <div className="pattern-kente" style={{ position:'fixed', inset:0, opacity:0.3, pointerEvents:'none' }} />

      {/* Nav */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 28px', borderBottom:'1px solid rgba(232,184,75,0.08)', background:'rgba(13,10,8,0.6)', backdropFilter:'blur(12px)' }}>
        <button onClick={() => setScreen('menu')} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.6)', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.08em' }}>← MENU</button>
        <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:900, color:'#E8B84B', letterSpacing:'0.12em' }}>PROFILE</span>
        <div style={{ width:80 }} />
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'24px 20px', position:'relative', zIndex:5 }}>

        {/* ── WALLET BALANCES (top) ── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.35)', letterSpacing:'0.2em', marginBottom:12 }}>
            WALLET BALANCES
          </div>

          {wallet.connected ? (
            <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
              {/* KSL Token (primary) */}
              <div style={{ padding:'16px 20px', background:'linear-gradient(135deg, rgba(232,184,75,0.12), rgba(26,20,16,0.95))', borderBottom:'1px solid rgba(232,184,75,0.12)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#E8B84B,#B8860B)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'#1A1410' }}>K</div>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'#E8B84B', letterSpacing:'0.06em' }}>KingdomSol Token</div>
                      <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:2 }}>KSL · Game currency · $0.01 per KSL</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'#E8B84B' }}>{kslBal.toLocaleString()}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)' }}>≈ ${kslUSDCValue} USDC</div>
                  </div>
                </div>
              </div>

              {/* Other tokens */}
              {[
                { symbol:'SOL', name:'Solana', color:'#9945FF', icon:'◎' },
                { symbol:'USDC', name:'USD Coin', color:'#2775CA', icon:'$' },
                { symbol:'BONK', name:'Bonk', color:'#F7931A', icon:'🐕' },
                { symbol:'JUP', name:'Jupiter', color:'#16B674', icon:'⬡' },
                { symbol:'WIF', name:'dogwifhat', color:'#E8B84B', icon:'🎩' },
              ].map(({ symbol, name, color, icon }) => (
                <div key={symbol} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', background:'rgba(26,20,16,0.6)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color }}>{icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color, letterSpacing:'0.04em' }}>{symbol}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.35)' }}>{name}</div>
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'rgba(245,230,200,0.7)', textAlign:'right' }}>
                    {typeof wallet.balances[symbol] === 'number'
                      ? wallet.balances[symbol] > 10000
                        ? Math.floor(wallet.balances[symbol]).toLocaleString()
                        : (wallet.balances[symbol] as number).toFixed(3)
                      : '0'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding:'24px', borderRadius:14, background:'rgba(26,20,16,0.7)', border:'1.5px dashed rgba(232,184,75,0.15)', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'rgba(245,230,200,0.4)', marginBottom:12 }}>Connect a wallet to see balances</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.3)' }}>Your KSL balance: {kslBal} KSL · ≈ ${kslUSDCValue} USDC</div>
            </div>
          )}
        </div>

        {/* ── TOP UP & WITHDRAW BUTTONS ── */}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <button onClick={() => { setShowTopUp(true); setShowWithdraw(false); }} style={{
            flex:1, padding:'14px', borderRadius:12, cursor:'pointer',
            background:'rgba(20,241,149,0.1)', border:'1.5px solid rgba(20,241,149,0.3)',
            fontFamily:'var(--font-display)', fontSize:13, fontWeight:900,
            color:'#14F195', letterSpacing:'0.08em', transition:'all 0.2s',
          }}>
            ⬆ TOP UP KSL
          </button>
          <button onClick={() => { setShowWithdraw(true); setShowTopUp(false); }} style={{
            flex:1, padding:'14px', borderRadius:12, cursor:'pointer',
            background:'rgba(153,69,255,0.1)', border:'1.5px solid rgba(153,69,255,0.3)',
            fontFamily:'var(--font-display)', fontSize:13, fontWeight:900,
            color:'#9945FF', letterSpacing:'0.08em', transition:'all 0.2s',
          }}>
            ⬇ WITHDRAW KSL
          </button>
        </div>

        {/* Top Up panel */}
        {showTopUp && (
          <div style={{ padding:'20px', borderRadius:14, marginBottom:16, background:'rgba(20,241,149,0.06)', border:'1.5px solid rgba(20,241,149,0.2)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'#14F195', letterSpacing:'0.12em', marginBottom:4 }}>TOP UP WITH USDC</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.45)', marginBottom:16 }}>
              $1 USDC = {KSL_PER_USDC} KSL tokens · Min $5 · Max $500
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              {[5,10,25,50,100,500].map(amt => (
                <button key={amt} onClick={() => setTopUpUSDC(String(amt))} style={{
                  padding:'6px 14px', borderRadius:7, cursor:'pointer',
                  background:topUpUSDC===String(amt)?'rgba(20,241,149,0.2)':'rgba(255,255,255,0.05)',
                  border:`1.5px solid ${topUpUSDC===String(amt)?'rgba(20,241,149,0.5)':'rgba(255,255,255,0.1)'}`,
                  color:topUpUSDC===String(amt)?'#14F195':'rgba(245,230,200,0.5)',
                  fontFamily:'var(--font-display)', fontSize:11, fontWeight:900,
                }}>${amt}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
              <div style={{ flex:1, padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:'var(--font-display)', fontSize:13, color:'rgba(245,230,200,0.5)' }}>
                ${topUpUSDC} USDC → <span style={{ color:'#14F195', fontWeight:900 }}>{topUpKSLPreview} KSL</span>
              </div>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.35)', marginBottom:14 }}>
              USDC balance: ${(wallet.balances['USDC']||0).toFixed(2)} · Each multiplayer game costs {KSL_PER_MULTIPLAYER_GAME} KSL
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:11, padding:'10px', fontWeight:900 }} onClick={() => setShowTopUp(false)}>CANCEL</button>
              <button className="btn-primary" style={{ flex:2, fontSize:12, padding:'10px', fontWeight:900 }}
                onClick={() => { topUpKSL(parseFloat(topUpUSDC)); setShowTopUp(false); }}>
                BUY {topUpKSLPreview} KSL
              </button>
            </div>
          </div>
        )}

        {/* Withdraw panel */}
        {showWithdraw && (
          <div style={{ padding:'20px', borderRadius:14, marginBottom:16, background:'rgba(153,69,255,0.06)', border:'1.5px solid rgba(153,69,255,0.2)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'#9945FF', letterSpacing:'0.12em', marginBottom:4 }}>WITHDRAW KSL → USDC</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.45)', marginBottom:16 }}>
              1 KSL = ${KSL_USDC_RATE} USDC · Your balance: {kslBal} KSL
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
              <input type="number" value={withdrawKSLAmt} min="1" max={kslBal} step="10"
                onChange={e => setWithdrawKSLAmt(e.target.value)}
                style={{ flex:1, padding:'12px', borderRadius:8, background:'rgba(255,255,255,0.07)', border:'2px solid rgba(153,69,255,0.3)', color:'#9945FF', fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' as const }}
              />
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'rgba(245,230,200,0.5)' }}>KSL</div>
            </div>
            <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:'var(--font-display)', fontSize:13, color:'rgba(245,230,200,0.6)', marginBottom:14, textAlign:'center' }}>
              {withdrawKSLAmt} KSL → <span style={{ color:'#9945FF', fontWeight:900 }}>${withdrawUSDCPreview} USDC</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:11, padding:'10px', fontWeight:900 }} onClick={() => setShowWithdraw(false)}>CANCEL</button>
              <button className="btn-primary" style={{ flex:2, fontSize:12, padding:'10px', fontWeight:900, background:'linear-gradient(135deg,#9945FF,#6B2FCC)' }}
                onClick={() => { withdrawKSL(parseFloat(withdrawKSLAmt)); setShowWithdraw(false); }}>
                WITHDRAW ${withdrawUSDCPreview} USDC
              </button>
            </div>
          </div>
        )}

        {/* ── HERO CARD ── */}
        <div style={{ padding:'24px', borderRadius:20, marginBottom:16, background:`linear-gradient(135deg, ${char.accentColor}18 0%, rgba(26,20,16,0.95) 60%, ${char.color}18 100%)`, border:`2px solid ${char.accentColor}33`, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', flexShrink:0, background:`radial-gradient(circle at 40% 35%, ${char.accentColor}55, ${char.color}88)`, border:`3px solid ${char.accentColor}77`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, boxShadow:`0 0 30px ${char.accentColor}33` }}>{char.icon}</div>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:char.accentColor, letterSpacing:'0.06em', marginBottom:3 }}>{profile.name}</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.5)', marginBottom:12 }}>{char.title} · {char.origin} · {memberDays === 0 ? 'Joined today' : `${memberDays}d ago`}</div>
            <XPBar xp={profile.xp} level={profile.level} />
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:40, fontWeight:900, color:char.accentColor, lineHeight:1 }}>{profile.level}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.1em', marginTop:3 }}>LEVEL</div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'Games Played', value:profile.gamesPlayed, color:'#E8B84B' },
            { label:'Games Won', value:profile.gamesWon, color:'#14F195' },
            { label:'Games Lost', value:lossCount, color:'#FF6FD8' },
            { label:'Win Rate', value:`${winRate}%`, color:'#9945FF' },
            { label:'Best Streak', value:`${profile.bestStreak}🔥`, color:'#FF6432' },
            { label:'Cards Played', value:profile.cardsPlayed.toLocaleString(), color:'#00C2FF' },
            { label:'KSL Balance', value:`${kslBal} KSL`, color:'#E8B84B' },
            { label:'KSL Spent', value:`${profile.kslSpent} KSL`, color:'rgba(245,230,200,0.4)' },
            { label:'MP Games', value:profile.multiplayerGamesPlayed, color:'#9945FF' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding:'12px 10px', borderRadius:10, textAlign:'center', background:'rgba(26,20,16,0.7)', border:'1px solid rgba(232,184,75,0.07)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color, letterSpacing:'-0.01em', marginBottom:3 }}>{value}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── DEVNET NOTICE ── */}
        <div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(20,241,149,0.05)', border:'1px solid rgba(20,241,149,0.12)', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'rgba(20,241,149,0.55)', letterSpacing:'0.12em', marginBottom:3 }}>🧪 DEVNET MODE</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.35)' }}>
            Get free SOL at <strong style={{ color:'#14F195' }}>faucet.solana.com</strong> · No real money involved
          </div>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:200, padding:'12px 24px', borderRadius:10, whiteSpace:'nowrap' as const, background:notification.type==='error'?'rgba(255,68,68,0.18)':notification.type==='success'?'rgba(20,241,149,0.15)':'rgba(232,184,75,0.15)', border:`1.5px solid ${notification.type==='error'?'rgba(255,68,68,0.5)':notification.type==='success'?'rgba(20,241,149,0.5)':'rgba(232,184,75,0.5)'}`, backdropFilter:'blur(12px)', fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:notification.type==='error'?'#FF8888':notification.type==='success'?'#14F195':'#E8B84B' }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

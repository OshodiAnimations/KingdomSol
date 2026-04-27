'use client';
import { useState } from 'react';
import { useGameStore, CHARACTERS, GameMode, MultiMode, TokenSymbol } from '@/lib/store';
import { GameCard } from '@/components/cards/GameCard';
import { WalletChip } from '@/components/wallet/WalletChip';
import { Card } from '@/lib/store';

const FLOAT_CARDS: Card[] = [
  { id:'f1', suit:'cowrie', value:'WHOT' },
  { id:'f2', suit:'manilla', value:'7' },
  { id:'f3', suit:'spearhead', value:'2', special:'pick2' },
  { id:'f4', suit:'bead', value:'14', special:'general_market' },
  { id:'f5', suit:'amole', value:'5', special:'pick4' },
  { id:'f6', suit:'cowrie', value:'8', special:'suspension' },
  { id:'f7', suit:'manilla', value:'11' },
  { id:'f8', suit:'bead', value:'3' },
];

const MULTI_MODES: { key: MultiMode; label: string; desc: string; icon: string; accent: string }[] = [
  { key:'war', label:'War Mode', desc:'Full game, highest stakes, last one standing', icon:'⚔️', accent:'#FF6FD8' },
  { key:'friendly', label:'Friendly Mode', desc:'Casual play, no stakes, just for fun', icon:'🤝', accent:'#14F195' },
  { key:'raid', label:'Raid Mode', desc:'3 cards only · 3 min timer · Roulette style', icon:'💥', accent:'#FF6432' },
];

export function MenuScreen() {
  const { profile, initGame, setScreen, generateInviteCode, joinWithCode, stakeToken, stakeAmount, setStake, musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useGameStore();
  const [showMultiPanel, setShowMultiPanel] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showStake, setShowStake] = useState(false);

  const char = CHARACTERS.find(c => c.key === profile?.character) || CHARACTERS[0];

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', background:'radial-gradient(ellipse at 30% 20%, #2C1A08 0%, #1A1410 50%, #0D0A08 100%)' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.4 }} />

      {/* Floating cards bg */}
      {FLOAT_CARDS.map((card, i) => (
        <div key={card.id} style={{
          position:'absolute', left:`${10+(i*11)%80}%`, top:`${5+(i*13)%80}%`,
          opacity:0.04+(i%3)*0.02, transform:`rotate(${-20+i*7}deg)`,
          animation:`float ${4+i*0.5}s ease-in-out ${i*0.3}s infinite`, pointerEvents:'none',
        }}>
          <GameCard card={card} size="lg" />
        </div>
      ))}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 0%, rgba(13,10,8,0.6) 50%, rgba(13,10,8,0.97) 100%)', pointerEvents:'none' }} />

      {/* NAV */}
      <div style={{
        position:'relative', zIndex:10,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 28px', flexWrap:'wrap', gap:10,
      }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, letterSpacing:'0.1em' }}>
          <span className="text-gold-shimmer">KINGDOM</span>
          <span style={{ color:'#14F195' }}>SOL</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Sound toggles */}
          <button onClick={toggleMusic} title={musicEnabled?'Mute Music':'Play Music'} style={{
            padding:'7px 12px', borderRadius:8, cursor:'pointer',
            background:musicEnabled?'rgba(20,241,149,0.12)':'rgba(255,255,255,0.05)',
            border:`1.5px solid ${musicEnabled?'rgba(20,241,149,0.4)':'rgba(255,255,255,0.12)'}`,
            color:musicEnabled?'#14F195':'rgba(245,230,200,0.4)', fontSize:18, lineHeight:1,
          }}>{musicEnabled?'🎵':'🔇'}</button>

          <button onClick={toggleSfx} title={sfxEnabled?'Mute SFX':'Enable SFX'} style={{
            padding:'7px 12px', borderRadius:8, cursor:'pointer',
            background:sfxEnabled?'rgba(20,241,149,0.12)':'rgba(255,255,255,0.05)',
            border:`1.5px solid ${sfxEnabled?'rgba(20,241,149,0.4)':'rgba(255,255,255,0.12)'}`,
            color:sfxEnabled?'#14F195':'rgba(245,230,200,0.4)', fontSize:18, lineHeight:1,
          }}>{sfxEnabled?'🔊':'🔈'}</button>

          <button onClick={() => setScreen('profile')} style={{
            background:'transparent', border:'1.5px solid rgba(232,184,75,0.25)',
            color:'rgba(245,230,200,0.6)', padding:'7px 14px', borderRadius:8,
            cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.1em',
          }}>PROFILE</button>

          <WalletChip compact />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position:'relative', zIndex:10, maxWidth:960, margin:'0 auto', padding:'20px 28px 0', textAlign:'center' }}>
        {/* Welcome back */}
        {profile && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:10, marginBottom:16,
            padding:'8px 18px', borderRadius:20,
            background:`${char.accentColor}15`, border:`1px solid ${char.accentColor}33`,
          }}>
            <span style={{ fontSize:20 }}>{char.icon}</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:char.accentColor, letterSpacing:'0.06em' }}>
              {profile.name}
            </span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'rgba(245,230,200,0.4)' }}>
              LVL {profile.level} · {profile.gamesWon}W / {profile.gamesPlayed}G
            </span>
          </div>
        )}

        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(40px,8vw,80px)', fontWeight:900, lineHeight:1, margin:'0 0 8px', letterSpacing:'0.05em' }}>
          <span className="text-gold-shimmer">KINGDOM</span><br />
          <span style={{ color:'#14F195', textShadow:'0 0 40px rgba(20,241,149,0.4)' }}>SOL</span>
        </h1>

        <p style={{ fontFamily:'var(--font-body)', fontSize:17, color:'rgba(245,230,200,0.55)', maxWidth:480, margin:'14px auto 32px', lineHeight:1.6 }}>
          A time traveller stranded in 2030 must rebuild ancient wealth in Solana — or be lost to history forever.
        </p>

        {/* Stake panel toggle */}
        <div style={{ marginBottom:24, display:'flex', justifyContent:'center' }}>
          <button onClick={() => setShowStake(!showStake)} style={{
            padding:'8px 20px', borderRadius:20,
            background:'rgba(232,184,75,0.08)', border:'1px solid rgba(232,184,75,0.2)',
            color:'rgba(232,184,75,0.8)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900,
            cursor:'pointer', letterSpacing:'0.08em',
          }}>
            💰 STAKE: {stakeAmount} {stakeToken} {showStake?'▲':'▼'}
          </button>
        </div>

        {showStake && (
          <div style={{ maxWidth:360, margin:'0 auto 20px', padding:'18px 20px', borderRadius:14, background:'rgba(26,20,16,0.95)', border:'1px solid rgba(232,184,75,0.2)', backdropFilter:'blur(12px)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.15em', marginBottom:12 }}>SET YOUR STAKE</div>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap', justifyContent:'center' }}>
              {(['SOL','USDC','BONK','JUP','WIF'] as TokenSymbol[]).map(t => (
                <button key={t} onClick={() => setStake(t, stakeAmount)} style={{
                  padding:'5px 12px', borderRadius:6, cursor:'pointer',
                  background:stakeToken===t?'rgba(153,69,255,0.2)':'rgba(255,255,255,0.05)',
                  border:`1.5px solid ${stakeToken===t?'rgba(153,69,255,0.5)':'rgba(255,255,255,0.1)'}`,
                  color:stakeToken===t?'#9945FF':'rgba(245,230,200,0.5)',
                  fontFamily:'var(--font-display)', fontSize:11, fontWeight:900,
                }}>{t}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input type="number" value={stakeAmount} step="0.01" min="0"
                onChange={e => setStake(stakeToken, e.target.value)}
                style={{ flex:1, padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(232,184,75,0.25)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, outline:'none', boxSizing:'border-box' as const }}
              />
              <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'rgba(245,230,200,0.6)', minWidth:50 }}>{stakeToken}</div>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.3)', marginTop:8, textAlign:'center' }}>
              Any amount — no minimum on devnet
            </div>
          </div>
        )}

        {/* MODES */}
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:32 }}>
          {[
            { mode:'story' as GameMode, label:'Story Mode', desc:'The Time Thief Returns', icon:'📜', accent:'#E8B84B' },
            { mode:'classic' as GameMode, label:'Classic Mode', desc:'WHOT-style vs bots', icon:'🎴', accent:'#14F195' },
          ].map(({ mode, label, desc, icon, accent }) => (
            <div key={mode} style={{
              width:180, padding:'20px 16px', borderRadius:16, cursor:'pointer',
              background:'rgba(26,20,16,0.7)', border:`1.5px solid rgba(232,184,75,0.12)`,
              transition:'all 0.25s', backdropFilter:'blur(10px)', textAlign:'center',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-5px)'; (e.currentTarget as HTMLElement).style.background=`${accent}10`; (e.currentTarget as HTMLElement).style.borderColor=`${accent}44`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.background='rgba(26,20,16,0.7)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(232,184,75,0.12)'; }}
            >
              <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:900, color:accent, letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.45)', marginBottom:16 }}>{desc}</div>
              <button className="btn-primary" style={{ width:'100%', fontSize:12, padding:'10px', letterSpacing:'0.1em', fontWeight:900 }}
                onClick={() => initGame(mode)}
              >PLAY</button>
            </div>
          ))}

          {/* Multiplayer */}
          <div style={{
            width:200, padding:'20px 16px', borderRadius:16,
            background:showMultiPanel?'rgba(153,69,255,0.12)':'rgba(26,20,16,0.7)',
            border:`1.5px solid ${showMultiPanel?'rgba(153,69,255,0.4)':'rgba(232,184,75,0.12)'}`,
            transition:'all 0.25s', backdropFilter:'blur(10px)', textAlign:'center',
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⚔️</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:900, color:'#9945FF', letterSpacing:'0.08em', marginBottom:6 }}>Multiplayer</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.45)', marginBottom:16 }}>2–5 players, invite codes</div>
            <button className="btn-primary" style={{ width:'100%', fontSize:12, padding:'10px', letterSpacing:'0.1em', fontWeight:900, background:'linear-gradient(135deg,#9945FF,#6B2FCC)' }}
              onClick={() => setShowMultiPanel(!showMultiPanel)}
            >{showMultiPanel?'CLOSE ▲':'SELECT MODE'}</button>
          </div>
        </div>

        {/* Multiplayer sub-modes */}
        {showMultiPanel && (
          <div style={{ maxWidth:640, margin:'0 auto 28px', padding:'20px', borderRadius:16, background:'rgba(26,20,16,0.95)', border:'1.5px solid rgba(153,69,255,0.25)', backdropFilter:'blur(12px)', animation:'panel-drop 0.3s ease-out' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'rgba(153,69,255,0.7)', letterSpacing:'0.2em', marginBottom:16 }}>CHOOSE YOUR BATTLE</div>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:20 }}>
              {MULTI_MODES.map(({ key, label, desc, icon, accent }) => (
                <div key={key} style={{
                  flex:'1 1 160px', maxWidth:190, padding:'16px 14px', borderRadius:12,
                  background:`${accent}0e`, border:`1.5px solid ${accent}33`,
                  textAlign:'center', cursor:'pointer', transition:'all 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=`${accent}20`; (e.currentTarget as HTMLElement).style.borderColor=`${accent}66`; (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=`${accent}0e`; (e.currentTarget as HTMLElement).style.borderColor=`${accent}33`; (e.currentTarget as HTMLElement).style.transform='none'; }}
                >
                  <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:accent, letterSpacing:'0.06em', marginBottom:5 }}>{label}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.45)', marginBottom:14, lineHeight:1.4 }}>{desc}</div>
                  <button style={{
                    width:'100%', padding:'8px', borderRadius:7, border:'none',
                    background:`linear-gradient(135deg,${accent},${accent}99)`,
                    color:'#1A1410', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900,
                    cursor:'pointer', letterSpacing:'0.08em',
                  }}
                    onClick={() => generateInviteCode(key)}
                  >CREATE ROOM</button>
                </div>
              ))}
            </div>

            {/* Join with code */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.35)', letterSpacing:'0.15em', marginBottom:10 }}>JOIN EXISTING ROOM</div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0,6))}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  style={{
                    flex:1, padding:'10px 14px', borderRadius:8,
                    background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(153,69,255,0.35)',
                    color:'#9945FF', fontFamily:'var(--font-display)', fontSize:18, fontWeight:900,
                    outline:'none', letterSpacing:'0.18em', textAlign:'center', boxSizing:'border-box' as const,
                  }}
                />
                <button className="btn-primary" style={{ fontSize:12, padding:'10px 20px', fontWeight:900, whiteSpace:'nowrap' as const }}
                  onClick={() => { if(joinCode.length>=4)joinWithCode(joinCode); }}
                >JOIN ROOM</button>
              </div>
            </div>
          </div>
        )}

        {/* Devnet notice */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8, marginBottom:40,
          padding:'8px 18px', borderRadius:20,
          background:'rgba(20,241,149,0.06)', border:'1px solid rgba(20,241,149,0.15)',
          fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
          color:'rgba(20,241,149,0.6)', letterSpacing:'0.08em',
        }}>
          🧪 RUNNING ON SOLANA DEVNET · Get free SOL at faucet.solana.com
        </div>
      </div>

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-14px) rotate(calc(var(--r,0deg)+3deg))}}
        @keyframes panel-drop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

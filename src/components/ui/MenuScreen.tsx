'use client';
import { useState } from 'react';
import { useGameStore, CHARACTERS, CharacterKey, GameMode, TOKEN_PRICES_USD, TokenSymbol } from '@/lib/store';
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

export function MenuScreen() {
  const { initGame, setScreen, wallet, toggleWalletModal, network, setNetwork, generateInviteCode, joinWithCode, stakeToken, stakeAmount, setStake } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<CharacterKey>('okonkwo');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showStakePanel, setShowStakePanel] = useState(false);

  const selectedCharData = CHARACTERS.find(c => c.key === selectedChar)!;
  const minSOLStake = (0.5 / TOKEN_PRICES_USD[stakeToken]).toFixed(4);

  const handleStart = (mode: GameMode) => {
    if (mode === 'multiplayer') {
      generateInviteCode();
    } else {
      initGame(mode, selectedChar);
    }
  };

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', background:'radial-gradient(ellipse at 30% 20%, #2C1A08 0%, #1A1410 50%, #0D0A08 100%)' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.4 }} />

      {/* Floating cards */}
      {FLOAT_CARDS.map((card, i) => (
        <div key={card.id} style={{
          position:'absolute', left:`${10+(i*11)%80}%`, top:`${5+(i*13)%80}%`,
          opacity:0.05+(i%3)*0.02, transform:`rotate(${-20+i*7}deg)`,
          animation:`float ${4+i*0.5}s ease-in-out ${i*0.3}s infinite`, pointerEvents:'none',
        }}>
          <GameCard card={card} size="lg" />
        </div>
      ))}

      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 0%, rgba(13,10,8,0.5) 50%, rgba(13,10,8,0.97) 100%)', pointerEvents:'none' }} />

      {/* NAV */}
      <div style={{
        position:'relative', zIndex:10,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'18px 32px',
      }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, letterSpacing:'0.1em' }}>
          <span className="text-gold-shimmer">KINGDOM</span>
          <span style={{ color:'#14F195' }}>SOL</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Network switcher */}
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
            {(['devnet','mainnet'] as const).map(n => (
              <button key={n} onClick={() => setNetwork(n)} style={{
                padding:'6px 14px',
                background:network===n?'rgba(153,69,255,0.3)':'transparent',
                border:'none', cursor:'pointer',
                fontFamily:'var(--font-display)', fontSize:10, fontWeight:700,
                color:network===n?'#9945FF':'rgba(245,230,200,0.4)',
                letterSpacing:'0.08em', textTransform:'uppercase',
                transition:'all 0.2s',
              }}>{n}</button>
            ))}
          </div>
          <button onClick={() => setScreen('profile')} style={{
            background:'transparent', border:'1px solid rgba(232,184,75,0.2)',
            color:'rgba(245,230,200,0.5)', padding:'6px 14px', borderRadius:6,
            cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'0.1em',
          }}>PROFILE</button>
          <WalletChip compact />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position:'relative', zIndex:10, maxWidth:960, margin:'0 auto', padding:'24px 32px 0', textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:13, letterSpacing:'0.3em', color:'rgba(232,184,75,0.7)', textTransform:'uppercase', marginBottom:14 }}>
          Ancient Wealth · Modern Chain · {network === 'devnet' ? '🧪 Devnet' : '⛓️ Mainnet'}
        </div>

        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(44px,9vw,88px)', fontWeight:900, lineHeight:1, margin:'0 0 8px', letterSpacing:'0.05em' }}>
          <span className="text-gold-shimmer">KINGDOM</span><br />
          <span style={{ color:'#14F195', textShadow:'0 0 40px rgba(20,241,149,0.4)' }}>SOL</span>
        </h1>

        <p style={{ fontFamily:'var(--font-body)', fontSize:17, color:'rgba(245,230,200,0.55)', maxWidth:500, margin:'16px auto 36px', lineHeight:1.6 }}>
          A time traveller stranded in 2030 must rebuild ancient wealth in Solana — or be lost to history forever.
        </p>

        {/* Stake quick panel */}
        <div style={{ marginBottom:24, display:'flex', justifyContent:'center' }}>
          <button onClick={() => setShowStakePanel(!showStakePanel)} style={{
            padding:'8px 20px', borderRadius:20,
            background:'rgba(232,184,75,0.08)', border:'1px solid rgba(232,184,75,0.25)',
            color:'rgba(232,184,75,0.8)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
            cursor:'pointer', letterSpacing:'0.08em',
          }}>
            💰 STAKE: {stakeAmount} {stakeToken} (min $0.50) {showStakePanel?'▲':'▼'}
          </button>
        </div>

        {showStakePanel && (
          <div style={{
            maxWidth:360, margin:'0 auto 20px', padding:'16px 20px', borderRadius:14,
            background:'rgba(26,20,16,0.9)', border:'1px solid rgba(232,184,75,0.2)',
            backdropFilter:'blur(12px)',
          }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.15em', marginBottom:12 }}>SET STAKE</div>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap', justifyContent:'center' }}>
              {(['SOL','USDC','BONK','JUP','WIF'] as TokenSymbol[]).map(t => (
                <button key={t} onClick={() => setStake(t, stakeAmount)} style={{
                  padding:'4px 12px', borderRadius:6, cursor:'pointer',
                  background:stakeToken===t?'rgba(153,69,255,0.2)':'rgba(255,255,255,0.05)',
                  border:`1px solid ${stakeToken===t?'rgba(153,69,255,0.5)':'rgba(255,255,255,0.1)'}`,
                  color:stakeToken===t?'#9945FF':'rgba(245,230,200,0.5)',
                  fontFamily:'var(--font-display)', fontSize:10, fontWeight:700,
                }}>{t}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input type="number" value={stakeAmount} step="0.01" min={parseFloat(minSOLStake)}
                onChange={e => setStake(stakeToken, Math.max(parseFloat(minSOLStake), parseFloat(e.target.value)||0))}
                style={{ flex:1, padding:'8px 12px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(232,184,75,0.25)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, outline:'none' }}
              />
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(245,230,200,0.6)', minWidth:50 }}>{stakeToken}</div>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.35)', marginTop:6, textAlign:'center' }}>
              Min stake: ${0.50} USD (~{minSOLStake} {stakeToken})
            </div>
          </div>
        )}

        {/* MODES */}
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:40 }}>
          {[
            { mode:'story' as GameMode, label:'Story Mode', desc:'The Time Thief Returns', icon:'📜', accent:'#E8B84B' },
            { mode:'classic' as GameMode, label:'Classic Mode', desc:'WHOT-style card battle', icon:'🎴', accent:'#14F195' },
            { mode:'multiplayer' as GameMode, label:'Multiplayer', desc:'2–5 players, invite codes', icon:'⚔️', accent:'#9945FF' },
          ].map(({ mode, label, desc, icon, accent }) => (
            <div key={mode} style={{
              width:200, padding:'22px 18px', borderRadius:16, cursor:'pointer',
              background:'rgba(26,20,16,0.7)', border:`1.5px solid rgba(232,184,75,0.12)`,
              transition:'all 0.25s', backdropFilter:'blur(10px)', textAlign:'center',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-5px)'; (e.currentTarget as HTMLElement).style.borderColor=accent+'55'; (e.currentTarget as HTMLElement).style.background=`${accent}10`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.borderColor='rgba(232,184,75,0.12)'; (e.currentTarget as HTMLElement).style.background='rgba(26,20,16,0.7)'; }}
            >
              <div style={{ fontSize:34, marginBottom:10 }}>{icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:accent, letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.45)', marginBottom:16 }}>{desc}</div>
              <button className="btn-primary" style={{ width:'100%', fontSize:11, padding:'10px', letterSpacing:'0.1em', fontWeight:900 }}
                onClick={() => handleStart(mode)}
              >PLAY</button>
            </div>
          ))}
        </div>

        {/* JOIN with code */}
        <div style={{ marginBottom:32 }}>
          <button onClick={() => setShowJoinInput(!showJoinInput)} style={{
            background:'transparent', border:'1px solid rgba(153,69,255,0.3)',
            color:'rgba(153,69,255,0.8)', padding:'8px 24px', borderRadius:20,
            fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
            cursor:'pointer', letterSpacing:'0.08em',
          }}>
            🔗 JOIN WITH INVITE CODE
          </button>
          {showJoinInput && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (e.g. ABC123)"
                maxLength={6}
                style={{
                  padding:'10px 16px', borderRadius:8, width:200,
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(153,69,255,0.4)',
                  color:'#9945FF', fontFamily:'var(--font-display)', fontSize:16, fontWeight:700,
                  outline:'none', letterSpacing:'0.1em', textAlign:'center',
                }}
              />
              <button className="btn-primary" style={{ fontSize:11, padding:'10px 20px', fontWeight:900 }}
                onClick={() => { if (joinCode.length >= 4) joinWithCode(joinCode); }}
              >JOIN</button>
            </div>
          )}
        </div>
      </div>

      {/* CHARACTER SELECT */}
      <div style={{ position:'relative', zIndex:10, maxWidth:960, margin:'0 auto', padding:'0 32px 60px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'rgba(232,184,75,0.5)', letterSpacing:'0.2em', textAlign:'center', marginBottom:18 }}>
          CHOOSE YOUR CHAMPION
        </div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {CHARACTERS.map(char => (
            <div key={char.key} onClick={() => setSelectedChar(char.key)} style={{
              padding:'14px 18px', borderRadius:14, cursor:'pointer', minWidth:130, textAlign:'center',
              background:selectedChar===char.key?`linear-gradient(135deg, ${char.accentColor}22, rgba(26,20,16,0.9))` : 'rgba(26,20,16,0.6)',
              border:`1.5px solid ${selectedChar===char.key?char.accentColor+'66':'rgba(232,184,75,0.1)'}`,
              transition:'all 0.2s', backdropFilter:'blur(8px)',
              boxShadow:selectedChar===char.key?`0 0 20px ${char.accentColor}22`:'none',
            }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{char.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:selectedChar===char.key?char.accentColor:'#E8B84B', letterSpacing:'0.08em', marginBottom:4 }}>
                {char.name.toUpperCase()}
              </div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.45)' }}>{char.title}</div>
              {selectedChar===char.key && (
                <div style={{ marginTop:8, padding:'6px 8px', background:`${char.accentColor}15`, borderRadius:6, border:`1px solid ${char.accentColor}33` }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:char.accentColor, letterSpacing:'0.06em' }}>⚡ {char.ability}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected ability desc */}
        <div style={{
          marginTop:18, padding:'14px 24px', borderRadius:12, textAlign:'center',
          background:`linear-gradient(135deg, ${selectedCharData.accentColor}12, rgba(26,20,16,0.8))`,
          border:`1.5px solid ${selectedCharData.accentColor}30`, backdropFilter:'blur(10px)',
        }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:selectedCharData.accentColor, letterSpacing:'0.1em' }}>
            ⚡ {selectedCharData.ability.toUpperCase()}
          </span>
          <span style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.55)', marginLeft:12 }}>
            — {selectedCharData.abilityDesc}
          </span>
        </div>
      </div>

      <style>{`@keyframes float{0%,100%{transform:translateY(0px) rotate(var(--r,0deg))}50%{transform:translateY(-14px) rotate(calc(var(--r,0deg) + 3deg))}}`}</style>
    </div>
  );
}

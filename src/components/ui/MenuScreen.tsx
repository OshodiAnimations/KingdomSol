'use client';
import { useEffect } from 'react';
import { useGameStore, CHARACTERS, GameMode, MultiMode } from '@/lib/store';
import { GameCard } from '@/components/cards/GameCard';
import { WalletChip } from '@/components/wallet/WalletChip';
import { Card } from '@/lib/store';
import { useState } from 'react';

const FLOAT_CARDS: Card[] = [
  { id:'f1', suit:'cowrie', value:'WHOT' },
  { id:'f2', suit:'manilla', value:'7' },
  { id:'f3', suit:'spearhead', value:'2', special:'pick2' },
  { id:'f4', suit:'bead', value:'14', special:'general_market' },
  { id:'f5', suit:'amole', value:'5', special:'pick3' },
  { id:'f6', suit:'cowrie', value:'8', special:'suspension' },
  { id:'f7', suit:'manilla', value:'11' },
  { id:'f8', suit:'bead', value:'3' },
];

const MULTI_MODES: { key: MultiMode; label: string; desc: string; icon: string; accent: string }[] = [
  { key:'war',      label:'War Mode',     desc:'Full game · All specials · High stakes',      icon:'⚔️', accent:'#FF6FD8' },
  { key:'friendly', label:'Friendly Mode',desc:'Casual · No stakes · Great for beginners',    icon:'🤝', accent:'#14F195' },
  { key:'raid',     label:'Raid Mode',    desc:'3 cards only · 3 min timer · Roulette style', icon:'💥', accent:'#FF6432' },
];

export function MenuScreen() {
  const { profile, initGame, setScreen, generateInviteCode, joinWithCode,
          musicEnabled, sfxEnabled, toggleMusic, toggleSfx, leaderboard } = useGameStore();

  const [showMultiPanel, setShowMultiPanel] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showWalletGate, setShowWalletGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const { wallet } = useGameStore();
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [myStakeAmount, setMyStakeAmount] = useState('0');
  const [myStakeToken, setMyStakeToken] = useState<'KSL'|'SOL'|'USDC'>('KSL');

  const char = CHARACTERS.find(c => c.key === profile?.character) || CHARACTERS[0];

  // Sync music
  useEffect(() => {
    const audio = typeof window !== 'undefined' ? (window as any).__bgMusic as HTMLAudioElement | undefined : undefined;
    if (!audio) return;
    musicEnabled ? audio.play().catch(() => {}) : audio.pause();
  }, [musicEnabled]);

  const gateWithWallet = (action: () => void) => {
    if (wallet.connected) {
      action();
    } else {
      setPendingAction(() => action);
      setShowWalletGate(true);
    }
  };

  const handlePlayMode = (mode: GameMode) => {
    if (mode === 'multiplayer') return;
    gateWithWallet(() => { setPendingMode(mode); setShowStakeModal(true); });
  };

  const handleConfirmStake = () => {
    if (!pendingMode) return;
    useGameStore.getState().setStake(myStakeToken, myStakeAmount);
    setShowStakeModal(false);
    initGame(pendingMode);
  };

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', background:'radial-gradient(ellipse at 30% 20%, #2C1A08 0%, #1A1410 50%, #0D0A08 100%)' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.4 }} />

      {FLOAT_CARDS.map((card, i) => (
        <div key={card.id} style={{ position:'absolute', left:`${10+(i*11)%80}%`, top:`${5+(i*13)%80}%`, opacity:0.04+(i%3)*0.02, transform:`rotate(${-20+i*7}deg)`, animation:`float ${4+i*0.5}s ease-in-out ${i*0.3}s infinite`, pointerEvents:'none' }}>
          <GameCard card={card} size="lg" />
        </div>
      ))}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 0%, rgba(13,10,8,0.6) 50%, rgba(13,10,8,0.97) 100%)', pointerEvents:'none' }} />

      {/* NAV */}
      <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, letterSpacing:'0.1em' }}>
          <span className="text-gold-shimmer">KINGDOM</span><span style={{ color:'#14F195' }}>SOL</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <button onClick={toggleMusic} style={{ padding:'7px 12px', borderRadius:8, cursor:'pointer', fontSize:18, lineHeight:1, background:musicEnabled?'rgba(20,241,149,0.12)':'rgba(255,255,255,0.05)', border:`1.5px solid ${musicEnabled?'rgba(20,241,149,0.4)':'rgba(255,255,255,0.12)'}`, color:musicEnabled?'#14F195':'rgba(245,230,200,0.4)' }}>{musicEnabled?'🎵':'🔇'}</button>
          <button onClick={toggleSfx} style={{ padding:'7px 12px', borderRadius:8, cursor:'pointer', fontSize:18, lineHeight:1, background:sfxEnabled?'rgba(20,241,149,0.12)':'rgba(255,255,255,0.05)', border:`1.5px solid ${sfxEnabled?'rgba(20,241,149,0.4)':'rgba(255,255,255,0.12)'}`, color:sfxEnabled?'#14F195':'rgba(245,230,200,0.4)' }}>{sfxEnabled?'🔊':'🔈'}</button>
          <button onClick={() => setScreen('profile')} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.25)', color:'rgba(245,230,200,0.6)', padding:'7px 14px', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.1em' }}>PROFILE</button>
          <WalletChip compact />
        </div>
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:960, margin:'0 auto', padding:'16px 28px 0', textAlign:'center' }}>
        {profile && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:14, padding:'7px 18px', borderRadius:20, background:`${char.accentColor}15`, border:`1px solid ${char.accentColor}33` }}>
            <span style={{ fontSize:20 }}>{char.icon}</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:char.accentColor }}>{profile.name}</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'rgba(245,230,200,0.4)' }}>LVL {profile.level} · {profile.gamesWon}W / {profile.gamesPlayed}G</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:11, color:'#E8B84B', fontWeight:900 }}>⚡ {profile.kslBalance} KSL</span>
          </div>
        )}

        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(38px,7vw,76px)', fontWeight:900, lineHeight:1, margin:'0 0 8px', letterSpacing:'0.05em' }}>
          <span className="text-gold-shimmer">KINGDOM</span><br />
          <span style={{ color:'#14F195', textShadow:'0 0 40px rgba(20,241,149,0.4)' }}>SOL</span>
        </h1>
        <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'rgba(245,230,200,0.5)', maxWidth:460, margin:'12px auto 28px', lineHeight:1.6 }}>
          A time traveller stranded in 2030 must rebuild ancient wealth in Solana — or be lost to history forever.
        </p>

        {/* GAME MODES */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:24 }}>
          {[
            { mode:'easy' as const, icon:'🌱', label:'Easy Mode', desc:'1 bot · Extra cards · Learn the game', color:'#14F195' },
            { mode:'story' as const, icon:'📜', label:'Story Mode', desc:'The Time Thief Returns · 1 bot', color:'#E8B84B' },
            { mode:'classic' as const, icon:'🎴', label:'Classic Mode', desc:'3 bots · Standard rules', color:'#00C2FF' },
            { mode:'warrior' as const, icon:'⚔️', label:'Warrior Mode', desc:'3 elite bots · Hardest challenge', color:'#FF6FD8' },
          ].map(({ mode, icon, label, desc, color }) => (
          <div key={mode} style={{ width:155, padding:'16px 12px', borderRadius:16, cursor:'pointer', background:'rgba(26,20,16,0.7)', border:`1.5px solid rgba(232,184,75,0.1)`, transition:'all 0.25s', backdropFilter:'blur(10px)', textAlign:'center' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.background=`${color}0d`;(e.currentTarget as HTMLElement).style.borderColor=`${color}44`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.background='rgba(26,20,16,0.7)';(e.currentTarget as HTMLElement).style.borderColor='rgba(232,184,75,0.1)';}}>
            <div style={{ fontSize:28, marginBottom:7 }}>{icon}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color, letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.4)', marginBottom:12, lineHeight:1.4 }}>{desc}</div>
            <button className="btn-primary" style={{ width:'100%', fontSize:10, padding:'8px', letterSpacing:'0.08em', fontWeight:900 }} onClick={() => handlePlayMode(mode)}>PLAY</button>
          </div>
          ))}

          {/* Tutorial */}
          <div style={{ width:155, padding:'16px 12px', borderRadius:16, cursor:'pointer', background:'rgba(26,20,16,0.7)', border:'1.5px solid rgba(0,194,255,0.12)', transition:'all 0.25s', backdropFilter:'blur(10px)', textAlign:'center' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.background='rgba(0,194,255,0.08)';(e.currentTarget as HTMLElement).style.borderColor='rgba(0,194,255,0.4)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.background='rgba(26,20,16,0.7)';(e.currentTarget as HTMLElement).style.borderColor='rgba(0,194,255,0.12)';}}>
            <div style={{ fontSize:28, marginBottom:7 }}>🎓</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#00C2FF', letterSpacing:'0.06em', marginBottom:4 }}>Tutorial</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.4)', marginBottom:12, lineHeight:1.4 }}>Learn how to play step-by-step</div>
            <button className="btn-primary" style={{ width:'100%', fontSize:10, padding:'8px', letterSpacing:'0.08em', fontWeight:900, background:'linear-gradient(135deg,#00C2FF,#0077AA)' }}
              onClick={() => useGameStore.getState().setScreen('tutorial')}>START</button>
          </div>

          {/* Multiplayer */}
          <div style={{ width:190, padding:'18px 14px', borderRadius:16, background:showMultiPanel?'rgba(153,69,255,0.12)':'rgba(26,20,16,0.7)', border:`1.5px solid ${showMultiPanel?'rgba(153,69,255,0.4)':'rgba(232,184,75,0.12)'}`, transition:'all 0.25s', backdropFilter:'blur(10px)', textAlign:'center' }}>
            <div style={{ fontSize:30, marginBottom:8 }}>⚔️</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'#9945FF', letterSpacing:'0.08em', marginBottom:5 }}>Multiplayer</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.45)', marginBottom:14 }}>2–5 real players · 25 KSL/game</div>
            <button className="btn-primary" style={{ width:'100%', fontSize:11, padding:'9px', letterSpacing:'0.1em', fontWeight:900, background:'linear-gradient(135deg,#9945FF,#6B2FCC)' }}
              onClick={() => setShowMultiPanel(!showMultiPanel)}>
              {showMultiPanel?'CLOSE ▲':'CREATE ROOM'}
            </button>
          </div>
        </div>

        {/* Multiplayer sub-modes */}
        {showMultiPanel && (
          <div style={{ maxWidth:600, margin:'0 auto 20px', padding:'20px 18px', borderRadius:16, background:'rgba(26,20,16,0.97)', border:'1.5px solid rgba(153,69,255,0.25)', backdropFilter:'blur(12px)', animation:'panel-drop 0.3s ease-out' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(153,69,255,0.6)', letterSpacing:'0.2em', marginBottom:14 }}>SELECT BATTLE MODE</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              {MULTI_MODES.map(({ key, label, desc, icon, accent }) => (
                <div key={key} style={{ flex:'1 1 150px', maxWidth:180, padding:'14px 12px', borderRadius:12, background:`${accent}0d`, border:`1.5px solid ${accent}33`, textAlign:'center', cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${accent}1a`;(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${accent}0d`;(e.currentTarget as HTMLElement).style.transform='none';}}>
                  <div style={{ fontSize:26, marginBottom:7 }}>{icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:accent, letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.45)', marginBottom:12, lineHeight:1.4 }}>{desc}</div>
                  <button style={{ width:'100%', padding:'8px', borderRadius:7, border:'none', background:`linear-gradient(135deg,${accent},${accent}99)`, color:'#1A1410', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, cursor:'pointer', letterSpacing:'0.06em' }}
                    onClick={() => gateWithWallet(() => generateInviteCode(key))}>CREATE ROOM</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JOIN A ROOM */}
        <div style={{ maxWidth:440, margin:'0 auto 20px', padding:'20px 22px', borderRadius:14, background:'rgba(26,20,16,0.75)', border:'1.5px solid rgba(153,69,255,0.2)', backdropFilter:'blur(10px)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(153,69,255,0.6)', letterSpacing:'0.2em', marginBottom:6, textAlign:'center' }}>
            🔗 JOIN A ROOM WITH CODE
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.3)', marginBottom:14, textAlign:'center' }}>
            Get a code from a friend who created a room
          </div>
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0,6))} placeholder="ENTER 6-CHAR CODE" maxLength={6}
            onKeyDown={e => { if(e.key==='Enter'&&joinCode.length>=4) joinWithCode(joinCode); }}
            style={{ width:'100%', padding:'14px 16px', borderRadius:9, marginBottom:12, background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(153,69,255,0.35)', color:'#9945FF', fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, outline:'none', letterSpacing:'0.25em', textAlign:'center', boxSizing:'border-box' as const }}
          />
          <button className="btn-primary" style={{ width:'100%', fontSize:13, padding:'13px', fontWeight:900, letterSpacing:'0.12em', background:'linear-gradient(135deg,#9945FF,#6B2FCC)' }}
            onClick={() => { if(joinCode.length>=4) gateWithWallet(() => joinWithCode(joinCode)); }}>
            JOIN ROOM ▶
          </button>
        </div>

        {/* Devnet notice */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:20, padding:'7px 16px', borderRadius:20, background:'rgba(20,241,149,0.06)', border:'1px solid rgba(20,241,149,0.15)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(20,241,149,0.6)', letterSpacing:'0.08em' }}>
          🧪 SOLANA DEVNET · Free SOL at faucet.solana.com
        </div>

        {/* LEADERBOARD BUTTON */}
        <div style={{ maxWidth:440, margin:'0 auto 28px', textAlign:'center' }}>
          <button className="btn-secondary" style={{ width:'100%', fontSize:13, padding:'14px', fontWeight:900, letterSpacing:'0.1em', border:'1.5px solid rgba(232,184,75,0.3)', background:'rgba(232,184,75,0.06)', color:'#E8B84B' }}
            onClick={() => useGameStore.getState().setScreen('leaderboard')}>
            🏆 VIEW GLOBAL LEADERBOARD
          </button>
        </div>
      </div>

      {/* WALLET GATE MODAL */}
      {showWalletGate && (
        <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.82)', backdropFilter:'blur(10px)', padding:24 }}>
          <div style={{ maxWidth:420, width:'100%', padding:'40px 36px', borderRadius:22, textAlign:'center', background:'linear-gradient(135deg, rgba(153,69,255,0.14), rgba(26,20,16,0.98))', border:'2px solid rgba(153,69,255,0.35)', animation:'modal-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxSizing:'border-box' as const }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🔐</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'#9945FF', letterSpacing:'0.08em', marginBottom:10 }}>
              CONNECT YOUR WALLET
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:15, color:'rgba(245,230,200,0.6)', lineHeight:1.7, marginBottom:10 }}>
              Connect a wallet to unlock the full KingdomSol experience.
            </div>

            {/* XP warning */}
            <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:24, background:'rgba(232,184,75,0.08)', border:'1px solid rgba(232,184,75,0.22)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'#E8B84B', letterSpacing:'0.1em', marginBottom:5 }}>
                ⚠ IMPORTANT
              </div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.55)', lineHeight:1.5 }}>
                Only players with a connected wallet can earn <strong style={{ color:'#E8B84B' }}>XP</strong>, accumulate <strong style={{ color:'#E8B84B' }}>KSL tokens</strong>, and appear on the <strong style={{ color:'#E8B84B' }}>leaderboard</strong>. Playing without a wallet means no rewards are saved.
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'13px', fontWeight:900, letterSpacing:'0.06em' }}
                onClick={() => { setShowWalletGate(false); if (pendingAction) { pendingAction(); setPendingAction(null); } }}>
                PLAY ANYWAY
              </button>
              <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'13px', fontWeight:900, letterSpacing:'0.08em', background:'linear-gradient(135deg,#9945FF,#6B2FCC)' }}
                onClick={() => { setShowWalletGate(false); setPendingAction(null); useGameStore.getState().toggleWalletModal(); }}>
                CONNECT WALLET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAKE MODAL for story/classic */}
      {showStakeModal && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)' }}>
          <div style={{ padding:'36px 32px', borderRadius:22, maxWidth:400, width:'90%', background:'linear-gradient(135deg, rgba(232,184,75,0.1), rgba(26,20,16,0.98))', border:'2px solid rgba(232,184,75,0.3)', animation:'modal-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)', textAlign:'center', boxSizing:'border-box' as const }}>
            <div style={{ fontSize:44, marginBottom:14 }}>💰</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'#E8B84B', letterSpacing:'0.08em', marginBottom:6 }}>SET YOUR STAKE</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.5)', marginBottom:22, lineHeight:1.5 }}>
              {pendingMode === 'story' ? 'Story Mode' : 'Classic Mode'} · Win = +XP · Lose = lose your stake<br/>
              Enter 0 for a free game
            </div>

            {/* Token selector */}
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14, flexWrap:'wrap' }}>
              {(['KSL','SOL','USDC'] as const).map(t => (
                <button key={t} onClick={() => setMyStakeToken(t)} style={{
                  padding:'6px 16px', borderRadius:7, cursor:'pointer',
                  background:myStakeToken===t?'rgba(232,184,75,0.2)':'rgba(255,255,255,0.05)',
                  border:`1.5px solid ${myStakeToken===t?'rgba(232,184,75,0.5)':'rgba(255,255,255,0.1)'}`,
                  color:myStakeToken===t?'#E8B84B':'rgba(245,230,200,0.5)',
                  fontFamily:'var(--font-display)', fontSize:13, fontWeight:900,
                }}>{t}</button>
              ))}
            </div>

            {/* Amount + token inline */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, width:'100%', boxSizing:'border-box' as const }}>
              <input type="number" value={myStakeAmount} min="0" step="1"
                onChange={e => setMyStakeAmount(e.target.value)}
                style={{ flex:1, minWidth:0, padding:'12px 14px', borderRadius:9, background:'rgba(255,255,255,0.07)', border:'2px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' as const }}
              />
              <div style={{ flexShrink:0, fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'rgba(245,230,200,0.6)', width:48, textAlign:'left' }}>{myStakeToken}</div>
            </div>

            {myStakeToken === 'KSL' && (
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(232,184,75,0.5)', marginBottom:20 }}>
                Your KSL balance: {profile?.kslBalance || 0} KSL
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'12px', fontWeight:900 }} onClick={() => setShowStakeModal(false)}>CANCEL</button>
              <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'12px', fontWeight:900, letterSpacing:'0.06em' }} onClick={handleConfirmStake}>
                {parseFloat(myStakeAmount) > 0 ? `STAKE ${myStakeAmount} ${myStakeToken} & PLAY` : 'PLAY FREE'}
              </button>
            </div>
          </div>
          <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-14px) rotate(calc(var(--r,0deg)+3deg))}}
        @keyframes panel-drop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

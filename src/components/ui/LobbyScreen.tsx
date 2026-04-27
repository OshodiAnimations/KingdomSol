'use client';
import { useState, useEffect } from 'react';
import { useGameStore, CHARACTERS, MultiMode, TokenSymbol } from '@/lib/store';

const MODE_INFO: Record<MultiMode, { label:string; icon:string; accent:string; desc:string }> = {
  war:     { label:'War Mode',     icon:'⚔️', accent:'#FF6FD8', desc:'Full game · All special cards · Winner takes stake' },
  friendly:{ label:'Friendly Mode',icon:'🤝', accent:'#14F195', desc:'Casual play · No stakes · Just for fun' },
  raid:    { label:'Raid Mode',    icon:'💥', accent:'#FF6432', desc:'3 cards only · 3 minute countdown · Roulette style' },
};

export function LobbyScreen() {
  const { inviteCode, lobbyPlayers, multiMode, initGame, setScreen, profile, stakeToken, stakeAmount, setStake } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [agreedStake, setAgreedStake] = useState(stakeAmount);
  const [agreedToken, setAgreedToken] = useState<TokenSymbol>(stakeToken);
  const [stakeVotes, setStakeVotes] = useState<Record<string, boolean>>({});

  const isHost = lobbyPlayers.find(p => p.id === 'human')?.isHost ?? false;
  const canStart = lobbyPlayers.length >= 2;
  const modeInfo = multiMode ? MODE_INFO[multiMode] : MODE_INFO.war;
  const isFriendly = multiMode === 'friendly';

  // Build the room URL — just the game path with the code
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${inviteCode}`
    : `https://kingdomsol.vercel.app/?room=${inviteCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode || '').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareRoom = () => {
    const msg = `Join my KingdomSol ${modeInfo.label} room!\n\nCode: ${inviteCode}\nLink: ${roomUrl}`;
    if (navigator.share) {
      navigator.share({ title: 'KingdomSol Game Invite', text: msg, url: roomUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      setCopied(true);
    }
  };

  const handleStartGame = () => {
    if (!canStart) return;
    if (!isFriendly) {
      // Show stake agreement modal first
      setShowStakeModal(true);
    } else {
      initGame('multiplayer', multiMode || 'war');
    }
  };

  const handleStakeAgreed = () => {
    setStake(agreedToken, agreedStake);
    setShowStakeModal(false);
    initGame('multiplayer', multiMode || 'war');
  };

  return (
    <div style={{
      minHeight:'100vh', position:'relative',
      background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #1A1410 50%, #0D0A08 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'24px 20px',
    }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:500 }}>
        {/* Back */}
        <button onClick={() => setScreen('menu')} style={{
          background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)',
          color:'rgba(245,230,200,0.5)', padding:'7px 16px', borderRadius:7,
          cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900,
          letterSpacing:'0.08em', marginBottom:22, display:'block',
        }}>← BACK TO MENU</button>

        {/* Mode badge */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:`${modeInfo.accent}18`, border:`1.5px solid ${modeInfo.accent}44`, fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:modeInfo.accent, letterSpacing:'0.1em', marginBottom:8 }}>
            {modeInfo.icon} {modeInfo.label.toUpperCase()}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.4)' }}>{modeInfo.desc}</div>
        </div>

        {/* Room code + share */}
        <div style={{ padding:'22px', borderRadius:18, marginBottom:16, background:'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(26,20,16,0.97))', border:'2px solid rgba(153,69,255,0.3)', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.22em', marginBottom:10 }}>ROOM CODE</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:56, fontWeight:900, color:'#9945FF', letterSpacing:'0.3em', textShadow:'0 0 30px rgba(153,69,255,0.6)', marginBottom:14 }}>
            {inviteCode}
          </div>

          {/* Room URL */}
          <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(245,230,200,0.4)', marginBottom:14, wordBreak:'break-all' as const }}>
            {roomUrl}
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={copyCode} style={{ padding:'8px 16px', borderRadius:8, cursor:'pointer', background:copied?'rgba(20,241,149,0.15)':'rgba(153,69,255,0.15)', border:`1.5px solid ${copied?'rgba(20,241,149,0.5)':'rgba(153,69,255,0.4)'}`, color:copied?'#14F195':'#9945FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.06em' }}>
              {copied?'✓ COPIED':'📋 CODE'}
            </button>
            <button onClick={copyLink} style={{ padding:'8px 16px', borderRadius:8, cursor:'pointer', background:'rgba(0,194,255,0.1)', border:'1.5px solid rgba(0,194,255,0.3)', color:'#00C2FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.06em' }}>
              🔗 LINK
            </button>
            <button onClick={shareRoom} style={{ padding:'8px 16px', borderRadius:8, cursor:'pointer', background:'rgba(232,184,75,0.1)', border:'1.5px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.06em' }}>
              📤 SHARE
            </button>
          </div>
          <div style={{ marginTop:10, fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.28)' }}>
            Share the code OR the link — both work · Room is private
          </div>
        </div>

        {/* Players list */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.18em' }}>
              PLAYERS ({lobbyPlayers.length}/5)
            </div>
            {!canStart && (
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(255,180,50,0.7)', letterSpacing:'0.06em' }}>
                ⚠ Need at least 2 players
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {lobbyPlayers.map(p => {
              const pChar = CHARACTERS.find(c => c.key === p.character) || CHARACTERS[0];
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:`${pChar.accentColor}0a`, border:`1.5px solid ${pChar.accentColor}33` }}>
                  <span style={{ fontSize:24 }}>{pChar.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'rgba(245,230,200,0.9)', letterSpacing:'0.04em' }}>
                      {p.name} {p.isHost && <span style={{ fontSize:10, color:'#E8B84B', marginLeft:4 }}>👑 HOST</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:2 }}>{pChar.title}</div>
                  </div>
                  <div style={{ padding:'3px 10px', borderRadius:20, background:`${pChar.accentColor}22`, border:`1px solid ${pChar.accentColor}55`, fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:pChar.accentColor, letterSpacing:'0.08em' }}>
                    READY
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2-lobbyPlayers.length) }).map((_,i) => (
              <div key={`e${i}`} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1.5px dashed rgba(255,255,255,0.07)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'rgba(245,230,200,0.2)', textAlign:'center', letterSpacing:'0.08em' }}>
                Waiting for player to join with room code...
              </div>
            ))}
          </div>
        </div>

        {/* No AI notice */}
        <div style={{ padding:'10px 16px', borderRadius:10, marginBottom:16, background:'rgba(255,100,50,0.06)', border:'1px solid rgba(255,100,50,0.15)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(255,150,80,0.6)', textAlign:'center', letterSpacing:'0.08em' }}>
          🚫 No AI bots in this room — real players only
        </div>

        {/* Start */}
        <button
          className="btn-primary"
          style={{ width:'100%', fontSize:15, padding:'16px', letterSpacing:'0.12em', fontWeight:900, opacity:canStart?1:0.4, cursor:canStart?'pointer':'not-allowed', background:canStart?undefined:'linear-gradient(135deg,#444,#333)' }}
          onClick={handleStartGame}
          disabled={!canStart}
        >
          {canStart
            ? isFriendly ? `START FRIENDLY GAME ▶` : `SET STAKES & START ▶`
            : `WAITING FOR PLAYERS (${lobbyPlayers.length}/2 minimum)`}
        </button>
      </div>

      {/* ── STAKE AGREEMENT MODAL ── */}
      {showStakeModal && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)' }}>
          <div style={{
            padding:'36px 32px', borderRadius:22, maxWidth:420, width:'90%',
            background:'linear-gradient(135deg, rgba(232,184,75,0.12), rgba(26,20,16,0.98))',
            border:'2px solid rgba(232,184,75,0.35)',
            boxShadow:'0 0 60px rgba(232,184,75,0.12)',
            animation:'modal-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:14 }}>💰</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'#E8B84B', letterSpacing:'0.08em', marginBottom:6 }}>
              SET THE STAKES
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.5)', marginBottom:24, lineHeight:1.5 }}>
              All {lobbyPlayers.length} players will stake this amount. Winner takes all.
            </div>

            {/* Token picker */}
            <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', justifyContent:'center' }}>
              {(['SOL','USDC','BONK','JUP','WIF'] as TokenSymbol[]).map(t => (
                <button key={t} onClick={() => setAgreedToken(t)} style={{
                  padding:'5px 14px', borderRadius:7, cursor:'pointer',
                  background:agreedToken===t?'rgba(153,69,255,0.25)':'rgba(255,255,255,0.05)',
                  border:`1.5px solid ${agreedToken===t?'rgba(153,69,255,0.6)':'rgba(255,255,255,0.1)'}`,
                  color:agreedToken===t?'#9945FF':'rgba(245,230,200,0.5)',
                  fontFamily:'var(--font-display)', fontSize:12, fontWeight:900,
                }}>{t}</button>
              ))}
            </div>

            {/* Amount input */}
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
              <input
                type="number" value={agreedStake} step="0.01" min="0"
                onChange={e => setAgreedStake(e.target.value)}
                style={{ flex:1, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.07)', border:'2px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' as const }}
              />
              <span style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'rgba(245,230,200,0.6)', minWidth:52 }}>{agreedToken}</span>
            </div>

            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.35)', marginBottom:24 }}>
              Enter any amount — $0 for a free game
            </div>

            {/* Players who agreed */}
            <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:10, background:'rgba(20,241,149,0.06)', border:'1px solid rgba(20,241,149,0.15)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'rgba(20,241,149,0.5)', letterSpacing:'0.15em', marginBottom:8 }}>HOST AGREEMENT</div>
              {lobbyPlayers.map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'rgba(245,230,200,0.7)' }}>{p.name}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:p.isHost?'#14F195':'rgba(245,230,200,0.3)' }}>{p.isHost?'✓ AGREED':'Waiting...'}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'12px', fontWeight:900 }} onClick={() => setShowStakeModal(false)}>CANCEL</button>
              <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'12px', fontWeight:900, letterSpacing:'0.08em' }} onClick={handleStakeAgreed}>
                CONFIRM & START GAME ▶
              </button>
            </div>
          </div>
          <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}
    </div>
  );
}

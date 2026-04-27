'use client';
import { useState, useEffect } from 'react';
import { useGameStore, CHARACTERS, CharacterKey } from '@/lib/store';

export function LobbyScreen() {
  const { inviteCode, lobbyPlayers, initGame, setScreen, gameMode } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<CharacterKey>('okonkwo');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Simulate bots joining lobby over time
  useEffect(() => {
    const botNames = ['Eze', 'Yaa', 'Kwame', 'Fatima'];
    let joined = 0;
    const interval = setInterval(() => {
      if (joined < 1) {
        joined++;
        useGameStore.setState(s => ({
          lobbyPlayers: [...s.lobbyPlayers.filter(p => p.name !== 'Waiting...'),
            { id:`bot${joined}`, name:botNames[joined-1], ready:true }]
        }));
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startGame = () => {
    initGame(gameMode || 'multiplayer', selectedChar);
  };

  const shareLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://kingdomsol.vercel.app'}?code=${inviteCode}`;

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      background: 'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #1A1410 50%, #0D0A08 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:500 }}>
        {/* Back */}
        <button onClick={() => setScreen('menu')} style={{
          background:'transparent', border:'1px solid rgba(232,184,75,0.2)',
          color:'rgba(245,230,200,0.5)', padding:'6px 14px', borderRadius:6,
          cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
          letterSpacing:'0.08em', marginBottom:28,
        }}>← BACK</button>

        {/* Title */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(153,69,255,0.7)', letterSpacing:'0.2em', marginBottom:8 }}>
            MULTIPLAYER LOBBY
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'#E8B84B', letterSpacing:'0.05em' }}>
            Room #{inviteCode}
          </div>
        </div>

        {/* Invite code display */}
        <div style={{
          padding:'20px 24px', borderRadius:16, marginBottom:20,
          background:'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(26,20,16,0.9))',
          border:'2px solid rgba(153,69,255,0.3)',
          textAlign:'center',
        }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.2em', marginBottom:10 }}>
            INVITE CODE
          </div>
          <div style={{
            fontFamily:'var(--font-display)', fontSize:48, fontWeight:900,
            color:'#9945FF', letterSpacing:'0.25em',
            textShadow:'0 0 30px rgba(153,69,255,0.5)',
            marginBottom:16,
          }}>
            {inviteCode}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={copyCode} style={{
              padding:'8px 20px', borderRadius:8,
              background:copied?'rgba(20,241,149,0.15)':'rgba(153,69,255,0.15)',
              border:`1px solid ${copied?'rgba(20,241,149,0.4)':'rgba(153,69,255,0.4)'}`,
              color:copied?'#14F195':'#9945FF',
              fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em',
            }}>
              {copied?'✓ COPIED!':'📋 COPY CODE'}
            </button>
            <button onClick={() => {
              if (navigator.share) {
                navigator.share({ title:'Join my KingdomSol game!', text:`Use code ${inviteCode} to join!`, url:shareLink }).catch(()=>{});
              } else {
                navigator.clipboard.writeText(shareLink).catch(()=>{});
                setCopied(true);
              }
            }} style={{
              padding:'8px 20px', borderRadius:8,
              background:'rgba(232,184,75,0.1)', border:'1px solid rgba(232,184,75,0.3)',
              color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
              cursor:'pointer', letterSpacing:'0.08em',
            }}>
              🔗 SHARE LINK
            </button>
          </div>
          <div style={{ marginTop:12, fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.3)' }}>
            Send this code to friends · 2–5 players
          </div>
        </div>

        {/* Players in lobby */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.18em', marginBottom:12 }}>
            PLAYERS ({lobbyPlayers.length}/5)
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {lobbyPlayers.map(p => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10,
                background:p.ready?'rgba(20,241,149,0.08)':'rgba(255,255,255,0.04)',
                border:`1px solid ${p.ready?'rgba(20,241,149,0.2)':'rgba(255,255,255,0.08)'}`,
              }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:p.ready?'#14F195':'rgba(255,255,255,0.2)', boxShadow:p.ready?'0 0 8px rgba(20,241,149,0.8)':'none' }} />
                <div style={{ flex:1, fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:p.ready?'rgba(245,230,200,0.9)':'rgba(245,230,200,0.4)', letterSpacing:'0.05em' }}>
                  {p.name}
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:p.ready?'#14F195':'rgba(245,230,200,0.3)', letterSpacing:'0.1em' }}>
                  {p.ready?'READY':'WAITING...'}
                </div>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - lobbyPlayers.length) }).map((_, i) => (
              <div key={`empty${i}`} style={{
                padding:'12px 16px', borderRadius:10,
                background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.08)',
                fontFamily:'var(--font-display)', fontSize:12, fontWeight:700,
                color:'rgba(245,230,200,0.2)', textAlign:'center', letterSpacing:'0.1em',
              }}>
                Waiting for player...
              </div>
            ))}
          </div>
        </div>

        {/* Character pick */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.35)', letterSpacing:'0.18em', marginBottom:10 }}>
            YOUR CHARACTER
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {CHARACTERS.map(char => (
              <button key={char.key} onClick={() => setSelectedChar(char.key)} style={{
                padding:'8px 14px', borderRadius:10, cursor:'pointer',
                background:selectedChar===char.key?`${char.accentColor}20`:'rgba(255,255,255,0.04)',
                border:`1.5px solid ${selectedChar===char.key?char.accentColor+'66':'rgba(255,255,255,0.08)'}`,
                display:'flex', alignItems:'center', gap:6, transition:'all 0.2s',
              }}>
                <span style={{ fontSize:18 }}>{char.icon}</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:selectedChar===char.key?char.accentColor:'rgba(245,230,200,0.5)', letterSpacing:'0.06em' }}>
                  {char.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button className="btn-primary" style={{ width:'100%', fontSize:14, padding:'16px', letterSpacing:'0.12em', fontWeight:900 }}
          onClick={startGame}
        >
          START GAME ({lobbyPlayers.length} PLAYER{lobbyPlayers.length!==1?'S':''})
        </button>

        <div style={{ textAlign:'center', marginTop:12, fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.3)' }}>
          You can start now — additional players can join mid-game using the code
        </div>
      </div>
    </div>
  );
}

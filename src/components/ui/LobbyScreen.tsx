'use client';
import { useState, useEffect } from 'react';
import { useGameStore, CHARACTERS, MultiMode } from '@/lib/store';

const MODE_INFO: Record<MultiMode, { label:string; icon:string; accent:string; desc:string }> = {
  war:     { label:'War Mode',     icon:'⚔️', accent:'#FF6FD8', desc:'Full game · All special cards active · Highest stakes' },
  friendly:{ label:'Friendly Mode',icon:'🤝', accent:'#14F195', desc:'Casual play · No stakes · Great for beginners' },
  raid:    { label:'Raid Mode',    icon:'💥', accent:'#FF6432', desc:'3 cards only · 3 minute timer · Roulette style' },
};

export function LobbyScreen() {
  const { inviteCode, lobbyPlayers, multiMode, initGame, setScreen, profile } = useGameStore();
  const [copied, setCopied] = useState(false);
  const isHost = lobbyPlayers.find(p => p.id === 'human')?.isHost ?? false;
  const canStart = lobbyPlayers.length >= 2 && lobbyPlayers.every(p => p.ready);
  const modeInfo = multiMode ? MODE_INFO[multiMode] : MODE_INFO.war;

  // Simulate a second player joining after 4 seconds (for demo)
  useEffect(() => {
    if (!isHost) return;
    const t = setTimeout(() => {
      useGameStore.setState(s => {
        if (s.lobbyPlayers.length >= 2) return s;
        const randChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        return {
          lobbyPlayers: [...s.lobbyPlayers, {
            id: 'guest1',
            name: ['Kweku','Adaeze','Yemisi','Jide'][Math.floor(Math.random()*4)],
            character: randChar.key,
            ready: true,
            isHost: false,
          }]
        };
      });
    }, 4000);
    return () => clearTimeout(t);
  }, [isHost]);

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const startGame = () => {
    if (!canStart) return;
    initGame('multiplayer', multiMode || 'war');
  };

  return (
    <div style={{
      minHeight:'100vh', position:'relative',
      background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #1A1410 50%, #0D0A08 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'28px 20px',
    }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:480 }}>
        {/* Back */}
        <button onClick={() => setScreen('menu')} style={{
          background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)',
          color:'rgba(245,230,200,0.5)', padding:'7px 16px', borderRadius:7,
          cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900,
          letterSpacing:'0.08em', marginBottom:24, display:'block',
        }}>← BACK TO MENU</button>

        {/* Mode badge */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'6px 16px', borderRadius:20,
            background:`${modeInfo.accent}18`, border:`1.5px solid ${modeInfo.accent}44`,
            fontFamily:'var(--font-display)', fontSize:12, fontWeight:900,
            color:modeInfo.accent, letterSpacing:'0.1em', marginBottom:10,
          }}>
            {modeInfo.icon} {modeInfo.label.toUpperCase()}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.45)' }}>
            {modeInfo.desc}
          </div>
        </div>

        {/* Invite code */}
        <div style={{
          padding:'24px', borderRadius:18, marginBottom:18,
          background:'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(26,20,16,0.95))',
          border:'2px solid rgba(153,69,255,0.3)', textAlign:'center',
        }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.2em', marginBottom:10 }}>
            ROOM CODE — SHARE WITH FRIENDS
          </div>
          <div style={{
            fontFamily:'var(--font-display)', fontSize:52, fontWeight:900,
            color:'#9945FF', letterSpacing:'0.3em', textShadow:'0 0 30px rgba(153,69,255,0.6)',
            marginBottom:18,
          }}>
            {inviteCode}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={copyCode} style={{
              padding:'9px 22px', borderRadius:8, cursor:'pointer',
              background:copied?'rgba(20,241,149,0.15)':'rgba(153,69,255,0.15)',
              border:`1.5px solid ${copied?'rgba(20,241,149,0.5)':'rgba(153,69,255,0.4)'}`,
              color:copied?'#14F195':'#9945FF',
              fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, letterSpacing:'0.06em',
            }}>
              {copied?'✓ COPIED!':'📋 COPY CODE'}
            </button>
            <button onClick={() => {
              const msg=`Join my KingdomSol game!\nRoom code: ${inviteCode}\nMode: ${modeInfo.label}`;
              if(navigator.share){navigator.share({title:'KingdomSol Game Invite',text:msg}).catch(()=>{});}
              else{navigator.clipboard.writeText(msg).catch(()=>{});setCopied(true);}
            }} style={{
              padding:'9px 22px', borderRadius:8, cursor:'pointer',
              background:'rgba(232,184,75,0.1)', border:'1.5px solid rgba(232,184,75,0.3)',
              color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, letterSpacing:'0.06em',
            }}>
              🔗 SHARE
            </button>
          </div>
          <div style={{ marginTop:12, fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.3)' }}>
            This code only works for this room · 2–5 players
          </div>
        </div>

        {/* Players */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.18em' }}>
              PLAYERS ({lobbyPlayers.length}/5)
            </div>
            {lobbyPlayers.length < 2 && (
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(255,180,50,0.7)', letterSpacing:'0.08em' }}>
                ⚠ Need at least 2 to start
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {lobbyPlayers.map(p => {
              const pChar = CHARACTERS.find(c => c.key === p.character) || CHARACTERS[0];
              return (
                <div key={p.id} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:12,
                  background:p.ready?`${pChar.accentColor}0a`:'rgba(255,255,255,0.03)',
                  border:`1.5px solid ${p.ready?pChar.accentColor+'33':'rgba(255,255,255,0.07)'}`,
                }}>
                  <span style={{ fontSize:24 }}>{pChar.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:p.ready?'rgba(245,230,200,0.95)':'rgba(245,230,200,0.4)', letterSpacing:'0.05em' }}>
                      {p.name} {p.isHost && <span style={{ fontSize:10, color:'#E8B84B', marginLeft:4 }}>HOST</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:2 }}>{pChar.title}</div>
                  </div>
                  <div style={{
                    padding:'3px 10px', borderRadius:20,
                    background:p.ready?`${pChar.accentColor}22`:'rgba(255,255,255,0.06)',
                    border:`1px solid ${p.ready?pChar.accentColor+'55':'rgba(255,255,255,0.1)'}`,
                    fontFamily:'var(--font-display)', fontSize:10, fontWeight:900,
                    color:p.ready?pChar.accentColor:'rgba(245,230,200,0.3)', letterSpacing:'0.08em',
                  }}>
                    {p.ready?'READY':'WAITING'}
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2-lobbyPlayers.length) }).map((_,i) => (
              <div key={`e${i}`} style={{
                padding:'14px 16px', borderRadius:12,
                background:'rgba(255,255,255,0.02)', border:'1.5px dashed rgba(255,255,255,0.07)',
                fontFamily:'var(--font-display)', fontSize:12, fontWeight:700,
                color:'rgba(245,230,200,0.2)', textAlign:'center', letterSpacing:'0.1em',
              }}>
                Waiting for player to join with code...
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          className="btn-primary"
          style={{
            width:'100%', fontSize:15, padding:'16px', letterSpacing:'0.12em', fontWeight:900,
            opacity:canStart?1:0.45, cursor:canStart?'pointer':'not-allowed',
            background:canStart?undefined:'linear-gradient(135deg,#444,#333)',
          }}
          onClick={startGame}
          disabled={!canStart}
        >
          {canStart ? `START GAME — ${lobbyPlayers.length} PLAYERS ▶` : `WAITING FOR PLAYERS (${lobbyPlayers.length}/2 min)`}
        </button>

        <div style={{ textAlign:'center', marginTop:10, fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.25)' }}>
          No AI bots in multiplayer — real players only
        </div>
      </div>
    </div>
  );
}

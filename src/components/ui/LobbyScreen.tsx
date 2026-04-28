'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore, CHARACTERS, MultiMode, TokenSymbol, PlayerStake } from '@/lib/store';
import {
  createRoom, joinRoom, getRoomPlayers, getRoom,
  subscribeToRoom, unsubscribeFromRoom,
  startSharedGame, broadcastGameState, leaveRoom, getPlayerId,
  RoomPlayerRow, SharedGameState
} from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const MODE_INFO: Record<MultiMode, { label:string; icon:string; accent:string; desc:string }> = {
  war:     { label:'War Mode',     icon:'⚔️', accent:'#FF6FD8', desc:'Full game · All special cards · Winner takes stake' },
  friendly:{ label:'Friendly Mode',icon:'🤝', accent:'#14F195', desc:'Casual play · No stakes · Just for fun' },
  raid:    { label:'Raid Mode',    icon:'💥', accent:'#FF6432', desc:'3 cards only · 3 minute countdown · Roulette style' },
};

export function LobbyScreen() {
  const { inviteCode, multiMode, setScreen, profile, stakeToken, stakeAmount, setStake, setNotification, lobbyPlayers: storeLobbyPlayers, setPlayerStake, confirmAllStakes } = useGameStore();

  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerRow[]>([]);
  const [copied, setCopied] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [showStakePhase, setShowStakePhase] = useState(false);
  const [myStakeAmount, setMyStakeAmount] = useState('0');
  const [myStakeToken, setMyStakeToken] = useState<'KSL'|'SOL'>('KSL');
  const [stakeConfirmed, setStakeConfirmed] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerId = getPlayerId();

  const isHost = storeLobbyPlayers.find(p => p.id === 'human')?.isHost ?? false;
  const modeInfo = multiMode ? MODE_INFO[multiMode] : MODE_INFO.war;
  const isFriendly = multiMode === 'friendly';
  const canStart = roomPlayers.length >= 2;

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${inviteCode}`
    : `https://kingdomsol.vercel.app/?room=${inviteCode}`;

  const applySharedState = useCallback((shared: SharedGameState, allPlayers: RoomPlayerRow[]) => {
    const myIndex = shared.playerOrder.indexOf(playerId);
    if (myIndex === -1) return;
    const myHand = shared.hands[playerId] || [];
    const players = shared.playerOrder.map((pid, idx) => {
      const rp = allPlayers.find(p => p.player_id === pid);
      const char = CHARACTERS.find(c => c.key === rp?.character_key) || CHARACTERS[0];
      return {
        id: pid, name: rp?.player_name || `Player ${idx+1}`, avatar: char.icon,
        character: char.key as any, hand: shared.hands[pid] || [],
        xp: 0, level: 1, solBalance: 0, isBot: false, abilityUsed: false,
      };
    });
    useGameStore.setState({
      players, deck: shared.deck, pile: shared.pile, topCard: shared.topCard as any,
      currentSuit: shared.currentSuit as any, currentPlayerIndex: shared.currentPlayerIndex,
      humanPlayerIndex: myIndex, direction: shared.direction, pendingPick: shared.pendingPick,
      winner: shared.winner ? players.find(p => p.id === shared.winner) || null : null,
      isGameStarted: true, gameMode: 'multiplayer', screen: 'board',
      selectedCardIds: [], lastPlayEvent: null,
    });
  }, [playerId]);

  useEffect(() => {
    if (!inviteCode || !profile) return;
    async function setup() {
      setConnecting(true);
      try {
        if (isHost) {
          const room = await createRoom({ code: inviteCode!, mode: multiMode||'war', hostId: playerId, hostName: profile!.name, hostCharacter: profile!.character, stakeToken, stakeAmount });
          if (!room) { setError('Failed to create room.'); return; }
        } else {
          const result = await joinRoom({ code: inviteCode!, playerId, playerName: profile!.name, characterKey: profile!.character });
          if (!result.room) { setError('Room not found. Check the code.'); return; }
          if (result.room.status === 'playing' && result.room.game_state) {
            applySharedState(result.room.game_state as SharedGameState, result.players);
            return;
          }
        }
        const current = await getRoomPlayers(inviteCode!);
        setRoomPlayers(current);

        channelRef.current = subscribeToRoom(inviteCode!, {
          onPlayerJoin: async () => {
            const updated = await getRoomPlayers(inviteCode!);
            setRoomPlayers(updated);
            setNotification({ message: `${updated[updated.length-1]?.player_name} joined!`, type: 'success' });
            // Trigger stake phase when 2+ players
            if (updated.length >= 2 && !isFriendly) setShowStakePhase(true);
          },
          onPlayerLeave: async () => {
            const updated = await getRoomPlayers(inviteCode!);
            setRoomPlayers(updated);
            if (updated.length < 2) setShowStakePhase(false);
          },
          onGameStateUpdate: (shared) => {
            const allPlayers = roomPlayers;
            applySharedState(shared, allPlayers);
          },
        });

        if (current.length >= 2 && !isFriendly) setShowStakePhase(true);
      } catch (e) {
        setError('Connection error. Please try again.');
      } finally {
        setConnecting(false);
      }
    }
    setup();
    return () => { if (channelRef.current) unsubscribeFromRoom(channelRef.current); };
  }, [inviteCode]);

  const handleConfirmStake = () => {
    const stake: PlayerStake = { playerId, playerName: profile?.name || 'Player', token: myStakeToken, amount: myStakeAmount, confirmed: true };
    setPlayerStake(stake);
    setStake(myStakeToken, myStakeAmount);
    setStakeConfirmed(true);
    setNotification({ message: `Stake confirmed: ${myStakeAmount} ${myStakeToken}`, type: 'success' });
  };

  const doStartGame = async () => {
    confirmAllStakes();
    const shared = await startSharedGame({ code: inviteCode!, players: roomPlayers, multiMode: multiMode||'war', stakeToken: myStakeToken, stakeAmount: myStakeAmount });
    if (!shared) { setNotification({ message: 'Failed to start. Try again.', type: 'error' }); return; }
    applySharedState(shared, roomPlayers);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 2500);
  };

  const share = () => {
    const msg = `Join my KingdomSol ${modeInfo.label}!\nCode: ${inviteCode}\nLink: ${roomUrl}`;
    if (navigator.share) navigator.share({ title:'KingdomSol', text:msg, url:roomUrl }).catch(()=>{});
    else copyText(msg, 'share');
  };

  if (connecting) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0D0A08' }}>
      <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #9945FF', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', marginBottom:20 }} />
      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'#9945FF', letterSpacing:'0.1em' }}>CONNECTING...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0D0A08', padding:24 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#FF6666', marginBottom:10 }}>CONNECTION ERROR</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.5)', marginBottom:28, textAlign:'center' }}>{error}</div>
      <button className="btn-primary" style={{ fontSize:13, padding:'12px 28px', fontWeight:900 }} onClick={() => setScreen('menu')}>BACK TO MENU</button>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', position:'relative', background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #1A1410 50%, #0D0A08 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:500 }}>
        <button onClick={() => { if(channelRef.current) unsubscribeFromRoom(channelRef.current); leaveRoom(inviteCode!, playerId); setScreen('menu'); }} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.5)', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.08em', marginBottom:20, display:'block' }}>← BACK</button>

        {/* Mode badge */}
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:`${modeInfo.accent}18`, border:`1.5px solid ${modeInfo.accent}44`, fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:modeInfo.accent, letterSpacing:'0.1em', marginBottom:6 }}>
            {modeInfo.icon} {modeInfo.label.toUpperCase()}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.4)' }}>{modeInfo.desc}</div>
        </div>

        {/* Room code */}
        <div style={{ padding:'18px', borderRadius:16, marginBottom:14, background:'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(26,20,16,0.97))', border:'2px solid rgba(153,69,255,0.3)', textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 8px rgba(20,241,149,0.8)', animation:'livepulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'#14F195', letterSpacing:'0.2em' }}>LIVE · SUPABASE REALTIME</span>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:900, color:'#9945FF', letterSpacing:'0.3em', textShadow:'0 0 30px rgba(153,69,255,0.6)', marginBottom:10 }}>{inviteCode}</div>
          <div style={{ padding:'6px 10px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(245,230,200,0.4)', marginBottom:10, wordBreak:'break-all' as const }}>{roomUrl}</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => copyText(inviteCode!, 'code')} style={{ padding:'7px 14px', borderRadius:7, cursor:'pointer', background:copied==='code'?'rgba(20,241,149,0.15)':'rgba(153,69,255,0.15)', border:`1.5px solid ${copied==='code'?'rgba(20,241,149,0.5)':'rgba(153,69,255,0.4)'}`, color:copied==='code'?'#14F195':'#9945FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>{copied==='code'?'✓ COPIED':'📋 CODE'}</button>
            <button onClick={() => copyText(roomUrl, 'link')} style={{ padding:'7px 14px', borderRadius:7, cursor:'pointer', background:'rgba(0,194,255,0.1)', border:'1.5px solid rgba(0,194,255,0.3)', color:'#00C2FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>{copied==='link'?'✓ COPIED':'🔗 LINK'}</button>
            <button onClick={share} style={{ padding:'7px 14px', borderRadius:7, cursor:'pointer', background:'rgba(232,184,75,0.1)', border:'1.5px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>📤 SHARE</button>
          </div>
        </div>

        {/* Players */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.18em' }}>PLAYERS ({roomPlayers.length}/5)</div>
            {!canStart && <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(255,180,50,0.7)' }}>⚠ Need 2+ to start</div>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {roomPlayers.map(p => {
              const pChar = CHARACTERS.find(c => c.key === p.character_key) || CHARACTERS[0];
              const isMe = p.player_id === playerId;
              return (
                <div key={p.player_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:`${pChar.accentColor}0a`, border:`1.5px solid ${pChar.accentColor}33` }}>
                  <span style={{ fontSize:22 }}>{pChar.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'rgba(245,230,200,0.9)', letterSpacing:'0.04em' }}>
                      {p.player_name} {p.is_host&&<span style={{ fontSize:9, color:'#E8B84B', marginLeft:5 }}>👑 HOST</span>} {isMe&&<span style={{ fontSize:9, color:'rgba(245,230,200,0.4)', marginLeft:4 }}>(you)</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.4)', marginTop:1 }}>{pChar.title}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 6px rgba(20,241,149,0.8)' }} />
                    <span style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:900, color:'#14F195', letterSpacing:'0.08em' }}>ONLINE</span>
                  </div>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 2-roomPlayers.length) }).map((_,i) => (
              <div key={`e${i}`} style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1.5px dashed rgba(255,255,255,0.07)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.2)', textAlign:'center', letterSpacing:'0.08em' }}>
                ⏳ Waiting for player to join...
              </div>
            ))}
          </div>
        </div>

        {/* ── STAKE PHASE — shows when 2+ players are in ── */}
        {showStakePhase && !isFriendly && (
          <div style={{ padding:'18px', borderRadius:14, marginBottom:14, background:'rgba(232,184,75,0.06)', border:'2px solid rgba(232,184,75,0.25)', animation:'panel-drop 0.4s ease-out' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'#E8B84B', letterSpacing:'0.12em', marginBottom:4, textAlign:'center' }}>
              💰 SET YOUR STAKE
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.45)', marginBottom:14, textAlign:'center' }}>
              Each player sets their own stake · Enter 0 for free
            </div>

            {!stakeConfirmed ? (
              <>
                <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:12 }}>
                  {(['KSL','SOL'] as const).map(t => (
                    <button key={t} onClick={() => setMyStakeToken(t)} style={{ padding:'6px 18px', borderRadius:7, cursor:'pointer', background:myStakeToken===t?'rgba(232,184,75,0.2)':'rgba(255,255,255,0.05)', border:`1.5px solid ${myStakeToken===t?'rgba(232,184,75,0.5)':'rgba(255,255,255,0.1)'}`, color:myStakeToken===t?'#E8B84B':'rgba(245,230,200,0.5)', fontFamily:'var(--font-display)', fontSize:13, fontWeight:900 }}>{t}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                  <input type="number" value={myStakeAmount} min="0" step="1"
                    onChange={e => setMyStakeAmount(e.target.value)}
                    style={{ flex:1, padding:'12px', borderRadius:9, background:'rgba(255,255,255,0.07)', border:'2px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' as const }}
                  />
                  <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'rgba(245,230,200,0.5)', minWidth:42 }}>{myStakeToken}</div>
                </div>
                <button className="btn-primary" style={{ width:'100%', fontSize:12, padding:'12px', fontWeight:900, letterSpacing:'0.08em' }} onClick={handleConfirmStake}>
                  {parseFloat(myStakeAmount) > 0 ? `CONFIRM ${myStakeAmount} ${myStakeToken} STAKE` : 'PLAY FOR FREE (0 STAKE)'}
                </button>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'12px', background:'rgba(20,241,149,0.08)', borderRadius:10, border:'1px solid rgba(20,241,149,0.2)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#14F195', letterSpacing:'0.08em' }}>
                  ✓ YOUR STAKE: {myStakeAmount} {myStakeToken}
                </div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:4 }}>Waiting for host to start...</div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding:'8px 14px', borderRadius:8, marginBottom:12, background:'rgba(255,100,50,0.05)', border:'1px solid rgba(255,100,50,0.12)', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(255,150,80,0.55)', textAlign:'center', letterSpacing:'0.06em' }}>
          🚫 No AI bots · Real players only via Supabase Realtime
        </div>

        {isHost ? (
          <button className="btn-primary" style={{ width:'100%', fontSize:15, padding:'16px', letterSpacing:'0.12em', fontWeight:900, opacity:canStart?1:0.4, cursor:canStart?'pointer':'not-allowed', background:canStart?undefined:'linear-gradient(135deg,#444,#333)' }}
            onClick={doStartGame} disabled={!canStart}>
            {canStart ? 'START GAME ▶' : `WAITING FOR PLAYERS (${roomPlayers.length}/2 min)`}
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'14px', fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.08em', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
            ⏳ Waiting for host to start the game...
          </div>
        )}
      </div>

      <style>{`
        @keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes panel-drop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

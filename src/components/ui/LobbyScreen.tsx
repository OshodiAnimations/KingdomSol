'use client';
import { useState, useEffect, useRef } from 'react';
import { useGameStore, CHARACTERS, MultiMode, TokenSymbol } from '@/lib/store';
import {
  createRoom, joinRoom, getRoomPlayers, subscribeToRoom, unsubscribeFromRoom,
  updateRoomStatus, updateRoomStake, broadcastMove, updateGameState,
  leaveRoom, getPlayerId, RoomPlayerRow, RoomRow
} from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const MODE_INFO: Record<MultiMode, { label:string; icon:string; accent:string; desc:string }> = {
  war:     { label:'War Mode',     icon:'⚔️', accent:'#FF6FD8', desc:'Full game · All special cards · Winner takes stake' },
  friendly:{ label:'Friendly Mode',icon:'🤝', accent:'#14F195', desc:'Casual play · No stakes · Just for fun' },
  raid:    { label:'Raid Mode',    icon:'💥', accent:'#FF6432', desc:'3 cards only · 3 minute countdown · Roulette style' },
};

export function LobbyScreen() {
  const { inviteCode, multiMode, initGame, setScreen, profile, stakeToken, stakeAmount, setStake, setNotification } = useGameStore();

  const [players, setPlayers] = useState<RoomPlayerRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [agreedStake, setAgreedStake] = useState(stakeAmount);
  const [agreedToken, setAgreedToken] = useState<TokenSymbol>(stakeToken);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHost = useGameStore(s => s.lobbyPlayers.find(p => p.id === 'human')?.isHost ?? false);

  const playerId = getPlayerId();
  const modeInfo = multiMode ? MODE_INFO[multiMode] : MODE_INFO.war;
  const isFriendly = multiMode === 'friendly';
  const canStart = players.length >= 2;
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${inviteCode}`
    : `https://kingdomsol.vercel.app/?room=${inviteCode}`;

  // On mount — create or join the room in Supabase
  useEffect(() => {
    if (!inviteCode || !profile) return;

    async function setup() {
      setConnecting(true);
      try {
        if (isHost) {
          // Create room in Supabase
          const room = await createRoom({
            code: inviteCode!,
            mode: multiMode || 'war',
            hostId: playerId,
            hostName: profile!.name,
            hostCharacter: profile!.character,
            stakeToken,
            stakeAmount,
          });
          if (!room) { setError('Failed to create room. Please try again.'); return; }
        } else {
          // Join existing room
          const { room, players: existingPlayers } = await joinRoom({
            code: inviteCode!,
            playerId,
            playerName: profile!.name,
            characterKey: profile!.character,
          });
          if (!room) { setError('Room not found. Check the code and try again.'); return; }
          setPlayers(existingPlayers);
        }

        // Load current players
        const currentPlayers = await getRoomPlayers(inviteCode!);
        setPlayers(currentPlayers);

        // Subscribe to real-time updates
        channelRef.current = subscribeToRoom(inviteCode!, {
          onPlayerJoin: (newPlayer) => {
            setPlayers(prev => {
              if (prev.find(p => p.player_id === newPlayer.player_id)) return prev;
              setNotification({ message: `${newPlayer.player_name} joined the room!`, type: 'success' });
              return [...prev, newPlayer];
            });
          },
          onPlayerLeave: (leftPlayerId) => {
            setPlayers(prev => {
              const leaving = prev.find(p => p.player_id === leftPlayerId);
              if (leaving) setNotification({ message: `${leaving.player_name} left the room`, type: 'info' });
              return prev.filter(p => p.player_id !== leftPlayerId);
            });
          },
          onRoomUpdate: (room: RoomRow) => {
            // Host started game — everyone transitions
            if (room.status === 'playing' && room.game_state && Object.keys(room.game_state).length > 0) {
              startGameFromState(room.game_state);
            }
            // Stake was updated
            if (room.stake_token && room.stake_amount) {
              setAgreedToken(room.stake_token as TokenSymbol);
              setAgreedStake(room.stake_amount);
            }
          },
          onMove: (move) => {
            // Handle moves broadcast by other players
            if (move.player_id === playerId) return; // ignore own moves
            if (move.move_type === 'stake_agreed') {
              setAgreedToken(move.payload.token);
              setAgreedStake(move.payload.amount);
            }
          },
        });

      } catch (err) {
        setError('Connection error. Please try again.');
        console.error(err);
      } finally {
        setConnecting(false);
      }
    }

    setup();

    return () => {
      if (channelRef.current) unsubscribeFromRoom(channelRef.current);
      // Leave room on unmount if not starting game
      leaveRoom(inviteCode!, playerId);
    };
  }, [inviteCode]);

  function startGameFromState(gameState: any) {
    // Non-host players receive game state and start
    useGameStore.setState({
      players: gameState.players,
      deck: gameState.deck,
      pile: gameState.pile,
      topCard: gameState.topCard,
      currentSuit: gameState.currentSuit,
      currentPlayerIndex: gameState.currentPlayerIndex,
      humanPlayerIndex: gameState.humanPlayerIndex,
      direction: gameState.direction,
      pendingPick: 0,
      winner: null,
      isGameStarted: true,
      gameMode: 'multiplayer',
      multiMode: gameState.multiMode,
      screen: 'board',
      selectedCardIds: [],
      lastPlayEvent: null,
    });
  }

  const handleStartGame = async () => {
    if (!canStart) return;
    if (isFriendly) {
      await startMultiplayerGame('0', 'SOL');
    } else {
      setShowStakeModal(true);
    }
  };

  const startMultiplayerGame = async (amount: string, token: TokenSymbol) => {
    setStake(token, amount);
    setShowStakeModal(false);

    // Build initial game state using store logic
    const { initGame: storeInit } = useGameStore.getState();
    storeInit('multiplayer', multiMode || 'war');

    // Get the initialized state and broadcast to all players
    const state = useGameStore.getState();
    const sharedGameState = {
      players: state.players,
      deck: state.deck,
      pile: state.pile,
      topCard: state.topCard,
      currentSuit: state.currentSuit,
      currentPlayerIndex: 0,
      humanPlayerIndex: 0,
      direction: 1,
      multiMode: multiMode || 'war',
    };

    // Update room status to playing and share game state
    await updateRoomStatus(inviteCode!, 'playing', sharedGameState);
    await updateRoomStake(inviteCode!, token, amount);
  };

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
      navigator.share({ title:'KingdomSol Game Invite', text:msg, url:roomUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      setCopied(true);
    }
  };

  if (connecting) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #0D0A08 100%)' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#9945FF', letterSpacing:'0.1em', marginBottom:12, animation:'pulse 1s ease-in-out infinite' }}>
          CONNECTING TO ROOM...
        </div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.4)' }}>
          Setting up your game room on Supabase
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #0D0A08 100%)', padding:24 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#FF6666', letterSpacing:'0.08em', marginBottom:10 }}>CONNECTION ERROR</div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.5)', marginBottom:28, textAlign:'center' }}>{error}</div>
        <button className="btn-primary" style={{ fontSize:13, padding:'12px 28px', fontWeight:900 }} onClick={() => setScreen('menu')}>BACK TO MENU</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #1A1410 50%, #0D0A08 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:500 }}>
        <button onClick={() => setScreen('menu')} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.5)', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.08em', marginBottom:22, display:'block' }}>← BACK</button>

        {/* Mode badge */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:`${modeInfo.accent}18`, border:`1.5px solid ${modeInfo.accent}44`, fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:modeInfo.accent, letterSpacing:'0.1em', marginBottom:8 }}>
            {modeInfo.icon} {modeInfo.label.toUpperCase()}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.4)' }}>{modeInfo.desc}</div>
        </div>

        {/* Room code */}
        <div style={{ padding:'22px', borderRadius:18, marginBottom:16, background:'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(26,20,16,0.97))', border:'2px solid rgba(153,69,255,0.3)', textAlign:'center' }}>
          {/* Live indicator */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 8px rgba(20,241,149,0.8)', animation:'live-pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'#14F195', letterSpacing:'0.2em' }}>LIVE ROOM</span>
          </div>

          <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.22em', marginBottom:10 }}>ROOM CODE</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:56, fontWeight:900, color:'#9945FF', letterSpacing:'0.3em', textShadow:'0 0 30px rgba(153,69,255,0.6)', marginBottom:12 }}>
            {inviteCode}
          </div>

          {/* Room URL */}
          <div style={{ padding:'7px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(245,230,200,0.4)', marginBottom:14, wordBreak:'break-all' as const }}>
            {roomUrl}
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={copyCode} style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', background:copied?'rgba(20,241,149,0.15)':'rgba(153,69,255,0.15)', border:`1.5px solid ${copied?'rgba(20,241,149,0.5)':'rgba(153,69,255,0.4)'}`, color:copied?'#14F195':'#9945FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>
              {copied?'✓ COPIED':'📋 CODE'}
            </button>
            <button onClick={copyLink} style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', background:'rgba(0,194,255,0.1)', border:'1.5px solid rgba(0,194,255,0.3)', color:'#00C2FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>
              🔗 LINK
            </button>
            <button onClick={shareRoom} style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', background:'rgba(232,184,75,0.1)', border:'1.5px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>
              📤 SHARE
            </button>
          </div>
        </div>

        {/* Players — live */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.18em' }}>
              PLAYERS ({players.length}/5)
            </div>
            {!canStart && (
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(255,180,50,0.7)' }}>
                ⚠ Need 2+ to start
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {players.map(p => {
              const pChar = CHARACTERS.find(c => c.key === p.character_key) || CHARACTERS[0];
              return (
                <div key={p.player_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:`${pChar.accentColor}0a`, border:`1.5px solid ${pChar.accentColor}33` }}>
                  <span style={{ fontSize:24 }}>{pChar.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'rgba(245,230,200,0.9)', letterSpacing:'0.04em' }}>
                      {p.player_name} {p.is_host && <span style={{ fontSize:10, color:'#E8B84B', marginLeft:4 }}>👑 HOST</span>}
                      {p.player_id === playerId && <span style={{ fontSize:10, color:'rgba(245,230,200,0.4)', marginLeft:4 }}>(you)</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:2 }}>{pChar.title}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 6px rgba(20,241,149,0.8)' }} />
                    <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'#14F195', letterSpacing:'0.08em' }}>ONLINE</span>
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2-players.length) }).map((_,i) => (
              <div key={`e${i}`} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1.5px dashed rgba(255,255,255,0.07)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'rgba(245,230,200,0.2)', textAlign:'center', letterSpacing:'0.08em', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,0.15)', animation:'pulse 1s ease-in-out infinite' }} />
                Waiting for player to join...
              </div>
            ))}
          </div>
        </div>

        {/* No AI notice */}
        <div style={{ padding:'10px 16px', borderRadius:10, marginBottom:14, background:'rgba(255,100,50,0.06)', border:'1px solid rgba(255,100,50,0.15)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(255,150,80,0.6)', textAlign:'center', letterSpacing:'0.06em' }}>
          🚫 No AI bots — real players only via Supabase Realtime
        </div>

        {/* Start — only host sees this */}
        {isHost && (
          <button
            className="btn-primary"
            style={{ width:'100%', fontSize:15, padding:'16px', letterSpacing:'0.12em', fontWeight:900, opacity:canStart?1:0.4, cursor:canStart?'pointer':'not-allowed', background:canStart?undefined:'linear-gradient(135deg,#444,#333)' }}
            onClick={handleStartGame}
            disabled={!canStart}
          >
            {canStart
              ? isFriendly ? 'START FRIENDLY GAME ▶' : 'SET STAKES & START ▶'
              : `WAITING FOR PLAYERS (${players.length}/2 minimum)`}
          </button>
        )}

        {!isHost && (
          <div style={{ textAlign:'center', padding:'16px', fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.08em', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
            ⏳ Waiting for host to start the game...
          </div>
        )}
      </div>

      {/* STAKE MODAL */}
      {showStakeModal && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)' }}>
          <div style={{ padding:'36px 32px', borderRadius:22, maxWidth:420, width:'90%', background:'linear-gradient(135deg, rgba(232,184,75,0.12), rgba(26,20,16,0.98))', border:'2px solid rgba(232,184,75,0.35)', animation:'modal-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>💰</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'#E8B84B', letterSpacing:'0.08em', marginBottom:6 }}>SET THE STAKES</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.5)', marginBottom:24, lineHeight:1.5 }}>
              All {players.length} players stake this amount. Winner takes all.
            </div>

            <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', justifyContent:'center' }}>
              {(['SOL','USDC','BONK','JUP','WIF'] as TokenSymbol[]).map(t => (
                <button key={t} onClick={() => setAgreedToken(t)} style={{ padding:'5px 14px', borderRadius:7, cursor:'pointer', background:agreedToken===t?'rgba(153,69,255,0.25)':'rgba(255,255,255,0.05)', border:`1.5px solid ${agreedToken===t?'rgba(153,69,255,0.6)':'rgba(255,255,255,0.1)'}`, color:agreedToken===t?'#9945FF':'rgba(245,230,200,0.5)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:900 }}>{t}</button>
              ))}
            </div>

            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
              <input type="number" value={agreedStake} step="0.01" min="0"
                onChange={e => setAgreedStake(e.target.value)}
                style={{ flex:1, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.07)', border:'2px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' as const }}
              />
              <span style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'rgba(245,230,200,0.6)', minWidth:52 }}>{agreedToken}</span>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.35)', marginBottom:24 }}>Enter $0 for a free game</div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'12px', fontWeight:900 }} onClick={() => setShowStakeModal(false)}>CANCEL</button>
              <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'12px', fontWeight:900, letterSpacing:'0.06em' }}
                onClick={() => startMultiplayerGame(agreedStake, agreedToken)}>
                CONFIRM & START ▶
              </button>
            </div>
          </div>
          <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      <style>{`
        @keyframes live-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.85)}}
        @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:0.8}}
      `}</style>
    </div>
  );
}

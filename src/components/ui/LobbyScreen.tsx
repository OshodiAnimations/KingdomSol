'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore, CHARACTERS, MultiMode, TokenSymbol, Card, CardSuit, Player } from '@/lib/store';
import {
  createRoom, joinRoom, getRoomPlayers, getRoom,
  subscribeToRoom, unsubscribeFromRoom,
  startSharedGame, broadcastGameState, markRoomFinished,
  leaveRoom, getPlayerId,
  RoomPlayerRow, SharedGameState
} from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CHARACTERS as CHARS } from '@/lib/store';

const MODE_INFO: Record<MultiMode, { label:string; icon:string; accent:string; desc:string }> = {
  war:     { label:'War Mode',     icon:'⚔️', accent:'#FF6FD8', desc:'Full game · All special cards · Winner takes stake' },
  friendly:{ label:'Friendly Mode',icon:'🤝', accent:'#14F195', desc:'Casual play · No stakes · Just for fun' },
  raid:    { label:'Raid Mode',    icon:'💥', accent:'#FF6432', desc:'3 cards only · 3 minute countdown · Roulette style' },
};

export function LobbyScreen() {
  const { inviteCode, multiMode, setScreen, profile, stakeToken, stakeAmount, setStake, setNotification } = useGameStore();

  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerRow[]>([]);
  const [copied, setCopied] = useState<string>('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [agreedStake, setAgreedStake] = useState(stakeAmount);
  const [agreedToken, setAgreedToken] = useState<TokenSymbol>(stakeToken as TokenSymbol);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  const playerId = getPlayerId();
  const isHost = roomPlayers.find(p => p.player_id === playerId)?.is_host ?? false;
  const modeInfo = multiMode ? MODE_INFO[multiMode] : MODE_INFO.war;
  const isFriendly = multiMode === 'friendly';
  const canStart = roomPlayers.length >= 2;

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${inviteCode}`
    : `https://kingdomsol.vercel.app/?room=${inviteCode}`;

  // Apply shared game state to local store — each player sees their OWN hand
  const applySharedState = useCallback((shared: SharedGameState, allPlayers: RoomPlayerRow[]) => {
    const myHand: Card[] = shared.hands[playerId] || [];

    // Build player list — each player sees themselves + others with hidden hands
    const players: Player[] = shared.playerOrder.map((pid, idx) => {
      const rp = allPlayers.find(p => p.player_id === pid);
      const char = CHARS.find(c => c.key === rp?.character_key) || CHARS[0];
      const isMe = pid === playerId;
      return {
        id: pid,
        name: rp?.player_name || `Player ${idx + 1}`,
        avatar: char.icon,
        character: char.key,
        hand: isMe ? myHand : (shared.hands[pid] || []), // others still have cards, just shown face down
        xp: 0,
        level: 1,
        solBalance: 0,
        isBot: false,
        abilityUsed: false,
      };
    });

    const humanPlayerIndex = shared.playerOrder.indexOf(playerId);

    // Check for winner
    let winner = null;
    if (shared.winner) {
      winner = players.find(p => p.id === shared.winner) || null;
    }

    useGameStore.setState({
      players,
      deck: shared.deck,
      pile: shared.pile,
      topCard: shared.topCard as Card,
      currentSuit: shared.currentSuit as CardSuit,
      currentPlayerIndex: shared.currentPlayerIndex,
      humanPlayerIndex: humanPlayerIndex >= 0 ? humanPlayerIndex : 0,
      direction: shared.direction,
      pendingPick: shared.pendingPick,
      winner,
      isGameStarted: true,
      gameMode: 'multiplayer',
      screen: 'board',
      selectedCardIds: [],
      lastPlayEvent: null,
    });
  }, [playerId]);

  useEffect(() => {
    if (!inviteCode || !profile) return;

    async function setup() {
      setConnecting(true);
      try {
        let allPlayers: RoomPlayerRow[] = [];

        if (useGameStore.getState().lobbyPlayers.find(p => p.id === 'human')?.isHost) {
          // HOST: create room in Supabase
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
          // GUEST: join existing room
          const result = await joinRoom({
            code: inviteCode!,
            playerId,
            playerName: profile!.name,
            characterKey: profile!.character,
          });
          if (!result.room) {
            setError('Room not found or already started. Check the code and try again.');
            return;
          }
          // If game already started, apply state immediately
          if (result.room.status === 'playing' && result.room.game_state) {
            allPlayers = result.players;
            setRoomPlayers(allPlayers);
            applySharedState(result.room.game_state as SharedGameState, allPlayers);
            return;
          }
          allPlayers = result.players;
        }

        // Load current players
        const currentPlayers = await getRoomPlayers(inviteCode!);
        setRoomPlayers(currentPlayers);
        allPlayers = currentPlayers;

        // Subscribe to real-time updates
        channelRef.current = subscribeToRoom(inviteCode!, {
          onPlayerJoin: async (newPlayer) => {
            const updated = await getRoomPlayers(inviteCode!);
            setRoomPlayers(updated);
            allPlayers = updated;
            setNotification({ message: `${newPlayer.player_name} joined! (${updated.length} players)`, type: 'success' });
          },
          onPlayerLeave: async (leftId) => {
            const updated = await getRoomPlayers(inviteCode!);
            setRoomPlayers(updated);
            allPlayers = updated;
          },
          onGameStateUpdate: (shared) => {
            // Game started — apply the shared state
            applySharedState(shared, allPlayers);
          },
          onRoomStatusChange: (status) => {
            if (status === 'finished') setScreen('menu');
          },
        });

      } catch (err) {
        console.error(err);
        setError('Connection error. Please try again.');
      } finally {
        setConnecting(false);
      }
    }

    setup();

    return () => {
      if (channelRef.current) unsubscribeFromRoom(channelRef.current);
    };
  }, [inviteCode]);

  const handleStartGame = async () => {
    if (!canStart || !isHost) return;
    if (isFriendly) {
      await doStartGame('0', 'SOL');
    } else {
      setShowStakeModal(true);
    }
  };

  const doStartGame = async (amount: string, token: TokenSymbol) => {
    setStake(token, amount);
    setShowStakeModal(false);

    const shared = await startSharedGame({
      code: inviteCode!,
      players: roomPlayers,
      multiMode: multiMode || 'war',
      stakeToken: token,
      stakeAmount: amount,
    });

    if (!shared) {
      setNotification({ message: 'Failed to start game. Try again.', type: 'error' });
      return;
    }

    // Host applies state too (realtime will also trigger but host applies immediately)
    applySharedState(shared, roomPlayers);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 2500);
  };

  const share = () => {
    const msg = `Join my KingdomSol ${modeInfo.label}!\nCode: ${inviteCode}\nLink: ${roomUrl}`;
    if (navigator.share) navigator.share({ title: 'KingdomSol', text: msg, url: roomUrl }).catch(() => {});
    else copyText(msg, 'share');
  };

  if (connecting) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #0D0A08 100%)' }}>
      <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #9945FF', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', marginBottom:20 }} />
      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'#9945FF', letterSpacing:'0.1em' }}>CONNECTING TO ROOM...</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.4)', marginTop:8 }}>Linking to Supabase Realtime</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 20%, #1A0035 0%, #0D0A08 100%)', padding:24 }}>
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
        <button onClick={() => { if(channelRef.current) unsubscribeFromRoom(channelRef.current); leaveRoom(inviteCode!, playerId); setScreen('menu'); }} style={{ background:'transparent', border:'1.5px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.5)', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, letterSpacing:'0.08em', marginBottom:22, display:'block' }}>← BACK</button>

        {/* Mode */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:`${modeInfo.accent}18`, border:`1.5px solid ${modeInfo.accent}44`, fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:modeInfo.accent, letterSpacing:'0.1em', marginBottom:8 }}>
            {modeInfo.icon} {modeInfo.label.toUpperCase()}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.4)' }}>{modeInfo.desc}</div>
        </div>

        {/* Room code */}
        <div style={{ padding:'20px', borderRadius:18, marginBottom:14, background:'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(26,20,16,0.97))', border:'2px solid rgba(153,69,255,0.3)', textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 8px rgba(20,241,149,0.8)', animation:'livepulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'#14F195', letterSpacing:'0.2em' }}>LIVE · SUPABASE REALTIME</span>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:52, fontWeight:900, color:'#9945FF', letterSpacing:'0.3em', textShadow:'0 0 30px rgba(153,69,255,0.6)', marginBottom:12 }}>{inviteCode}</div>
          <div style={{ padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:'var(--font-mono)', fontSize:11, color:'rgba(245,230,200,0.4)', marginBottom:12, wordBreak:'break-all' as const }}>{roomUrl}</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => copyText(inviteCode!, 'code')} style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', background:copied==='code'?'rgba(20,241,149,0.15)':'rgba(153,69,255,0.15)', border:`1.5px solid ${copied==='code'?'rgba(20,241,149,0.5)':'rgba(153,69,255,0.4)'}`, color:copied==='code'?'#14F195':'#9945FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>{copied==='code'?'✓ COPIED':'📋 CODE'}</button>
            <button onClick={() => copyText(roomUrl, 'link')} style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', background:'rgba(0,194,255,0.1)', border:'1.5px solid rgba(0,194,255,0.3)', color:'#00C2FF', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>{copied==='link'?'✓ COPIED':'🔗 LINK'}</button>
            <button onClick={share} style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', background:'rgba(232,184,75,0.1)', border:'1.5px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900 }}>📤 SHARE</button>
          </div>
        </div>

        {/* Players */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.18em' }}>PLAYERS ({roomPlayers.length}/5)</div>
            {!canStart && <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(255,180,50,0.7)' }}>⚠ Need 2+ to start</div>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {roomPlayers.map(p => {
              const pChar = CHARACTERS.find(c => c.key === p.character_key) || CHARACTERS[0];
              const isMe = p.player_id === playerId;
              return (
                <div key={p.player_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:`${pChar.accentColor}0a`, border:`1.5px solid ${pChar.accentColor}33` }}>
                  <span style={{ fontSize:24 }}>{pChar.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'rgba(245,230,200,0.9)', letterSpacing:'0.04em' }}>
                      {p.player_name}
                      {p.is_host && <span style={{ fontSize:10, color:'#E8B84B', marginLeft:6 }}>👑 HOST</span>}
                      {isMe && <span style={{ fontSize:10, color:'rgba(245,230,200,0.4)', marginLeft:6 }}>(you)</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:2 }}>{pChar.title}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:'#14F195', boxShadow:'0 0 6px rgba(20,241,149,0.8)' }} />
                    <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'#14F195', letterSpacing:'0.08em' }}>ONLINE</span>
                  </div>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 2-roomPlayers.length) }).map((_,i) => (
              <div key={`e${i}`} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1.5px dashed rgba(255,255,255,0.07)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'rgba(245,230,200,0.2)', textAlign:'center', letterSpacing:'0.08em' }}>
                ⏳ Waiting for player to join with code...
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'9px 14px', borderRadius:9, marginBottom:12, background:'rgba(255,100,50,0.05)', border:'1px solid rgba(255,100,50,0.12)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(255,150,80,0.55)', textAlign:'center', letterSpacing:'0.06em' }}>
          🚫 No AI bots — real players only · Each player gets their own unique hand
        </div>

        {isHost ? (
          <button className="btn-primary" style={{ width:'100%', fontSize:15, padding:'16px', letterSpacing:'0.12em', fontWeight:900, opacity:canStart?1:0.4, cursor:canStart?'pointer':'not-allowed', background:canStart?undefined:'linear-gradient(135deg,#444,#333)' }}
            onClick={handleStartGame} disabled={!canStart}>
            {canStart ? (isFriendly ? 'START FRIENDLY GAME ▶' : 'SET STAKES & START ▶') : `WAITING FOR PLAYERS (${roomPlayers.length}/2 min)`}
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'16px', fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.08em', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
            ⏳ Waiting for host to start...
          </div>
        )}
      </div>

      {/* Stake modal */}
      {showStakeModal && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)' }}>
          <div style={{ padding:'36px 32px', borderRadius:22, maxWidth:400, width:'90%', background:'linear-gradient(135deg, rgba(232,184,75,0.12), rgba(26,20,16,0.98))', border:'2px solid rgba(232,184,75,0.35)', animation:'modalpop 0.35s cubic-bezier(0.34,1.56,0.64,1)', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>💰</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'#E8B84B', letterSpacing:'0.08em', marginBottom:6 }}>SET THE STAKES</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.5)', marginBottom:24 }}>
              All {roomPlayers.length} players stake this amount. Winner takes all.
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', justifyContent:'center' }}>
              {(['SOL','USDC','BONK','JUP','WIF'] as TokenSymbol[]).map(t => (
                <button key={t} onClick={() => setAgreedToken(t)} style={{ padding:'5px 14px', borderRadius:7, cursor:'pointer', background:agreedToken===t?'rgba(153,69,255,0.25)':'rgba(255,255,255,0.05)', border:`1.5px solid ${agreedToken===t?'rgba(153,69,255,0.6)':'rgba(255,255,255,0.1)'}`, color:agreedToken===t?'#9945FF':'rgba(245,230,200,0.5)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:900 }}>{t}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
              <input type="number" value={agreedStake} step="0.01" min="0" onChange={e => setAgreedStake(e.target.value)}
                style={{ flex:1, padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.07)', border:'2px solid rgba(232,184,75,0.3)', color:'#E8B84B', fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, outline:'none', textAlign:'center', boxSizing:'border-box' as const }} />
              <span style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'rgba(245,230,200,0.6)', minWidth:52 }}>{agreedToken}</span>
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.35)', marginBottom:24 }}>Enter $0 for a free game</div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'12px', fontWeight:900 }} onClick={() => setShowStakeModal(false)}>CANCEL</button>
              <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'12px', fontWeight:900 }} onClick={() => doStartGame(agreedStake, agreedToken)}>CONFIRM & START ▶</button>
            </div>
          </div>
          <style>{`@keyframes modalpop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      <style>{`@keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}`}</style>
    </div>
  );
}

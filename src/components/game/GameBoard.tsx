'use client';
import { broadcastGameState, getPlayerId } from '@/lib/supabase';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore, CHARACTERS, CardSuit, SUIT_COLORS } from '@/lib/store';
import { GameCard, SuitSelector } from '@/components/cards/GameCard';
import { WalletChip } from '@/components/wallet/WalletChip';
import { XPBar } from '@/components/ui/XPBar';

const TURN_SECONDS = 25;

export function GameBoard() {
  const {
    players, humanPlayerIndex, currentPlayerIndex,
    topCard, currentSuit, pendingPick, deck, pile,
    selectedCardIds, winner, stakeToken, stakeAmount,
    playCard, drawCard, selectCard, changeSuit, setScreen,
    notification, setNotification, lastPlayEvent,
    musicEnabled, sfxEnabled, toggleMusic, toggleSfx,
    useAbility,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [playPopup, setPlayPopup] = useState<{ name: string; cardLabel: string; suit: string } | null>(null);
  const [abilityPopup, setAbilityPopup] = useState(false);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

  // Multiplayer real-time sync
  useMultiplayerSync();

  const humanPlayer = players[humanPlayerIndex];
  const isMyTurn = currentPlayerIndex === humanPlayerIndex;
  const char = CHARACTERS.find(c => c.key === humanPlayer?.character) || CHARACTERS[0];

  // Audio setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    bgMusicRef.current = new Audio('/bg-music.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.35;
    sfxRef.current = new Audio('/card-play.wav');
    sfxRef.current.volume = 0.7;
    return () => { bgMusicRef.current?.pause(); };
  }, []);

  useEffect(() => {
    if (!bgMusicRef.current) return;
    if (musicEnabled) { bgMusicRef.current.play().catch(() => {}); }
    else { bgMusicRef.current.pause(); }
  }, [musicEnabled]);

  // Play SFX on ANY card play event — human, bot, or opponent in multiplayer
  useEffect(() => {
    if (!lastPlayEvent) return;
    if (sfxEnabled && sfxRef.current) {
      // Clone audio to allow overlapping sounds
      try {
        const sfxClone = sfxRef.current.cloneNode() as HTMLAudioElement;
        sfxClone.volume = 0.7;
        sfxClone.play().catch(() => {});
      } catch {
        sfxRef.current.currentTime = 0;
        sfxRef.current.play().catch(() => {});
      }
    }
    // Show popup
    const c = lastPlayEvent.card;
    const label = c.value === 'WHOT' ? 'WHOT!' : `${c.value} of ${c.suit}`;
    setPlayPopup({ name: lastPlayEvent.playerName, cardLabel: label, suit: c.suit });
    setTimeout(() => setPlayPopup(null), 2000);
  }, [lastPlayEvent, sfxEnabled]);

  // Timer
  useEffect(() => {
    if (!isMyTurn || winner) return;
    setTimeLeft(TURN_SECONDS);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { drawCard(); return TURN_SECONDS; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPlayerIndex, isMyTurn, winner, drawCard]);

  // Notification dismiss
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(t);
  }, [notification, setNotification]);

  // WHOT suit selector
  useEffect(() => {
    if (notification?.message === 'WHOT! Choose a suit' && isMyTurn) {
      setShowSuitSelector(true);
    }
  }, [notification, isMyTurn]);

  // Win modal
  useEffect(() => {
    if (winner) setTimeout(() => setShowWinModal(true), 600);
  }, [winner]);

  // Broadcast is handled by playCard/drawCard in store directly

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return;
    const card = humanPlayer.hand.find(c => c.id === cardId);
    if (!card) return;
    if (selectedCardIds.includes(cardId)) {
      // If WHOT/SOL CARD, show suit selector immediately before playing
      if (card.value === 'WHOT') {
        setShowSuitSelector(true);
        return; // Wait for suit selection, then play
      }
      playCard(cardId);
    } else {
      selectCard(cardId);
    }
  };

  const handleSuitSelectedAndPlay = (suit: CardSuit) => {
    setShowSuitSelector(false);
    // Play the selected WHOT card first, then change suit
    const whotCard = selectedCardIds[0];
    if (whotCard) {
      playCard(whotCard);
      setTimeout(() => changeSuit(suit), 50);
    } else {
      changeSuit(suit);
    }
  };

  const handleSuitSelect = (suit: CardSuit) => {
    setShowSuitSelector(false);
    changeSuit(suit);
  };

  if (!humanPlayer || !topCard) return null;

  const opponents = players.filter((_, i) => i !== humanPlayerIndex);
  const activeSuitColor = currentSuit ? SUIT_COLORS[currentSuit] : '#E8B84B';

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      background: 'radial-gradient(ellipse at 50% 0%, #1B3A2D 0%, #1A1410 40%, #0D0A08 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="pattern-kente" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(13,10,8,0.7)',
        borderBottom: '1px solid rgba(232,184,75,0.12)',
        backdropFilter: 'blur(12px)',
        flexWrap: 'wrap', gap: 8,
      }}>
        <button onClick={() => setScreen('menu')} style={{
          background: 'transparent', border: '1px solid rgba(232,184,75,0.25)',
          color: 'rgba(245,230,200,0.6)', padding: '6px 14px', borderRadius: 6,
          cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11,
          letterSpacing: '0.08em', fontWeight: 700,
        }}>← MENU</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Total stake pot */}
          <div style={{
            padding: '5px 12px', borderRadius: 8,
            background: 'rgba(153,69,255,0.12)', border: '1px solid rgba(153,69,255,0.3)',
            fontFamily: 'var(--font-display)', fontSize: 'clamp(9px,2.5vw,11px)', color: '#14F195', fontWeight: 700, letterSpacing: '0.05em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: 'rgba(245,230,200,0.5)' }}>POT:</span>
            <span>{(parseFloat(stakeAmount) * players.length).toFixed(2)} {stakeToken}</span>
          </div>

          {/* Music toggle */}
          <button onClick={toggleMusic} style={{
            padding: '5px 10px', borderRadius: 6,
            background: musicEnabled ? 'rgba(20,241,149,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${musicEnabled ? 'rgba(20,241,149,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: musicEnabled ? '#14F195' : 'rgba(245,230,200,0.4)',
            cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }} title="Toggle Music">🎵</button>

          {/* SFX toggle */}
          <button onClick={toggleSfx} style={{
            padding: '5px 10px', borderRadius: 6,
            background: sfxEnabled ? 'rgba(20,241,149,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${sfxEnabled ? 'rgba(20,241,149,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: sfxEnabled ? '#14F195' : 'rgba(245,230,200,0.4)',
            cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }} title="Toggle SFX">🔊</button>
        </div>

        <WalletChip compact />
      </div>

      {/* ── CARD PLAY POPUP ── */}
      {playPopup && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 500, textAlign: 'center',
          animation: 'popup-fly 2s ease-out forwards',
          pointerEvents: 'none',
        }}>
          <div style={{
            padding: '14px 28px', borderRadius: 14,
            background: `linear-gradient(135deg, ${SUIT_COLORS[playPopup.suit as CardSuit] || '#E8B84B'}22, rgba(26,20,16,0.95))`,
            border: `2px solid ${SUIT_COLORS[playPopup.suit as CardSuit] || '#E8B84B'}66`,
            boxShadow: `0 0 40px ${SUIT_COLORS[playPopup.suit as CardSuit] || '#E8B84B'}33`,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'rgba(245,230,200,0.6)', letterSpacing: '0.1em', marginBottom: 4 }}>
              {playPopup.name} played
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900,
              color: SUIT_COLORS[playPopup.suit as CardSuit] || '#E8B84B',
              letterSpacing: '0.08em',
              textShadow: `0 0 20px ${SUIT_COLORS[playPopup.suit as CardSuit] || '#E8B84B'}88`,
            }}>
              {playPopup.cardLabel}
            </div>
          </div>
        </div>
      )}

      {/* ── OPPONENTS ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', gap: 10, justifyContent: 'flex-start',
        padding: '10px 12px 6px',
        overflowX: 'auto', flexWrap: 'nowrap' as const,
        WebkitOverflowScrolling: 'touch' as any,
        scrollbarWidth: 'none' as const,
      }}>
        {opponents.map(opp => {
          const oppIdx = players.indexOf(opp);
          const isActive = currentPlayerIndex === oppIdx;
          const oppChar = CHARACTERS.find(c => c.key === opp.character) || CHARACTERS[0];
          return (
            <div key={opp.id} style={{
              padding: '10px 16px', borderRadius: 12,
              background: isActive ? `linear-gradient(135deg, ${oppChar.accentColor}22, rgba(26,20,16,0.9))` : 'rgba(26,20,16,0.6)',
              border: `1.5px solid ${isActive ? oppChar.accentColor + '66' : 'rgba(232,184,75,0.1)'}`,
              transition: 'all 0.3s', minWidth: 130, textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{opp.avatar}</span>
                {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: oppChar.accentColor, boxShadow: `0 0 8px ${oppChar.accentColor}`, animation: 'pulse-dot 1s infinite' }} />}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: isActive ? oppChar.accentColor : '#E8B84B', letterSpacing: '0.06em' }}>
                {opp.name}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'rgba(245,230,200,0.5)', marginTop: 2 }}>
                {opp.hand.length} cards · LVL {opp.level}
              </div>
              {/* Face-down cards */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                {Array.from({ length: Math.min(opp.hand.length, 5) }).map((_, i) => (
                  <GameCard key={i} card={opp.hand[i]} isFaceDown size="sm" />
                )).map((el, i) => (
                  <div key={i} style={{ marginLeft: i > 0 ? -22 : 0 }}>{el}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CENTER AREA ── */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(12px, 3vw, 32px)', padding: 'clamp(8px, 2vw, 16px) clamp(10px, 3vw, 20px)',
      }}>
        {/* Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div onClick={() => isMyTurn && drawCard()} style={{ cursor: isMyTurn ? 'pointer' : 'default', position: 'relative', transition: 'transform 0.2s' }}
            onMouseEnter={e => { if(isMyTurn)(e.currentTarget as HTMLElement).style.transform='scale(1.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; }}
          >
            {[2,1,0].map(offset => (
              <div key={offset} style={{ position: offset===0?'relative':'absolute', top:offset*-4, left:offset*3, zIndex:3-offset }}>
                <GameCard card={{ id:'deck', suit:'cowrie', value:'1' }} isFaceDown size="lg" />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'rgba(245,230,200,0.5)' }}>{deck.length} left</div>
          {pendingPick > 0 && (
            <div style={{ padding:'4px 12px', borderRadius:6, background:'rgba(255,80,50,0.2)', border:'1px solid rgba(255,80,50,0.4)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'#FF6432' }}>
              PICK {pendingPick}!
            </div>
          )}
        </div>

        {/* Center pile */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'4px 14px', borderRadius:20,
            background:`${activeSuitColor}18`, border:`1.5px solid ${activeSuitColor}55`,
          }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:activeSuitColor, boxShadow:`0 0 8px ${activeSuitColor}` }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:activeSuitColor, letterSpacing:'0.12em' }}>
              {currentSuit?.toUpperCase()}
            </span>
          </div>
          {/* Pile with top card */}
          <div style={{ position:'relative', width:100, height:140 }}>
            {pile.slice(-3,-1).map((c,i) => (
              <div key={c.id} style={{ position:'absolute', top:(i-1)*5, left:(i-1)*4, transform:`rotate(${(i-1)*9}deg)`, opacity:0.4+i*0.2, zIndex:i }}>
                <GameCard card={c} size="lg" />
              </div>
            ))}
            <div style={{ position:'relative', zIndex:5 }}>
              <GameCard card={topCard} size="lg" />
            </div>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.35)' }}>{pile.length} played</div>
        </div>

        {/* Timer */}
        {isMyTurn && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{
              width:60, height:60, borderRadius:'50%',
              border:`3px solid ${timeLeft<=5?'#FF4444':'rgba(232,184,75,0.4)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:timeLeft<=5?'rgba(255,68,68,0.12)':'rgba(232,184,75,0.06)',
              transition:'all 0.3s',
            }}>
              <span className={timeLeft<=5?'timer-danger':''} style={{
                fontFamily:'var(--font-display)', fontSize:22, fontWeight:900,
                color:timeLeft<=5?'#FF4444':'#E8B84B',
              }}>{timeLeft}</span>
            </div>
            <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.1em' }}>YOUR TURN</span>
          </div>
        )}
      </div>

      {/* ── PLAYER HAND ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        background: 'linear-gradient(to top, rgba(13,10,8,0.98) 0%, rgba(13,10,8,0.6) 100%)',
        padding: '12px 16px 24px',
        borderTop: '1px solid rgba(232,184,75,0.08)',
      }}>
        {/* Player info */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:40, height:40, borderRadius:'50%', flexShrink:0,
              background:`radial-gradient(circle, ${char.accentColor}44, ${char.color}88)`,
              border:`2.5px solid ${isMyTurn?char.accentColor:'rgba(232,184,75,0.3)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, transition:'border-color 0.3s',
              boxShadow:isMyTurn?`0 0 16px ${char.accentColor}55`:'none',
            }}>{humanPlayer.avatar}</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'#E8B84B', letterSpacing:'0.06em' }}>
                {humanPlayer.name} <span style={{ color:'rgba(245,230,200,0.4)', fontSize:11 }}>· LVL {humanPlayer.level}</span>
              </div>
              <XPBar xp={humanPlayer.xp} level={humanPlayer.level} compact />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Ability button */}
            {!humanPlayer.abilityUsed && isMyTurn && (
              <button onClick={useAbility} style={{
                padding:'6px 12px', borderRadius:8,
                background:`${char.accentColor}18`, border:`1.5px solid ${char.accentColor}55`,
                color:char.accentColor, fontFamily:'var(--font-display)', fontSize:10,
                fontWeight:700, cursor:'pointer', letterSpacing:'0.06em',
                animation:'pulse-gold 2s ease-in-out infinite',
              }}>⚡ ABILITY</button>
            )}
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'rgba(245,230,200,0.5)' }}>
              {humanPlayer.hand.length} cards
            </div>
          </div>
        </div>

        {/* Hand */}
        <div style={{
          display:'flex', gap:8, overflowX:'auto', paddingBottom:8,
          scrollbarWidth:'none', justifyContent: humanPlayer.hand.length < 6 ? 'center' : 'flex-start',
          transition:'none',
          WebkitOverflowScrolling:'touch', // momentum scroll on iOS
          msOverflowStyle:'none',
        }}>
          {humanPlayer.hand.map((card, idx) => {
            const playable = isMyTurn && topCard
              ? (card.value==='WHOT' || card.suit===(currentSuit||topCard.suit) || card.value===topCard.value)
              : false;
            return (
              <div key={card.id} style={{ flexShrink:0 }}>
                <GameCard
                  card={card}
                  isSelected={selectedCardIds.includes(card.id)}
                  isPlayable={playable}
                  size="lg"
                  onClick={() => handleCardClick(card.id)}

                />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:12, flexWrap:'wrap' }}>
          {isMyTurn && (
            <>
              <button className="btn-secondary" style={{ fontSize:12, padding:'10px 24px', letterSpacing:'0.1em', fontWeight:700 }} onClick={drawCard}>
                {pendingPick>0?`DRAW ${pendingPick} CARDS`:'DRAW CARD'}
              </button>
              {selectedCardIds.length > 0 && (
                <button className="btn-primary" style={{ fontSize:12, padding:'10px 28px', letterSpacing:'0.1em', fontWeight:700 }} onClick={() => playCard(selectedCardIds[0])}>
                  PLAY CARD ▶
                </button>
              )}
            </>
          )}
          {!isMyTurn && (
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, fontStyle:'italic', color:'rgba(245,230,200,0.35)', padding:'10px 0' }}>
              Waiting for {players[currentPlayerIndex]?.name}...
            </div>
          )}
        </div>
      </div>

      {/* ── SUIT SELECTOR ── */}
      {showSuitSelector && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}>
          <SuitSelector onSelect={handleSuitSelectedAndPlay} />
        </div>
      )}

      {/* ── TOAST ── */}
      {notification && (
        <div style={{
          position:'fixed', top:70, left:'50%', transform:'translateX(-50%)',
          zIndex:400, padding:'12px 24px', borderRadius:10, whiteSpace:'nowrap',
          background:notification.type==='error'?'rgba(255,68,68,0.18)':notification.type==='success'?'rgba(20,241,149,0.15)':'rgba(232,184,75,0.15)',
          border:`1.5px solid ${notification.type==='error'?'rgba(255,68,68,0.5)':notification.type==='success'?'rgba(20,241,149,0.5)':'rgba(232,184,75,0.5)'}`,
          backdropFilter:'blur(12px)',
          fontFamily:'var(--font-display)', fontSize:13, fontWeight:700,
          color:notification.type==='error'?'#FF8888':notification.type==='success'?'#14F195':'#E8B84B',
          animation:'toast-in 0.3s ease-out',
          letterSpacing:'0.04em',
        }}>
          {notification.message}
        </div>
      )}

      {/* ── WIN MODAL ── */}
      {winner && showWinModal && (
        <WinModal winner={winner} isHuman={winner.id==='human'} stakeAmount={stakeAmount} stakeToken={stakeToken} playerCount={players.length}
          onClose={() => setScreen('menu')} onPlayAgain={() => { setShowWinModal(false); setScreen('menu'); }} />
      )}

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes popup-fly { 0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(0.8)} 20%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} 70%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-30px) scale(0.9)} }
      `}</style>
    </div>
  );
}

function WinModal({ winner, isHuman, stakeAmount, stakeToken, playerCount, onClose, onPlayAgain }: {
  winner: any; isHuman: boolean; stakeAmount: string; stakeToken: string; playerCount: number; onClose:()=>void; onPlayAgain:()=>void;
}) {
  const char = CHARACTERS.find(c => c.key === winner.character) || CHARACTERS[0];
  const pot = (parseFloat(stakeAmount) * playerCount);
  // Treasury takes 0.5%
  const treasury = pot * 0.005;
  const winnerPot = pot - treasury;
  const xpWinner = 150 + playerCount * 25;
  const xpLoser = 20;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)' }}>
      <div style={{
        padding:'40px 36px', borderRadius:24, textAlign:'center',
        background:`linear-gradient(135deg, ${char.accentColor}18 0%, rgba(26,20,16,0.97) 100%)`,
        border:`2px solid ${char.accentColor}55`,
        boxShadow:`0 0 80px ${char.accentColor}22`,
        maxWidth:420, width:'90%',
        animation:'modal-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{isHuman?'👑':'💀'}</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:900, color:char.accentColor, letterSpacing:'0.08em', marginBottom:6 }}>
          {isHuman ? 'VICTORY!' : 'DEFEATED'}
        </div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:15, color:'rgba(245,230,200,0.6)', marginBottom:16, lineHeight:1.5 }}>
          {isHuman ? `${winner.name} reigns supreme!` : `${winner.name} wins this round.`}
        </div>

        {/* Stake pot result */}
        {pot > 0 && (
          <div style={{ padding:'14px 18px', borderRadius:12, marginBottom:14, background:isHuman?'rgba(20,241,149,0.1)':'rgba(255,68,68,0.08)', border:`1.5px solid ${isHuman?'rgba(20,241,149,0.3)':'rgba(255,68,68,0.2)'}` }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.18em', marginBottom:6 }}>
              {isHuman ? 'POT WON' : 'POT LOST'}
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:isHuman?'#14F195':'#FF6666' }}>
              {isHuman ? `+${winnerPot.toFixed(3)} ${stakeToken}` : `-${parseFloat(stakeAmount).toFixed(3)} ${stakeToken}`}
            </div>
            {isHuman && treasury > 0 && (
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.35)', marginTop:4 }}>
                (0.5% treasury fee: {treasury.toFixed(4)} {stakeToken})
              </div>
            )}
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:4 }}>
              Total pot: {pot.toFixed(3)} {stakeToken} · {playerCount} players
            </div>
          </div>
        )}

        {/* XP earned */}
        <div style={{ padding:'10px 16px', borderRadius:10, marginBottom:24, background:'rgba(153,69,255,0.1)', border:'1px solid rgba(153,69,255,0.25)', fontFamily:'var(--font-display)', fontSize:13, color:'#9945FF', fontWeight:700 }}>
          +{isHuman ? xpWinner : xpLoser} XP earned · Level {winner.level}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn-secondary" style={{ fontSize:12, padding:'12px 20px', fontWeight:700 }} onClick={onClose}>MAIN MENU</button>
          <button className="btn-primary" style={{ fontSize:12, padding:'12px 24px', fontWeight:700 }} onClick={onPlayAgain}>PLAY AGAIN</button>
        </div>
      </div>
      <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
// placeholder

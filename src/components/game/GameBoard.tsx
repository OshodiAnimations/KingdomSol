'use client';
import { useState, useEffect, useRef } from 'react';
import { useGameStore, CHARACTERS, CardSuit, SUIT_COLORS, Card } from '@/lib/store';
import { GameCard, SuitSelector } from '@/components/cards/GameCard';
import { WalletChip } from '@/components/wallet/WalletChip';
import { XPBar } from '@/components/ui/XPBar';
import { broadcastGameState, getPlayerId } from '@/lib/supabase';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';

const TURN_SECONDS = 25;

// ── Card Pop Animation ─────────────────────────────────────────────────────

interface CardPopEvent {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export function GameBoard() {
  const {
    players, humanPlayerIndex, currentPlayerIndex,
    topCard, currentSuit, pendingPick, pendingSpecial, pendingNextPlayer, deck, pile,
    selectedCardIds, winner, stakeToken, stakeAmount,
    playCard, drawCard, selectCard, changeSuit, setScreen,
    notification, setNotification, lastPlayEvent,
    musicEnabled, sfxEnabled, toggleMusic, toggleSfx,
    useAbility, gameMode, inviteCode,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [pendingWhotCard, setPendingWhotCard] = useState<string | null>(null);
  const [cardPops, setCardPops] = useState<CardPopEvent[]>([]);
  const [drawPop, setDrawPop] = useState<{ playerName: string; count: number } | null>(null);
  const [flyCard, setFlyCard] = useState<{ card: Card; fromX: number; fromY: number } | null>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const pileRef = useRef<HTMLDivElement>(null);

  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const playerId = getPlayerId();

  const humanPlayer = players[humanPlayerIndex];
  const isMyTurn = currentPlayerIndex === humanPlayerIndex;
  const char = CHARACTERS.find(c => c.key === humanPlayer?.character) || CHARACTERS[0];
  const isMultiplayer = gameMode === 'multiplayer';
  // iWon: match by player id or name — covers solo and multiplayer
  const iWon = !!winner && (
    (!isMultiplayer && winner.id === 'human') ||
    (isMultiplayer && winner.id === playerId)
  );
  const iLost = !!winner && !iWon;

  // ── Audio setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sfxRef.current = new Audio('/card-play.wav');
    sfxRef.current.volume = 0.7;
  }, []);

  // ── Multiplayer sync ───────────────────────────────────────────────────────
  useMultiplayerSync();

  // ── Play SFX + card pop on any play event ─────────────────────────────────
  useEffect(() => {
    if (!lastPlayEvent) return;

    // Play sound
    if (sfxEnabled && sfxRef.current) {
      try {
        const clone = sfxRef.current.cloneNode() as HTMLAudioElement;
        clone.volume = 0.7;
        clone.play().catch(() => {});
      } catch {
        sfxRef.current.currentTime = 0;
        sfxRef.current.play().catch(() => {});
      }
    }

    // Card fly-to-pile animation
    const c = lastPlayEvent.card;
    setFlyCard({ card: c, fromX: 0, fromY: 0 });
    setTimeout(() => setFlyCard(null), 600);

    // Card played popup
    const label = c.value === 'WHOT' ? 'SOL CARD!' : `${c.value} of ${c.suit}`;
    const color = c.value === 'WHOT' ? '#FFD700' : SUIT_COLORS[c.suit];
    const pop: CardPopEvent = {
      id: `pop-${Date.now()}`,
      text: `${lastPlayEvent.playerName}: ${label}`,
      color,
      x: 50, y: 40,
    };
    setCardPops(prev => [...prev, pop]);
    setTimeout(() => setCardPops(prev => prev.filter(p => p.id !== pop.id)), 2200);

    // SOL CARD selector is driven by pendingNextPlayer state, NOT lastPlayEvent
    // This prevents bot WHOT plays from accidentally triggering human selector
  }, [lastPlayEvent]);

  // ── Notification handler ───────────────────────────────────────────────────
  useEffect(() => {
    if (!notification) return;
    // Clear notification after 3 seconds — selector is driven by pendingNextPlayer
    const t = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(t);
  }, [notification, setNotification]);

  // ── SOL CARD selector: driven purely by pendingNextPlayer state ────────────
  // This fires ONLY when a human player plays WHOT (bots never set pendingNextPlayer)
  useEffect(() => {
    if (pendingNextPlayer !== null && isMyTurn && !showSuitSelector) {
      setShowSuitSelector(true);
    }
  }, [pendingNextPlayer, isMyTurn]);

  // ── Win modal ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (winner) setTimeout(() => setShowWinModal(true), 500);
  }, [winner]);

  // ── Turn timer ─────────────────────────────────────────────────────────────
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

  // ── Broadcast after every move in multiplayer ──────────────────────────────
  useEffect(() => {
    if (!isMultiplayer || !inviteCode) return;
    const s = useGameStore.getState();
    const shared = {
      pile: s.pile, topCard: s.topCard,
      currentSuit: s.currentSuit || s.topCard?.suit || 'cowrie',
      currentPlayerIndex: s.currentPlayerIndex,
      direction: s.direction, pendingPick: s.pendingPick,
      winner: s.winner?.id || null,
      hands: Object.fromEntries(s.players.map(p => [p.id, p.hand])),
      playerOrder: s.players.map(p => p.id),
      playerNames: Object.fromEntries(s.players.map(p => [p.id, p.name])),
      deck: s.deck, multiMode: s.multiMode || 'war',
      stakeToken: s.stakeToken, stakeAmount: s.stakeAmount,
    };
    broadcastGameState(inviteCode, shared).catch(() => {});
  }, [pile?.length, currentPlayerIndex, winner?.id]);

  // Fix 2 & 3: On win — broadcast to ALL players and mark room finished
  useEffect(() => {
    if (!winner || !isMultiplayer || !inviteCode) return;
    const s = useGameStore.getState();
    const shared = {
      pile: s.pile, topCard: s.topCard,
      currentSuit: s.currentSuit || s.topCard?.suit || 'cowrie',
      currentPlayerIndex: s.currentPlayerIndex,
      direction: s.direction, pendingPick: 0,
      winner: winner.id,
      hands: Object.fromEntries(s.players.map(p => [p.id, p.hand])),
      playerOrder: s.players.map(p => p.id),
      playerNames: Object.fromEntries(s.players.map(p => [p.id, p.name])),
      deck: s.deck, multiMode: s.multiMode || 'war',
      stakeToken: s.stakeToken, stakeAmount: s.stakeAmount,
    };
    // Broadcast winner to all clients
    broadcastGameState(inviteCode, shared).catch(() => {});
    // Mark room as finished in Supabase so all clients get status='finished'
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('rooms').update({
        status: 'finished',
        game_state: shared,
        updated_at: new Date().toISOString(),
      }).eq('code', inviteCode).then(() => {});
    });
    // Backup broadcast after 800ms
    const t = setTimeout(() => broadcastGameState(inviteCode, shared).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [winner?.id]);

  // ── Card click handler ─────────────────────────────────────────────────────
  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || winner) return;
    const card = humanPlayer.hand.find(c => c.id === cardId);
    if (!card) return;
    // Just select — play via PLAY CARD button or double-tap
    selectCard(cardId);
  };

  // ── Suit selected handler ──────────────────────────────────────────────────
  const handleSuitSelected = (suit: CardSuit) => {
    setShowSuitSelector(false);
    setPendingWhotCard(null);
    // changeSuit handles advancing turn using stored __whotNextIdx
    changeSuit(suit);
  };

  // ── Draw card with pop animation ──────────────────────────────────────────
  const handleDraw = () => {
    if (!isMyTurn || winner) return;
    const count = pendingPick > 0 ? pendingPick : 1;
    setDrawPop({ playerName: humanPlayer.name, count });
    setTimeout(() => setDrawPop(null), 2000);
    drawCard();
  };

  // ── Music sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = typeof window !== 'undefined' ? (window as any).__bgMusic as HTMLAudioElement | undefined : undefined;
    if (!audio) return;
    musicEnabled ? audio.play().catch(() => {}) : audio.pause();
  }, [musicEnabled]);

  if (!humanPlayer || !topCard) return null;

  const opponents = players.filter((_, i) => i !== humanPlayerIndex);
  const activeSuitColor = currentSuit ? SUIT_COLORS[currentSuit] : '#E8B84B';
  const pot = (parseFloat(stakeAmount) * players.length);

  return (
    <div style={{ minHeight:'100vh', position:'relative', background:'radial-gradient(ellipse at 50% 0%, #1B3A2D 0%, #1A1410 40%, #0D0A08 100%)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none' }} />

      {/* ── CARD PLAY POPS ── */}
      {cardPops.map(pop => (
        <div key={pop.id} style={{
          position:'fixed', top:'22%', left:'50%', transform:'translateX(-50%)',
          zIndex:600, pointerEvents:'none',
          animation:'card-pop-fly 2.2s ease-out forwards',
        }}>
          <div style={{
            padding:'10px 22px', borderRadius:12,
            background:`linear-gradient(135deg, ${pop.color}22, rgba(26,20,16,0.96))`,
            border:`2px solid ${pop.color}66`,
            boxShadow:`0 0 30px ${pop.color}33`,
            fontFamily:'var(--font-display)', fontSize:15, fontWeight:900,
            color:pop.color, letterSpacing:'0.06em', whiteSpace:'nowrap' as const,
            textShadow:`0 0 12px ${pop.color}88`,
          }}>
            {pop.text}
          </div>
        </div>
      ))}

      {/* ── DRAW POP ── */}
      {drawPop && (
        <div style={{
          position:'fixed', top:'35%', left:'50%', transform:'translateX(-50%)',
          zIndex:600, pointerEvents:'none',
          animation:'card-pop-fly 2s ease-out forwards',
        }}>
          <div style={{
            padding:'8px 20px', borderRadius:10,
            background:'rgba(0,194,255,0.15)', border:'2px solid rgba(0,194,255,0.5)',
            fontFamily:'var(--font-display)', fontSize:13, fontWeight:900,
            color:'#00C2FF', letterSpacing:'0.06em', whiteSpace:'nowrap' as const,
          }}>
            {drawPop.playerName} drew {drawPop.count} card{drawPop.count > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{ position:'relative', zIndex:20, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:'rgba(13,10,8,0.75)', borderBottom:'1px solid rgba(232,184,75,0.1)', backdropFilter:'blur(12px)', flexWrap:'wrap', gap:6 }}>
        <button onClick={() => setScreen('menu')} style={{ background:'transparent', border:'1px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.5)', padding:'5px 12px', borderRadius:5, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, letterSpacing:'0.06em' }}>← MENU</button>

        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {/* Pot */}
          {pot > 0 && (
            <div style={{ padding:'4px 10px', borderRadius:7, background:'rgba(153,69,255,0.12)', border:'1px solid rgba(153,69,255,0.3)', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'#14F195', letterSpacing:'0.04em' }}>
              POT: {pot.toFixed(2)} {stakeToken}
            </div>
          )}
          <button onClick={toggleMusic} style={{ padding:'5px 9px', borderRadius:6, cursor:'pointer', fontSize:15, lineHeight:1, background:musicEnabled?'rgba(20,241,149,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${musicEnabled?'rgba(20,241,149,0.35)':'rgba(255,255,255,0.1)'}`, color:musicEnabled?'#14F195':'rgba(245,230,200,0.35)' }}>{musicEnabled?'🎵':'🔇'}</button>
          <button onClick={toggleSfx} style={{ padding:'5px 9px', borderRadius:6, cursor:'pointer', fontSize:15, lineHeight:1, background:sfxEnabled?'rgba(20,241,149,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${sfxEnabled?'rgba(20,241,149,0.35)':'rgba(255,255,255,0.1)'}`, color:sfxEnabled?'#14F195':'rgba(245,230,200,0.35)' }}>{sfxEnabled?'🔊':'🔈'}</button>
        </div>

        <WalletChip compact />
      </div>

      {/* ── OPPONENTS ── */}
      <div style={{ position:'relative', zIndex:10, display:'flex', gap:10, padding:'10px 12px 6px', overflowX:'auto', flexWrap:'nowrap' as const, scrollbarWidth:'none' as const }}>
        {opponents.map(opp => {
          const oppIdx = players.indexOf(opp);
          const isActive = currentPlayerIndex === oppIdx;
          const oppChar = CHARACTERS.find(c => c.key === opp.character) || CHARACTERS[0];
          return (
            <div key={opp.id} style={{ padding:'8px 12px', borderRadius:10, background:isActive?`linear-gradient(135deg, ${oppChar.accentColor}22, rgba(26,20,16,0.9))`:'rgba(26,20,16,0.6)', border:`1.5px solid ${isActive?oppChar.accentColor+'55':'rgba(232,184,75,0.08)'}`, transition:'all 0.3s', minWidth:110, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <span style={{ fontSize:18 }}>{opp.avatar}</span>
                {isActive && <div style={{ width:7, height:7, borderRadius:'50%', background:oppChar.accentColor, boxShadow:`0 0 8px ${oppChar.accentColor}`, animation:'pulse-dot 1s infinite', flexShrink:0 }} />}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:isActive?oppChar.accentColor:'#E8B84B', letterSpacing:'0.04em', marginBottom:2 }}>{opp.name}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, color:'rgba(245,230,200,0.45)' }}>{opp.hand.length} cards</div>
              {/* Face-down cards */}
              <div style={{ display:'flex', marginTop:6 }}>
                {Array.from({ length: Math.min(opp.hand.length, 4) }).map((_, i) => (
                  <div key={i} style={{ marginLeft: i > 0 ? -16 : 0 }}>
                    <GameCard card={opp.hand[i] || opp.hand[0]} isFaceDown size="sm" />
                  </div>
                ))}
                {opp.hand.length > 4 && <div style={{ marginLeft:-12, width:32, height:46, background:'rgba(232,184,75,0.08)', border:'1px solid rgba(232,184,75,0.15)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:9, color:'rgba(232,184,75,0.5)' }}>+{opp.hand.length-4}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CENTER ── */}
      <div style={{ flex:1, position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', gap:'clamp(14px,3vw,32px)', padding:'clamp(8px,2vw,16px)' }}>
        {/* Deck */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div onClick={isMyTurn ? handleDraw : undefined} style={{ cursor:isMyTurn?'pointer':'default', position:'relative', transition:'transform 0.2s' }}
            onMouseEnter={e => { if(isMyTurn)(e.currentTarget as HTMLElement).style.transform='scale(1.06) translateY(-4px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; }}>
            {[2,1,0].map(offset => (
              <div key={offset} style={{ position:offset===0?'relative':'absolute', top:offset*-3, left:offset*2, zIndex:3-offset }}>
                <GameCard card={{ id:'deck', suit:'cowrie', value:'1' }} isFaceDown size="lg" />
              </div>
            ))}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.5)' }}>{deck.length} left</div>
          {pendingPick > 0 && (
            <div style={{ padding:'3px 10px', borderRadius:5, background:'rgba(255,80,50,0.2)', border:'1px solid rgba(255,80,50,0.4)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'#FF6432' }}>
              PICK {pendingPick}! {pendingSpecial === 'pick2' ? '(counter: play a 2)' : pendingSpecial === 'pick3' ? '(counter: play a 5)' : ''}
            </div>
          )}
        </div>

        {/* Pile + suit indicator */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, background:`${activeSuitColor}18`, border:`1.5px solid ${activeSuitColor}55` }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:activeSuitColor, boxShadow:`0 0 8px ${activeSuitColor}` }} />
            <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:activeSuitColor, letterSpacing:'0.1em', textTransform:'uppercase' }}>{currentSuit}</span>
          </div>
          <div style={{ position:'relative' }}>
            {pile.slice(-3,-1).map((c,i) => (
              <div key={c.id} style={{ position:'absolute', top:(i-1)*4, left:(i-1)*3, transform:`rotate(${(i-1)*8}deg)`, opacity:0.4+i*0.2, zIndex:i }}>
                <GameCard card={c} size="lg" />
              </div>
            ))}
            <div style={{ position:'relative', zIndex:5 }}>
              <GameCard card={topCard} size="lg" />
            </div>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:'rgba(245,230,200,0.35)' }}>{pile.length} played</div>
        </div>

        {/* Timer */}
        {isMyTurn && !winner && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            <div style={{ width:'clamp(44px,6vw,56px)', height:'clamp(44px,6vw,56px)', borderRadius:'50%', border:`3px solid ${timeLeft<=5?'#FF4444':'rgba(232,184,75,0.4)'}`, display:'flex', alignItems:'center', justifyContent:'center', background:timeLeft<=5?'rgba(255,68,68,0.12)':'rgba(232,184,75,0.06)', transition:'all 0.3s' }}>
              <span className={timeLeft<=5?'timer-danger':''} style={{ fontFamily:'var(--font-display)', fontSize:'clamp(16px,3vw,22px)', fontWeight:900, color:timeLeft<=5?'#FF4444':'#E8B84B' }}>{timeLeft}</span>
            </div>
            <span style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.1em' }}>YOUR TURN</span>
          </div>
        )}
      </div>

      {/* ── PLAYER HAND ── */}
      <div style={{ position:'relative', zIndex:20, background:'linear-gradient(to top, rgba(13,10,8,0.98), rgba(13,10,8,0.5))', padding:'10px 12px 20px', borderTop:'1px solid rgba(232,184,75,0.06)' }}>
        {/* Player info bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`radial-gradient(circle, ${char.accentColor}44, ${char.color}88)`, border:`2.5px solid ${isMyTurn?char.accentColor:'rgba(232,184,75,0.25)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, boxShadow:isMyTurn?`0 0 16px ${char.accentColor}55`:'none' }}>{humanPlayer.avatar}</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'#E8B84B', letterSpacing:'0.04em' }}>{humanPlayer.name} <span style={{ color:'rgba(245,230,200,0.35)', fontSize:10 }}>· LVL {humanPlayer.level}</span></div>
              <XPBar xp={humanPlayer.xp} level={humanPlayer.level} compact />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!humanPlayer.abilityUsed && isMyTurn && (
              <button onClick={useAbility} style={{ padding:'5px 10px', borderRadius:7, background:`${char.accentColor}18`, border:`1.5px solid ${char.accentColor}55`, color:char.accentColor, fontFamily:'var(--font-display)', fontSize:9, fontWeight:900, cursor:'pointer', letterSpacing:'0.05em', animation:'pulse-gold 2s ease-in-out infinite' }}>⚡ ABILITY</button>
            )}
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.45)' }}>{humanPlayer.hand.length} cards</div>
          </div>
        </div>

        {/* Hand */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, scrollbarWidth:'none' as const, WebkitOverflowScrolling:'touch' as any, justifyContent:humanPlayer.hand.length < 6 ? 'center' : 'flex-start' }}>
          {humanPlayer.hand.map(card => {
            const playable = isMyTurn && topCard
              ? (() => {
                  if (card.value === 'WHOT') return true;
                  // Enforce counter rules when penalty is active
                  if (pendingPick > 0) {
                    if (pendingSpecial === 'pick2') return card.special === 'pick2';
                    if (pendingSpecial === 'pick3') return card.special === 'pick3';
                  }
                  return card.suit === (currentSuit || topCard.suit) || card.value === topCard.value;
                })()
              : false;
            return (
              <div key={card.id} style={{ flexShrink:0 }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform='scale(0.93)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform=''; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; }}
                onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform='scale(0.93)'; }}
                onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform=''; }}
              >
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

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10, flexWrap:'wrap' }}>
          {isMyTurn && !winner && (
            <>
              <button className="btn-secondary" style={{ fontSize:12, padding:'9px 22px', fontWeight:900, letterSpacing:'0.08em' }} onClick={handleDraw}>
                {pendingPick>0 ? 'DRAW ' + pendingPick + ' CARDS' + (pendingSpecial==='pick2'||pendingSpecial==='pick3'?' (or counter)':'') : 'DRAW CARD'}
              </button>
              {selectedCardIds.length > 0 && (
                <button className="btn-primary" style={{ fontSize:12, padding:'9px 26px', fontWeight:900, letterSpacing:'0.08em' }}
                  onClick={() => {
                    const cardId = selectedCardIds[0];
                    const card = humanPlayer.hand.find(c => c.id === cardId);
                    if (!card) return;
                    if (card.value === 'WHOT') {
                      // Play WHOT — this sets pendingNextPlayer in store
                      playCard(cardId);
                      // Show selector after store updates (pendingNextPlayer will be set)
                      setTimeout(() => setShowSuitSelector(true), 60);
                    } else {
                      playCard(cardId);
                    }
                  }}>
                  PLAY CARD ▶
                </button>
              )}
            </>
          )}
          {!isMyTurn && !winner && (
            <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontStyle:'italic', color:'rgba(245,230,200,0.3)', padding:'9px 0' }}>
              Waiting for {players[currentPlayerIndex]?.name}...
            </div>
          )}
        </div>
      </div>

      {/* ── CARD FLY ANIMATION ── */}
      {flyCard && (
        <div style={{
          position:'fixed', top:'50%', left:'50%', zIndex:350,
          pointerEvents:'none', transform:'translate(-50%, -50%)',
          animation:'card-fly-to-pile 0.55s cubic-bezier(0.4,0,0.2,1) forwards',
        }}>
          <GameCard card={flyCard.card} size="sm" />
        </div>
      )}

      {/* ── SUIT SELECTOR MODAL ── */}
      {showSuitSelector && (
        <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)' }}>
          <div style={{ animation:'modal-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <SuitSelector onSelect={handleSuitSelected} />
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {notification && (
        <div style={{ position:'fixed', top:66, left:'50%', transform:'translateX(-50%)', zIndex:300, padding:'10px 22px', borderRadius:9, whiteSpace:'nowrap' as const, background:notification.type==='error'?'rgba(255,68,68,0.18)':notification.type==='success'?'rgba(20,241,149,0.15)':'rgba(232,184,75,0.15)', border:`1.5px solid ${notification.type==='error'?'rgba(255,68,68,0.5)':notification.type==='success'?'rgba(20,241,149,0.5)':'rgba(232,184,75,0.5)'}`, backdropFilter:'blur(12px)', fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:notification.type==='error'?'#FF8888':notification.type==='success'?'#14F195':'#E8B84B', animation:'toast-in 0.3s ease-out', letterSpacing:'0.04em' }}>
          {notification.message}
        </div>
      )}

      {/* ── VICTORY / DEFEAT SCREEN ── */}
      {winner && showWinModal && (
        iWon ? (
          <VictoryScreen winner={winner} stakeAmount={stakeAmount} stakeToken={stakeToken} playerCount={players.length} onMenu={() => setScreen('menu')} onPlayAgain={() => { setShowWinModal(false); setScreen('menu'); }} />
        ) : (
          <DefeatScreen winner={winner} stakeAmount={stakeAmount} stakeToken={stakeToken} onMenu={() => setScreen('menu')} onPlayAgain={() => { setShowWinModal(false); setScreen('menu'); }} />
        )
      )}

      <style>{`
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes card-pop-fly{0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(0.8)}15%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}75%{opacity:1;transform:translateX(-50%) translateY(-10px) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-40px) scale(0.9)}}
        @keyframes modal-pop{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
        @keyframes victory-shine{0%,100%{box-shadow:0 0 40px rgba(232,184,75,0.4)}50%{box-shadow:0 0 80px rgba(232,184,75,0.8),0 0 140px rgba(232,184,75,0.3)}}
        @keyframes defeat-fade{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes card-fly-to-pile{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}60%{opacity:1;transform:translate(-50%,-50%) scale(0.85)}100%{opacity:0;transform:translate(-50%,-50%) scale(0.6)}}
      `}</style>
    </div>
  );
}

// ── Victory Screen ────────────────────────────────────────────────────────────

function VictoryScreen({ winner, stakeAmount, stakeToken, playerCount, onMenu, onPlayAgain }: {
  winner: any; stakeAmount: string; stakeToken: string; playerCount: number; onMenu: ()=>void; onPlayAgain: ()=>void;
}) {
  const char = CHARACTERS.find(c => c.key === winner.character) || CHARACTERS[0];
  const pot = parseFloat(stakeAmount) * playerCount;
  const treasury = pot * 0.005;
  const winnerPot = pot - treasury;
  const xpGained = 150 + playerCount * 25;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at center, rgba(44,26,8,0.97) 0%, rgba(13,10,8,0.99) 100%)', backdropFilter:'blur(4px)' }}>
      {/* Animated gold particles */}
      {Array.from({length:12}).map((_,i) => (
        <div key={i} style={{ position:'absolute', width:6, height:6, borderRadius:'50%', background:'#E8B84B', opacity:0.6, left:`${10+i*7}%`, top:`${Math.random()*80+10}%`, animation:`float ${2+i*0.3}s ease-in-out ${i*0.2}s infinite`, boxShadow:'0 0 8px rgba(232,184,75,0.8)' }} />
      ))}

      <div style={{ textAlign:'center', padding:'48px 40px', borderRadius:28, maxWidth:460, width:'90%', background:`linear-gradient(135deg, ${char.accentColor}15, rgba(26,20,16,0.98))`, border:`2px solid ${char.accentColor}55`, animation:'victory-shine 2s ease-in-out infinite', position:'relative', zIndex:10 }}>
        {/* Crown animation */}
        <div style={{ fontSize:80, marginBottom:16, animation:'float 2s ease-in-out infinite', filter:`drop-shadow(0 0 20px ${char.accentColor}88)` }}>👑</div>

        <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:`${char.accentColor}99`, letterSpacing:'0.25em', marginBottom:10, textTransform:'uppercase' }}>
          Champion
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:900, color:char.accentColor, letterSpacing:'0.08em', marginBottom:6, textShadow:`0 0 30px ${char.accentColor}66` }}>
          {winner.name}
        </div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:16, color:'rgba(245,230,200,0.55)', marginBottom:24 }}>
          reigns supreme! The ancient wealth is restored.
        </div>

        {/* Stake winnings */}
        {pot > 0 && (
          <div style={{ padding:'16px 20px', borderRadius:14, marginBottom:16, background:'rgba(20,241,149,0.1)', border:'1.5px solid rgba(20,241,149,0.3)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(20,241,149,0.6)', letterSpacing:'0.18em', marginBottom:6 }}>POT WON</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:900, color:'#14F195', textShadow:'0 0 20px rgba(20,241,149,0.6)' }}>
              +{winnerPot.toFixed(3)} {stakeToken}
            </div>
            {treasury > 0 && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'rgba(245,230,200,0.3)', marginTop:4 }}>Treasury fee: {treasury.toFixed(4)} {stakeToken}</div>}
          </div>
        )}

        {/* XP */}
        <div style={{ padding:'10px 16px', borderRadius:10, marginBottom:28, background:'rgba(153,69,255,0.1)', border:'1px solid rgba(153,69,255,0.25)', fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#9945FF' }}>
          +{xpGained} XP earned · Level {winner.level}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'13px', fontWeight:900 }} onClick={onMenu}>MAIN MENU</button>
          <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'13px', fontWeight:900 }} onClick={onPlayAgain}>PLAY AGAIN</button>
        </div>
      </div>
    </div>
  );
}

// ── Defeat Screen ─────────────────────────────────────────────────────────────

function DefeatScreen({ winner, stakeAmount, stakeToken, onMenu, onPlayAgain }: {
  winner: any; stakeAmount: string; stakeToken: string; onMenu: ()=>void; onPlayAgain: ()=>void;
}) {
  const char = CHARACTERS.find(c => c.key === winner.character) || CHARACTERS[0];
  const stake = parseFloat(stakeAmount);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.92)', backdropFilter:'blur(6px)' }}>
      <div style={{ textAlign:'center', padding:'44px 36px', borderRadius:24, maxWidth:420, width:'90%', background:'linear-gradient(135deg, rgba(255,68,68,0.08), rgba(26,20,16,0.98))', border:'2px solid rgba(255,68,68,0.25)', animation:'defeat-fade 0.5s ease-out' }}>

        <div style={{ fontSize:72, marginBottom:14, filter:'grayscale(0.3)' }}>💀</div>

        <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(255,100,100,0.6)', letterSpacing:'0.22em', marginBottom:10 }}>DEFEATED</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'#FF6666', letterSpacing:'0.06em', marginBottom:6 }}>
          {winner.name} wins
        </div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:15, color:'rgba(245,230,200,0.45)', marginBottom:24 }}>
          The time thief escapes again. Rise and reclaim your legacy.
        </div>

        {/* Loss */}
        {stake > 0 && (
          <div style={{ padding:'12px 18px', borderRadius:12, marginBottom:16, background:'rgba(255,68,68,0.08)', border:'1.5px solid rgba(255,68,68,0.2)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:900, color:'rgba(255,100,100,0.5)', letterSpacing:'0.18em', marginBottom:4 }}>STAKE LOST</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:'#FF6666' }}>-{stake.toFixed(3)} {stakeToken}</div>
          </div>
        )}

        <div style={{ padding:'10px 16px', borderRadius:10, marginBottom:24, background:'rgba(153,69,255,0.08)', border:'1px solid rgba(153,69,255,0.2)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:'#9945FF' }}>
          +20 XP earned · Keep fighting
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary" style={{ flex:1, fontSize:12, padding:'13px', fontWeight:900 }} onClick={onMenu}>MAIN MENU</button>
          <button className="btn-primary" style={{ flex:2, fontSize:13, padding:'13px', fontWeight:900 }} onClick={onPlayAgain}>TRY AGAIN</button>
        </div>
      </div>
    </div>
  );
}

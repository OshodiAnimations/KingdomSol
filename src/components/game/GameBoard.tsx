'use client';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore, CHARACTERS, CardSuit } from '@/lib/store';
import { GameCard, SuitSelector, CowrieSymbol, SUIT_COLORS } from '@/components/cards/GameCard';
import { WalletChip } from '@/components/wallet/WalletChip';
import { XPBar } from '@/components/ui/XPBar';

const TURN_SECONDS = 20;

export function GameBoard() {
  const {
    players, humanPlayerIndex, currentPlayerIndex,
    topCard, currentSuit, pendingPick, deck, pile,
    selectedCardIds, winner, stakeToken, stakeAmount,
    playCard, drawCard, selectCard, changeSuit, setScreen,
    notification, setNotification,
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  const humanPlayer = players[humanPlayerIndex];
  const isMyTurn = currentPlayerIndex === humanPlayerIndex;

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

  // Notification auto-dismiss
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(t);
  }, [notification, setNotification]);

  // Show WHOT suit selector
  useEffect(() => {
    if (notification?.message === 'WHOT! Choose a suit' && isMyTurn) {
      setShowSuitSelector(true);
    }
  }, [notification, isMyTurn]);

  // Win modal
  useEffect(() => {
    if (winner) setTimeout(() => setShowWinModal(true), 800);
  }, [winner]);

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return;
    const card = humanPlayer.hand.find(c => c.id === cardId);
    if (!card) return;
    if (selectedCardIds.includes(cardId)) {
      playCard(cardId);
      if (card.value === 'WHOT') setShowSuitSelector(true);
    } else {
      selectCard(cardId);
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
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Kente pattern */}
      <div className="pattern-kente" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(13,10,8,0.6)',
        borderBottom: '1px solid rgba(232,184,75,0.1)',
        backdropFilter: 'blur(10px)',
      }}>
        <button onClick={() => setScreen('menu')} style={{
          background: 'transparent', border: '1px solid rgba(232,184,75,0.2)',
          color: 'rgba(245,230,200,0.5)', padding: '6px 14px', borderRadius: 6,
          cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.05em', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.5)'; (e.currentTarget as HTMLElement).style.color = '#E8B84B'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.2)'; (e.currentTarget as HTMLElement).style.color = 'rgba(245,230,200,0.5)'; }}
        >← MENU</button>

        {/* Stake display */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 8,
          background: 'rgba(153,69,255,0.12)',
          border: '1px solid rgba(153,69,255,0.25)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9945FF' }}>STAKE</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#14F195' }}>
            {stakeAmount} {stakeToken}
          </span>
        </div>

        <WalletChip compact />
      </div>

      {/* ── OPPONENTS ROW ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', gap: 20, justifyContent: 'center',
        padding: '16px 20px 8px',
        flexWrap: 'wrap',
      }}>
        {opponents.map((opp, idx) => {
          const oppIndex = players.indexOf(opp);
          const isOppTurn = currentPlayerIndex === oppIndex;
          const char = CHARACTERS.find(c => c.key === opp.character)!;
          return (
            <div key={opp.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              background: isOppTurn ? `linear-gradient(135deg, ${char.accentColor}18 0%, rgba(26,20,16,0.8) 100%)` : 'rgba(26,20,16,0.5)',
              border: `1px solid ${isOppTurn ? char.accentColor + '55' : 'rgba(232,184,75,0.1)'}`,
              transition: 'all 0.3s',
              minWidth: 120,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `radial-gradient(circle, ${char.accentColor}33, ${char.color}66)`,
                  border: `2px solid ${isOppTurn ? char.accentColor : char.accentColor + '44'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {['👑', '🔮', '🦊', '✨', '🌟'][CHARACTERS.indexOf(char)]}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: isOppTurn ? char.accentColor : '#E8B84B', letterSpacing: '0.05em' }}>
                    {opp.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,230,200,0.4)' }}>
                    {opp.hand.length} cards
                  </div>
                </div>
                {isOppTurn && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: char.accentColor,
                    animation: 'pulse-dot 1s ease-in-out infinite',
                  }} />
                )}
              </div>
              {/* Face-down cards preview */}
              <div style={{ display: 'flex', gap: -4 }}>
                {Array.from({ length: Math.min(opp.hand.length, 5) }).map((_, i) => (
                  <div key={i} style={{ marginLeft: i > 0 ? -28 : 0 }}>
                    <GameCard card={opp.hand[i] || opp.hand[0]} isFaceDown size="sm" />
                  </div>
                ))}
                {opp.hand.length > 5 && (
                  <div style={{
                    marginLeft: -20, width: 36, height: 52,
                    background: 'rgba(232,184,75,0.1)',
                    border: '1px solid rgba(232,184,75,0.2)',
                    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(232,184,75,0.5)',
                  }}>+{opp.hand.length - 5}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── GAME CENTER ── */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 40,
        padding: '20px',
      }}>
        {/* Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div
            onClick={() => isMyTurn && drawCard()}
            style={{
              cursor: isMyTurn ? 'pointer' : 'default',
              transform: isMyTurn ? undefined : 'none',
              transition: 'transform 0.2s',
              position: 'relative',
            }}
            onMouseEnter={e => { if (isMyTurn) (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {[2, 1, 0].map(offset => (
              <div key={offset} style={{
                position: offset === 0 ? 'relative' : 'absolute',
                top: offset * -3, left: offset * 2,
                zIndex: 3 - offset,
              }}>
                <GameCard
                  card={{ id: 'deck', suit: 'cowrie', value: '1' }}
                  isFaceDown
                  size="lg"
                />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(245,230,200,0.4)' }}>
            {deck.length} left
          </div>
          {pendingPick > 0 && (
            <div style={{
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(255,100,50,0.2)',
              border: '1px solid rgba(255,100,50,0.4)',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: '#FF6432',
            }}>
              PICK {pendingPick}!
            </div>
          )}
        </div>

        {/* Center pile area */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '20px', borderRadius: 20,
          background: 'radial-gradient(ellipse at center, rgba(232,184,75,0.08) 0%, transparent 70%)',
          border: '1px solid rgba(232,184,75,0.08)',
          minWidth: 160,
        }}>
          {/* Active suit indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: `${activeSuitColor}18`,
            border: `1px solid ${activeSuitColor}44`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeSuitColor }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: activeSuitColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {currentSuit}
            </span>
          </div>

          {/* Top card with pile effect */}
          <div style={{ position: 'relative' }}>
            {pile.slice(-3, -1).map((c, i) => (
              <div key={c.id} style={{
                position: 'absolute',
                top: (i - 1) * 4, left: (i - 1) * 3,
                transform: `rotate(${(i - 1) * 8}deg)`,
                opacity: 0.4 + i * 0.2,
              }}>
                <GameCard card={c} size="lg" />
              </div>
            ))}
            <div style={{ position: 'relative', zIndex: 5 }}>
              <GameCard card={topCard} size="lg" />
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(245,230,200,0.35)' }}>
            {pile.length} played
          </div>
        </div>

        {/* Timer (when my turn) */}
        {isMyTurn && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: `3px solid ${timeLeft <= 5 ? '#FF4444' : 'rgba(232,184,75,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: timeLeft <= 5 ? 'rgba(255,68,68,0.1)' : 'rgba(232,184,75,0.05)',
              transition: 'all 0.3s',
            }}>
              <span className={timeLeft <= 5 ? 'timer-danger' : ''} style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
                color: timeLeft <= 5 ? '#FF4444' : '#E8B84B',
              }}>
                {timeLeft}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,230,200,0.3)', letterSpacing: '0.1em' }}>
              YOUR TURN
            </span>
          </div>
        )}
      </div>

      {/* ── PLAYER HAND ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        background: 'linear-gradient(to top, rgba(13,10,8,0.95) 0%, transparent 100%)',
        padding: '16px 20px 24px',
      }}>
        {/* Player info bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, padding: '0 4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `radial-gradient(circle, ${CHARACTERS.find(c => c.key === humanPlayer.character)!.accentColor}33, ${CHARACTERS.find(c => c.key === humanPlayer.character)!.color}66)`,
              border: `2px solid ${isMyTurn ? CHARACTERS.find(c => c.key === humanPlayer.character)!.accentColor : 'rgba(232,184,75,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, transition: 'border-color 0.3s',
            }}>
              {['👑', '🔮', '🦊', '✨', '🌟'][CHARACTERS.findIndex(c => c.key === humanPlayer.character)]}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#E8B84B', letterSpacing: '0.06em' }}>
                {humanPlayer.name} <span style={{ color: 'rgba(245,230,200,0.3)' }}>· LVL {humanPlayer.level}</span>
              </div>
              <XPBar xp={humanPlayer.xp} level={humanPlayer.level} compact />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(245,230,200,0.4)' }}>
            {humanPlayer.hand.length} cards
          </div>
        </div>

        {/* Hand scroll */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none', justifyContent: humanPlayer.hand.length < 7 ? 'center' : 'flex-start',
        }}>
          {humanPlayer.hand.map((card, idx) => {
            const isPlayable = isMyTurn && topCard
              ? (card.value === 'WHOT' || card.suit === (currentSuit || topCard.suit) || card.value === topCard.value)
              : false;
            return (
              <div key={card.id} className={idx < 3 ? 'card-entering' : ''} style={{ animationDelay: `${idx * 80}ms` }}>
                <GameCard
                  card={card}
                  isSelected={selectedCardIds.includes(card.id)}
                  isPlayable={isPlayable}
                  size="md"
                  onClick={() => handleCardClick(card.id)}
                  dealDelay={idx * 80}
                />
              </div>
            );
          })}
        </div>

        {/* Draw button */}
        {isMyTurn && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 10 }}>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '8px 24px', letterSpacing: '0.1em' }}
              onClick={drawCard}
            >
              {pendingPick > 0 ? `DRAW ${pendingPick} CARDS` : 'DRAW CARD'}
            </button>
            {selectedCardIds.length > 0 && (
              <button className="btn-primary" style={{ fontSize: 12, padding: '8px 24px', letterSpacing: '0.1em' }}
                onClick={() => playCard(selectedCardIds[0])}
              >
                PLAY CARD
              </button>
            )}
          </div>
        )}

        {!isMyTurn && (
          <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(245,230,200,0.3)', fontStyle: 'italic' }}>
              Waiting for {players[currentPlayerIndex]?.name}...
            </span>
          </div>
        )}
      </div>

      {/* ── SUIT SELECTOR MODAL ── */}
      {showSuitSelector && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }}>
          <SuitSelector onSelect={handleSuitSelect} />
        </div>
      )}

      {/* ── NOTIFICATION TOAST ── */}
      {notification && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, padding: '12px 24px', borderRadius: 8,
          background: notification.type === 'error' ? 'rgba(255,68,68,0.15)' : notification.type === 'success' ? 'rgba(20,241,149,0.15)' : 'rgba(232,184,75,0.15)',
          border: `1px solid ${notification.type === 'error' ? 'rgba(255,68,68,0.4)' : notification.type === 'success' ? 'rgba(20,241,149,0.4)' : 'rgba(232,184,75,0.4)'}`,
          backdropFilter: 'blur(10px)',
          fontFamily: 'var(--font-body)', fontSize: 15,
          color: notification.type === 'error' ? '#FF8888' : notification.type === 'success' ? '#14F195' : '#E8B84B',
          animation: 'toast-in 0.3s ease-out',
          whiteSpace: 'nowrap',
        }}>
          {notification.message}
        </div>
      )}

      {/* ── WIN MODAL ── */}
      {winner && showWinModal && (
        <WinModal
          winner={winner}
          isHuman={winner.id === 'human'}
          stakeAmount={stakeAmount}
          stakeToken={stakeToken}
          onClose={() => setScreen('menu')}
          onPlayAgain={() => { setShowWinModal(false); /* reinit */ }}
        />
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Win Modal ────────────────────────────────────────────────────────────────

function WinModal({ winner, isHuman, stakeAmount, stakeToken, onClose, onPlayAgain }: {
  winner: any; isHuman: boolean; stakeAmount: number; stakeToken: string;
  onClose: () => void; onPlayAgain: () => void;
}) {
  const char = CHARACTERS.find(c => c.key === winner.character)!;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        padding: 48, borderRadius: 24, textAlign: 'center',
        background: `linear-gradient(135deg, ${char.accentColor}15 0%, rgba(26,20,16,0.95) 100%)`,
        border: `1px solid ${char.accentColor}44`,
        boxShadow: `0 0 80px ${char.accentColor}22`,
        maxWidth: 400, width: '90%',
        animation: 'modal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {isHuman ? '👑' : '💀'}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
          color: char.accentColor, letterSpacing: '0.08em', marginBottom: 8,
        }}>
          {isHuman ? 'VICTORY!' : 'DEFEATED'}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(245,230,200,0.6)', marginBottom: 24 }}>
          {isHuman
            ? `${winner.name} reigns supreme! +${stakeAmount * 2} ${stakeToken} earned`
            : `${winner.name} wins this round. Better luck next time.`}
        </div>

        {/* XP gained */}
        <div style={{
          padding: '12px 20px', borderRadius: 10, marginBottom: 24,
          background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.25)',
          fontFamily: 'var(--font-mono)', fontSize: 13, color: '#9945FF',
        }}>
          +{isHuman ? 100 : 20} XP earned · Level {winner.level}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '10px 20px' }} onClick={onClose}>
            MAIN MENU
          </button>
          <button className="btn-primary" style={{ fontSize: 12, padding: '10px 20px' }} onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

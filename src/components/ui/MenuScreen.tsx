'use client';
import { useState, useEffect } from 'react';
import { useGameStore, CHARACTERS, CharacterKey, GameMode } from '@/lib/store';
import { GameCard } from '@/components/cards/GameCard';
import { WalletChip } from '@/components/wallet/WalletChip';
import { Card, CardSuit } from '@/lib/store';

// Mock floating cards for background animation
const FLOAT_CARDS: Card[] = [
  { id: 'f1', suit: 'cowrie', value: 'WHOT' },
  { id: 'f2', suit: 'manilla', value: '7' },
  { id: 'f3', suit: 'spearhead', value: '2', special: 'pick2' },
  { id: 'f4', suit: 'bead', value: '14', special: 'general_market' },
  { id: 'f5', suit: 'amole', value: '5', special: 'pick4' },
  { id: 'f6', suit: 'cowrie', value: '8', special: 'suspension' },
  { id: 'f7', suit: 'manilla', value: '11' },
  { id: 'f8', suit: 'bead', value: '3' },
];

export function MenuScreen() {
  const { initGame, setScreen, wallet, toggleWalletModal } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<CharacterKey>('okonkwo');
  const [hoveredMode, setHoveredMode] = useState<GameMode | null>(null);
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const selectedCharData = CHARACTERS.find(c => c.key === selectedChar)!;

  const handleStartGame = (mode: GameMode) => {
    initGame(mode, selectedChar);
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 30% 20%, #2C1A08 0%, #1A1410 50%, #0D0A08 100%)',
    }}>
      {/* Animated kente pattern overlay */}
      <div className="pattern-kente" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

      {/* Floating background cards */}
      {FLOAT_CARDS.map((card, i) => (
        <div key={card.id} style={{
          position: 'absolute',
          left: `${10 + (i * 11) % 80}%`,
          top: `${5 + (i * 13) % 80}%`,
          opacity: 0.06 + (i % 3) * 0.02,
          transform: `rotate(${-20 + i * 7}deg)`,
          animation: `float ${4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
          pointerEvents: 'none',
        }}>
          <GameCard card={card} size="lg" />
        </div>
      ))}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(13,10,8,0.6) 60%, rgba(13,10,8,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Nav bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, letterSpacing: '0.1em' }}>
          <span className="text-gold-shimmer">KINGDOM</span>
          <span style={{ color: '#14F195' }}>SOL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setScreen('profile')} style={{
            background: 'transparent', border: 'none', color: 'rgba(245,230,200,0.5)',
            cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12,
            letterSpacing: '0.1em', transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E8B84B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,200,0.5)')}
          >PROFILE</button>
          <WalletChip compact />
        </div>
      </div>

      {/* Hero section */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 900, margin: '0 auto',
        padding: '40px 32px 0',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 13, letterSpacing: '0.3em',
          color: 'rgba(232,184,75,0.7)', textTransform: 'uppercase', marginBottom: 16,
        }}>
          Ancient Wealth · Modern Chain
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 8vw, 80px)',
          fontWeight: 900,
          lineHeight: 1,
          margin: '0 0 8px',
          letterSpacing: '0.05em',
        }}>
          <span className="text-gold-shimmer">KINGDOM</span>
          <br />
          <span style={{ color: '#14F195', textShadow: '0 0 40px rgba(20,241,149,0.4)' }}>SOL</span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17,
          color: 'rgba(245,230,200,0.55)', maxWidth: 480, margin: '16px auto 40px',
          lineHeight: 1.6,
        }}>
          A time traveller stranded in 2030 must rebuild ancient wealth in Solana — 
          or be lost to history forever.
        </p>

        {/* Mode selection */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          {[
            { mode: 'story' as GameMode, label: 'Story Mode', desc: 'The Time Thief Returns', icon: '📜', accent: '#E8B84B' },
            { mode: 'classic' as GameMode, label: 'Classic Mode', desc: 'WHOT-style card battle', icon: '🎴', accent: '#14F195' },
            { mode: 'multiplayer' as GameMode, label: 'Multiplayer', desc: 'Stake SOL, win big', icon: '⚔️', accent: '#9945FF' },
          ].map(({ mode, label, desc, icon, accent }) => (
            <div key={mode}
              onMouseEnter={() => setHoveredMode(mode)}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => { setShowCharSelect(true); setShowModeSelect(false); }}
              style={{
                width: 200, padding: '24px 20px',
                borderRadius: 16, cursor: 'pointer',
                background: hoveredMode === mode
                  ? `linear-gradient(135deg, ${accent}18 0%, rgba(26,20,16,0.9) 100%)`
                  : 'rgba(26,20,16,0.6)',
                border: `1px solid ${hoveredMode === mode ? accent + '55' : 'rgba(232,184,75,0.12)'}`,
                transition: 'all 0.25s',
                transform: hoveredMode === mode ? 'translateY(-4px)' : 'none',
                backdropFilter: 'blur(10px)',
              }}
              data-mode={mode}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 13,
                color: hoveredMode === mode ? accent : '#E8B84B',
                letterSpacing: '0.08em', marginBottom: 6,
                transition: 'color 0.2s',
              }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(245,230,200,0.45)' }}>
                {desc}
              </div>
              <button className="btn-primary" style={{ marginTop: 16, padding: '10px 20px', fontSize: 11, width: '100%', letterSpacing: '0.08em' }}
                onClick={(e) => { e.stopPropagation(); handleStartGame(mode); }}
              >
                PLAY
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Character preview strip */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '0 32px 60px',
        maxWidth: 900, margin: '0 auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11,
          color: 'rgba(232,184,75,0.5)', letterSpacing: '0.2em',
          textAlign: 'center', marginBottom: 20,
        }}>
          CHOOSE YOUR CHAMPION
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {CHARACTERS.map(char => (
            <div key={char.key}
              onClick={() => setSelectedChar(char.key)}
              style={{
                padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                background: selectedChar === char.key
                  ? `linear-gradient(135deg, ${char.accentColor}22 0%, rgba(26,20,16,0.9) 100%)`
                  : 'rgba(26,20,16,0.5)',
                border: `1px solid ${selectedChar === char.key ? char.accentColor + '66' : 'rgba(232,184,75,0.1)'}`,
                transition: 'all 0.2s',
                minWidth: 130,
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Character avatar placeholder */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `radial-gradient(circle at 40% 35%, ${char.accentColor}33, ${char.color}66)`,
                border: `2px solid ${char.accentColor}44`,
                margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {['👑', '🔮', '🦊', '✨', '🌟'][CHARACTERS.indexOf(char)]}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                color: selectedChar === char.key ? char.accentColor : '#E8B84B',
                letterSpacing: '0.06em', textAlign: 'center', marginBottom: 3,
              }}>
                {char.name.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(245,230,200,0.4)', textAlign: 'center' }}>
                {char.title}
              </div>
              {selectedChar === char.key && (
                <div style={{
                  marginTop: 8, padding: '6px 8px',
                  background: `${char.accentColor}15`, borderRadius: 6,
                  border: `1px solid ${char.accentColor}33`,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: char.accentColor, letterSpacing: '0.05em' }}>
                    ⚡ {char.ability}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected character ability full desc */}
        <div style={{
          marginTop: 20, padding: '16px 24px',
          background: `linear-gradient(135deg, ${selectedCharData.accentColor}12 0%, rgba(26,20,16,0.8) 100%)`,
          border: `1px solid ${selectedCharData.accentColor}30`,
          borderRadius: 12, textAlign: 'center', backdropFilter: 'blur(10px)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: selectedCharData.accentColor, letterSpacing: '0.1em' }}>
            ⚡ ABILITY: {selectedCharData.ability.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(245,230,200,0.6)', marginLeft: 12 }}>
            — {selectedCharData.abilityDesc}
          </span>
        </div>
      </div>

      {/* Bottom links */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', justifyContent: 'center', gap: 32,
        padding: '0 32px 32px',
      }}>
        {['How to Play', 'Leaderboard', 'About KingdomSol'].map(link => (
          <button key={link} style={{
            background: 'transparent', border: 'none',
            color: 'rgba(245,230,200,0.3)',
            fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
            letterSpacing: '0.05em', transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,230,200,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,200,0.3)')}
          >{link}</button>
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-15px) rotate(calc(var(--r, 0deg) + 3deg)); }
        }
      `}</style>
    </div>
  );
}

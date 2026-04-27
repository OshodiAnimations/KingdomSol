'use client';
import React from 'react';
import { Card, CardSuit } from '@/lib/store';

// ─── Suit Symbol SVGs ─────────────────────────────────────────────────────────

function ManillaSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="4" fill="none" />
      <circle cx="16" cy="4" r="3" fill={color} />
      <path d="M8 8 Q4 12 4 16 Q4 24 16 28 Q28 24 28 16 Q28 12 24 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AmoleSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="6" y="4" width="8" height="24" rx="2" fill={color} opacity="0.9" />
      <rect x="18" y="4" width="8" height="24" rx="2" fill={color} opacity="0.7" />
      <rect x="12" y="8" width="8" height="16" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}

function SpearheadSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2 L26 12 L20 12 L20 30 L12 30 L12 12 L6 12 Z" fill={color} />
      <path d="M16 2 L26 12 L20 12 L20 30 L12 30 L12 12 L6 12 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
    </svg>
  );
}

function BeadSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="16" y1="2" x2="16" y2="30" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <circle cx="16" cy="7" r="4" fill={color} />
      <circle cx="16" cy="16" r="5" fill={color} opacity="0.85" />
      <circle cx="16" cy="25" r="4" fill={color} opacity="0.7" />
      <circle cx="8" cy="11" r="3" fill={color} opacity="0.6" />
      <circle cx="24" cy="11" r="3" fill={color} opacity="0.6" />
      <circle cx="8" cy="21" r="3" fill={color} opacity="0.5" />
      <circle cx="24" cy="21" r="3" fill={color} opacity="0.5" />
    </svg>
  );
}

function CowrieSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="16" rx="10" ry="13" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="7" ry="10" fill={color} opacity="0.2" />
      <path d="M9 16 Q10 12 16 11 Q22 12 23 16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M12 14 L12 18 M14 13 L14 19 M16 13 L16 19 M18 13 L18 19 M20 14 L20 18" stroke={color} strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

const SUIT_SYMBOLS = {
  manilla: ManillaSymbol,
  amole: AmoleSymbol,
  spearhead: SpearheadSymbol,
  bead: BeadSymbol,
  cowrie: CowrieSymbol,
};

const SUIT_COLORS: Record<CardSuit, string> = {
  manilla: '#E8B84B',
  amole: '#14F195',
  spearhead: '#FF6FD8',
  bead: '#00C2FF',
  cowrie: '#9945FF',
};

const SUIT_BG: Record<CardSuit, string> = {
  manilla: 'linear-gradient(135deg, #3D2B00 0%, #1A1410 100%)',
  amole: 'linear-gradient(135deg, #001A10 0%, #1A1410 100%)',
  spearhead: 'linear-gradient(135deg, #2D0020 0%, #1A1410 100%)',
  bead: 'linear-gradient(135deg, #001A2D 0%, #1A1410 100%)',
  cowrie: 'linear-gradient(135deg, #1A0035 0%, #1A1410 100%)',
};

const SPECIAL_LABELS: Record<string, string> = {
  pick2: 'PICK 2',
  pick4: 'PICK 4',
  general_market: 'MARKET',
  hold_on: 'HOLD ON',
  suspension: 'SUSPEND',
};

// ─── Card Component ───────────────────────────────────────────────────────────

interface GameCardProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  isFaceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  dealDelay?: number;
}

export function GameCard({
  card,
  isSelected = false,
  isPlayable = false,
  isFaceDown = false,
  size = 'md',
  onClick,
  dealDelay = 0,
}: GameCardProps) {
  const dims = { sm: { w: 64, h: 90 }, md: { w: 95, h: 133 }, lg: { w: 115, h: 162 } };
  const { w, h } = dims[size];
  const color = SUIT_COLORS[card.suit];
  const SuitSymbol = SUIT_SYMBOLS[card.suit];

  if (isFaceDown) {
    return (
      <div
        style={{
          width: w, height: h,
          background: 'linear-gradient(135deg, #2C2218 0%, #1A1410 100%)',
          border: '2px solid rgba(232,184,75,0.25)',
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Kente back pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(232,184,75,0.06) 6px, rgba(232,184,75,0.06) 12px)',
        }} />
        <div style={{
          position: 'absolute', inset: 4,
          border: '1px solid rgba(232,184,75,0.15)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CowrieSymbol size={w * 0.4} color="rgba(232,184,75,0.3)" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`game-card ${isPlayable ? 'playable' : ''} ${isSelected ? 'selected' : ''}`}
      style={{
        width: w, height: h,
        background: SUIT_BG[card.suit],
        animationDelay: `${dealDelay}ms`,
        flexShrink: 0,
        fontFamily: 'var(--font-display)',
      }}
      onClick={onClick}
    >
      {/* Corner value top-left */}
      <div style={{ position: 'absolute', top: 6, left: 8, lineHeight: 1 }}>
        <div style={{ fontSize: size === 'sm' ? 10 : 13, fontWeight: 700, color, letterSpacing: '-0.02em' }}>
          {card.value}
        </div>
        <div style={{ marginTop: 2 }}>
          <SuitSymbol size={size === 'sm' ? 10 : 14} color={color} />
        </div>
      </div>

      {/* Center symbol */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
        {card.value === 'WHOT' ? (
          <div style={{
            fontSize: size === 'sm' ? 14 : size === 'md' ? 18 : 22,
            fontWeight: 900, color: '#FFD700',
            textShadow: '0 0 20px rgba(255,215,0,0.8)',
            letterSpacing: '0.05em',
          }}>WHOT</div>
        ) : (
          <SuitSymbol size={size === 'sm' ? 24 : size === 'md' ? 36 : 48} color={color} />
        )}
        {card.special && (
          <div style={{
            fontSize: size === 'sm' ? 7 : 9,
            color: '#FFD700',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textAlign: 'center',
          }}>
            {SPECIAL_LABELS[card.special]}
          </div>
        )}
      </div>

      {/* Corner value bottom-right (rotated) */}
      <div style={{ position: 'absolute', bottom: 6, right: 8, transform: 'rotate(180deg)', lineHeight: 1 }}>
        <div style={{ fontSize: size === 'sm' ? 10 : 13, fontWeight: 700, color, letterSpacing: '-0.02em' }}>
          {card.value}
        </div>
        <div style={{ marginTop: 2 }}>
          <SuitSymbol size={size === 'sm' ? 10 : 14} color={color} />
        </div>
      </div>

      {/* Playable glow border */}
      {isPlayable && (
        <div style={{
          position: 'absolute', inset: -2,
          borderRadius: 14,
          border: '2px solid rgba(20,241,149,0.8)',
          pointerEvents: 'none',
          animation: 'pulse-gold 1.5s ease-in-out infinite',
        }} />
      )}
    </div>
  );
}

// ─── Suit Selector ────────────────────────────────────────────────────────────

export function SuitSelector({ onSelect }: { onSelect: (suit: CardSuit) => void }) {
  const suits: CardSuit[] = ['manilla', 'amole', 'spearhead', 'bead', 'cowrie'];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      padding: 24, background: 'rgba(26,20,16,0.95)',
      borderRadius: 16, border: '1px solid rgba(232,184,75,0.3)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#E8B84B', letterSpacing: '0.1em' }}>
        CALL YOUR SUIT
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {suits.map(suit => {
          const Symbol = SUIT_SYMBOLS[suit];
          const color = SUIT_COLORS[suit];
          return (
            <button key={suit} onClick={() => onSelect(suit)} style={{
              width: 60, height: 60, borderRadius: 12,
              background: SUIT_BG[suit],
              border: `2px solid ${color}33`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}33`; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <Symbol size={24} color={color} />
              <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase' }}>
                {suit}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SUIT_COLORS, SUIT_SYMBOLS, ManillaSymbol, AmoleSymbol, SpearheadSymbol, BeadSymbol, CowrieSymbol };

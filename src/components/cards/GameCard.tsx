'use client';
import React from 'react';
import { Card, CardSuit } from '@/lib/store';

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
      <rect x="5" y="3" width="9" height="26" rx="2" fill={color} />
      <rect x="18" y="3" width="9" height="26" rx="2" fill={color} opacity="0.75" />
      <rect x="11" y="8" width="10" height="16" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}

function SpearheadSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 1 L28 13 L21 13 L21 31 L11 31 L11 13 L4 13 Z" fill={color} />
    </svg>
  );
}

function BeadSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="16" y1="2" x2="16" y2="30" stroke={color} strokeWidth="2" opacity="0.4" />
      <circle cx="16" cy="6" r="5" fill={color} />
      <circle cx="16" cy="16" r="6" fill={color} opacity="0.85" />
      <circle cx="16" cy="26" r="5" fill={color} opacity="0.7" />
      <circle cx="7" cy="11" r="4" fill={color} opacity="0.6" />
      <circle cx="25" cy="11" r="4" fill={color} opacity="0.6" />
    </svg>
  );
}

function CowrieSymbol({ size = 32, color = '#E8B84B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="16" rx="11" ry="14" fill={color} opacity="0.18" stroke={color} strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="7" ry="10" fill={color} opacity="0.25" />
      <path d="M8 16 Q10 11 16 10 Q22 11 24 16" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M11 13 L11 19 M14 12 L14 20 M16 12 L16 20 M18 12 L18 20 M21 13 L21 19" stroke={color} strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

const SUIT_SYMBOLS = { manilla:ManillaSymbol, amole:AmoleSymbol, spearhead:SpearheadSymbol, bead:BeadSymbol, cowrie:CowrieSymbol };

export const SUIT_COLORS: Record<CardSuit, string> = {
  manilla:'#E8B84B', amole:'#14F195', spearhead:'#FF6FD8', bead:'#00C2FF', cowrie:'#9945FF'
};

const SUIT_BG: Record<CardSuit, string> = {
  manilla:'linear-gradient(145deg, #3D2800 0%, #1A1410 100%)',
  amole:'linear-gradient(145deg, #001F10 0%, #1A1410 100%)',
  spearhead:'linear-gradient(145deg, #2D0022 0%, #1A1410 100%)',
  bead:'linear-gradient(145deg, #001E30 0%, #1A1410 100%)',
  cowrie:'linear-gradient(145deg, #1C0038 0%, #1A1410 100%)',
};

const SPECIAL_LABELS: Record<string, string> = {
  pick2:'PICK 2', pick4:'PICK 4', general_market:'MARKET', hold_on:'HOLD ON', suspension:'SUSPEND',
};

// SIZES: sm = opponent preview, md = hand cards on mobile, lg = main hand
const DIMS = {
  sm:  { w: 70,  h: 100, valSize: 14, symSize: 18, cornerSize: 12, cornerSym: 12, spSize: 8  },
  md:  { w: 90,  h: 128, valSize: 18, symSize: 28, cornerSize: 14, cornerSym: 14, spSize: 9  },
  lg:  { w: 115, h: 164, valSize: 24, symSize: 44, cornerSize: 17, cornerSym: 17, spSize: 11 },
};

interface GameCardProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  isFaceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  dealDelay?: number;
}

export function GameCard({ card, isSelected=false, isPlayable=false, isFaceDown=false, size='md', onClick, dealDelay=0 }: GameCardProps) {
  const d = DIMS[size];
  const color = SUIT_COLORS[card.suit];
  const SuitSymbol = SUIT_SYMBOLS[card.suit];
  const isWHOT = card.value === 'WHOT';

  if (isFaceDown) {
    return (
      <div style={{
        width:d.w, height:d.h, borderRadius:12, flexShrink:0,
        background:'linear-gradient(145deg, #2C2218, #1A1410)',
        border:'2px solid rgba(232,184,75,0.2)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(232,184,75,0.05) 6px,rgba(232,184,75,0.05) 12px)' }} />
        <div style={{ position:'absolute', inset:4, border:'1px solid rgba(232,184,75,0.12)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CowrieSymbol size={d.w*0.4} color="rgba(232,184,75,0.25)" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`game-card${isPlayable?' playable':''}${isSelected?' selected':''}`}
      style={{
        width:d.w, height:d.h,
        background: isWHOT ? 'linear-gradient(145deg, #1C0038, #0D0A08)' : SUIT_BG[card.suit],
        borderRadius:12, border:`2.5px solid ${isSelected?'#FFD700':isPlayable?'#14F195':color+'44'}`,
        position:'relative', overflow:'hidden', cursor: onClick?'pointer':'default',
        flexShrink:0,
        boxShadow: isSelected
          ? `0 0 24px rgba(255,215,0,0.6), 0 12px 40px rgba(0,0,0,0.6)`
          : isPlayable
          ? `0 0 16px ${color}55, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 4px 20px rgba(0,0,0,0.5)`,
        transform: isSelected ? 'translateY(-18px) scale(1.08)' : 'none',
        transition:'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        animationDelay:`${dealDelay}ms`,
      }}
    >
      {/* Shine overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents:'none', borderRadius:10 }} />

      {/* TOP LEFT corner */}
      <div style={{ position:'absolute', top:6, left:7, lineHeight:1 }}>
        <div style={{ fontSize:d.cornerSize, fontWeight:900, color, fontFamily:'var(--font-display)', letterSpacing:'-0.02em', textShadow:`0 0 10px ${color}88` }}>
          {isWHOT ? 'S' : card.value}
        </div>
        <div style={{ marginTop:2 }}>
          <SuitSymbol size={d.cornerSym} color={color} />
        </div>
      </div>

      {/* CENTER */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
        {isWHOT ? (
          <div style={{
            fontFamily:'var(--font-display)', fontSize:d.valSize+4, fontWeight:900,
            color:'#FFD700', textShadow:'0 0 24px rgba(255,215,0,0.9)',
            letterSpacing:'0.04em', textAlign:'center',
          }}>SOL CARD</div>
        ) : (
          <>
            <SuitSymbol size={d.symSize} color={color} />
            <div style={{
              fontFamily:'var(--font-display)', fontSize:d.valSize, fontWeight:900,
              color, textShadow:`0 0 12px ${color}88`,
              letterSpacing:'-0.01em', lineHeight:1,
            }}>{card.value}</div>
          </>
        )}
        {card.special && (
          <div style={{
            fontFamily:'var(--font-display)', fontSize:d.spSize, fontWeight:900,
            color:'#FFD700', letterSpacing:'0.08em', textAlign:'center',
            background:'rgba(0,0,0,0.4)', padding:'2px 6px', borderRadius:4,
            textShadow:'0 0 8px rgba(255,215,0,0.8)',
          }}>
            {SPECIAL_LABELS[card.special]}
          </div>
        )}
      </div>

      {/* BOTTOM RIGHT corner (rotated) */}
      <div style={{ position:'absolute', bottom:6, right:7, transform:'rotate(180deg)', lineHeight:1 }}>
        <div style={{ fontSize:d.cornerSize, fontWeight:900, color, fontFamily:'var(--font-display)', letterSpacing:'-0.02em' }}>
          {isWHOT ? 'S' : card.value}
        </div>
        <div style={{ marginTop:2 }}>
          <SuitSymbol size={d.cornerSym} color={color} />
        </div>
      </div>

      {/* Playable pulse ring */}
      {isPlayable && !isSelected && (
        <div style={{
          position:'absolute', inset:-2, borderRadius:14,
          border:`2px solid ${color}`,
          animation:'pulse-gold 1.4s ease-in-out infinite',
          pointerEvents:'none',
        }} />
      )}
    </div>
  );
}

// ─── Suit Selector ────────────────────────────────────────────────────────────

export function SuitSelector({ onSelect }: { onSelect: (suit: CardSuit) => void }) {
  const suits: { suit: CardSuit; icon: string }[] = [
    { suit:'manilla', icon:'🔩' },
    { suit:'amole', icon:'📦' },
    { suit:'spearhead', icon:'🏹' },
    { suit:'bead', icon:'📿' },
    { suit:'cowrie', icon:'🐚' },
  ];

  return (
    <div style={{
      padding:'28px 24px', borderRadius:20,
      background:'linear-gradient(135deg, rgba(26,20,16,0.98), rgba(13,10,8,0.99))',
      border:'2px solid rgba(232,184,75,0.35)',
      boxShadow:'0 20px 60px rgba(0,0,0,0.9)',
      textAlign:'center',
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'#E8B84B', letterSpacing:'0.12em', marginBottom:20 }}>
        CALL YOUR SUIT
      </div>
      <div style={{ display:'flex', gap:12 }}>
        {suits.map(({ suit, icon }) => {
          const c = SUIT_COLORS[suit];
          const Sym = SUIT_SYMBOLS[suit];
          return (
            <button key={suit} onClick={() => onSelect(suit)} style={{
              width:72, height:80, borderRadius:14,
              background:SUIT_BG[suit], border:`2px solid ${c}44`,
              cursor:'pointer', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:6,
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=c; (e.currentTarget as HTMLElement).style.transform='scale(1.12) translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${c}44`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=`${c}44`; (e.currentTarget as HTMLElement).style.transform='scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}
            >
              <Sym size={28} color={c} />
              <span style={{ fontSize:9, fontFamily:'var(--font-display)', fontWeight:900, color:c, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {suit}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SUIT_SYMBOLS, ManillaSymbol, AmoleSymbol, SpearheadSymbol, BeadSymbol, CowrieSymbol };

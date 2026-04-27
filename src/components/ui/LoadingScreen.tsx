'use client';
import { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { CowrieSymbol } from '@/components/cards/GameCard';

export function LoadingScreen() {
  const setScreen = useGameStore(s => s.setScreen);

  useEffect(() => {
    const t = setTimeout(() => setScreen('menu'), 2200);
    return () => clearTimeout(t);
  }, [setScreen]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at center, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite',
      }} />

      {/* Cowry logo */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div className="cowry-spin" style={{ filter: 'drop-shadow(0 0 20px rgba(232,184,75,0.6))' }}>
          <CowrieSymbol size={72} color="#E8B84B" />
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(28px, 6vw, 48px)',
        fontWeight: 900,
        letterSpacing: '0.12em',
        marginBottom: 4,
      }} className="text-gold-shimmer">
        KINGDOM<span style={{ color: '#14F195', WebkitTextFillColor: '#14F195' }}>SOL</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'rgba(245,230,200,0.4)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: 48,
      }}>
        Build Your Empire on Solana
      </div>

      {/* Loading bar */}
      <div style={{
        width: 200, height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, #9945FF, #14F195)',
          animation: 'loading-bar 2s ease-in-out forwards',
        }} />
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

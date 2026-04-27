'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { CowrieSymbol } from '@/components/cards/GameCard';

export function LoadingScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const musicEnabled = useGameStore(s => s.musicEnabled);
  const [phase, setPhase] = useState<'loading' | 'tap'>('loading');
  const bgRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // After 2s show "tap to start"
    const t = setTimeout(() => setPhase('tap'), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleTap = () => {
    // Start music on user gesture (required by browsers)
    if (typeof window !== 'undefined' && musicEnabled) {
      const audio = new Audio('/bg-music.mp3');
      audio.loop = true;
      audio.volume = 0.35;
      audio.play().catch(() => {});
      // Store ref globally so GameBoard can control it
      (window as any).__bgMusic = audio;
    }
    setScreen('menu');
  };

  return (
    <div
      onClick={phase === 'tap' ? handleTap : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, cursor: phase === 'tap' ? 'pointer' : 'default',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 70%)',
        animation: 'pulse 2s ease-in-out infinite', pointerEvents: 'none',
      }} />

      {/* Cowry logo */}
      <div style={{ marginBottom: 28, filter: 'drop-shadow(0 0 24px rgba(232,184,75,0.6))' }}>
        <div className="cowry-spin">
          <CowrieSymbol size={80} color="#E8B84B" />
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(32px, 7vw, 56px)',
        fontWeight: 900, letterSpacing: '0.12em', marginBottom: 6,
      }} className="text-gold-shimmer">
        KINGDOM<span style={{ color:'#14F195', WebkitTextFillColor:'#14F195' }}>SOL</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
        color: 'rgba(245,230,200,0.4)', letterSpacing: '0.22em',
        textTransform: 'uppercase', marginBottom: 48,
      }}>
        Build Your Empire on Solana
      </div>

      {phase === 'loading' && (
        <div style={{ width: 220, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, #9945FF, #14F195)',
            animation: 'loading-bar 2s ease-in-out forwards',
          }} />
        </div>
      )}

      {phase === 'tap' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          animation: 'tap-appear 0.5s ease-out forwards',
        }}>
          <div style={{
            padding: '16px 40px', borderRadius: 14,
            background: 'linear-gradient(135deg, #E8B84B, #B8860B)',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900,
            color: '#1A1410', letterSpacing: '0.1em', cursor: 'pointer',
            boxShadow: '0 0 40px rgba(232,184,75,0.5)',
            animation: 'tap-pulse 1.5s ease-in-out infinite',
          }}>
            TAP TO ENTER
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(245,230,200,0.35)', letterSpacing: '0.1em' }}>
            🎵 Click to enable music & enter the kingdom
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading-bar { 0%{width:0} 100%{width:100%} }
        @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes tap-appear { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tap-pulse { 0%,100%{box-shadow:0 0 30px rgba(232,184,75,0.4)} 50%{box-shadow:0 0 60px rgba(232,184,75,0.8), 0 0 100px rgba(232,184,75,0.3)} }
      `}</style>
    </div>
  );
}

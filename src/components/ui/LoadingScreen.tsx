'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { CowrieSymbol } from '@/components/cards/GameCard';

type Phase = 'loading' | 'checking' | 'tap' | 'restored';

export function LoadingScreen() {
  const { setScreen, profile, restoreProfileFromCloud } = useGameStore();
  const [phase, setPhase] = useState<Phase>('loading');
  const [restoredName, setRestoredName] = useState('');
  const [checkMsg, setCheckMsg] = useState('Connecting to the kingdom...');

  useEffect(() => {
    const run = async () => {
      // Phase 1: show loading bar for 1.5s
      await new Promise(r => setTimeout(r, 1500));

      // Phase 2: if no local profile, try to restore from cloud
      if (!profile) {
        setPhase('checking');
        setCheckMsg('Checking for your saved progress...');

        try {
          const restored = await restoreProfileFromCloud();
          if (restored) {
            const { profile: p } = useGameStore.getState();
            setRestoredName(p?.name || '');
            setPhase('restored');
            return;
          }
        } catch {}
      }

      setPhase('tap');
    };
    run();
  }, []);

  const startMusic = () => {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/bg-music.mp3');
        audio.loop = true; audio.volume = 0.35;
        audio.play().catch(() => {});
        (window as any).__bgMusic = audio;
      } catch {}
    }
  };

  const handleTap = () => {
    if (phase !== 'tap' && phase !== 'restored') return;
    startMusic();
    const { profile: p } = useGameStore.getState();
    setScreen(p ? 'menu' : 'name_setup');
  };

  return (
    <div onClick={handleTap} style={{
      position:'fixed', inset:0,
      background:'radial-gradient(ellipse at center, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      zIndex:1000, cursor:(phase==='tap'||phase==='restored')?'pointer':'default',
    }}>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(232,184,75,0.08) 0%, transparent 70%)', animation:'pulse 2s ease-in-out infinite', pointerEvents:'none' }} />

      <div style={{ marginBottom:28, filter:'drop-shadow(0 0 24px rgba(232,184,75,0.6))' }}>
        <div className="cowry-spin"><CowrieSymbol size={80} color="#E8B84B" /></div>
      </div>

      <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(32px,7vw,56px)', fontWeight:900, letterSpacing:'0.12em', marginBottom:6 }} className="text-gold-shimmer">
        KINGDOM<span style={{ color:'#14F195', WebkitTextFillColor:'#14F195' }}>SOL</span>
      </div>

      <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.22em', textTransform:'uppercase' as const, marginBottom:48 }}>
        Build Your Empire on Solana
      </div>

      {/* Loading bar */}
      {phase === 'loading' && (
        <div style={{ width:220, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg, #9945FF, #14F195)', animation:'loading-bar 1.5s ease-in-out forwards' }} />
        </div>
      )}

      {/* Checking cloud */}
      {phase === 'checking' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, animation:'tap-appear 0.4s ease-out' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid #9945FF', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(153,69,255,0.7)', letterSpacing:'0.1em' }}>{checkMsg}</div>
          </div>
        </div>
      )}

      {/* Profile restored */}
      {phase === 'restored' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, animation:'tap-appear 0.5s ease-out' }}>
          <div style={{ padding:'12px 28px', borderRadius:12, background:'rgba(20,241,149,0.1)', border:'1.5px solid rgba(20,241,149,0.3)', textAlign:'center', marginBottom:6 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'#14F195', letterSpacing:'0.12em', marginBottom:4 }}>✓ PROGRESS RESTORED</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.7)' }}>
              Welcome back, <strong style={{ color:'#E8B84B' }}>{restoredName}</strong>!
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.4)', marginTop:4 }}>
              Your profile, XP and stats have been recovered.
            </div>
          </div>
          <div style={{ padding:'14px 40px', borderRadius:12, background:'linear-gradient(135deg, #E8B84B, #B8860B)', fontFamily:'var(--font-display)', fontSize:16, fontWeight:900, color:'#1A1410', letterSpacing:'0.1em', cursor:'pointer', boxShadow:'0 0 40px rgba(232,184,75,0.5)', animation:'tap-pulse 1.5s ease-in-out infinite' }}>
            TAP TO CONTINUE
          </div>
        </div>
      )}

      {/* Normal tap */}
      {phase === 'tap' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, animation:'tap-appear 0.5s ease-out' }}>
          <div style={{ padding:'16px 44px', borderRadius:14, background:'linear-gradient(135deg, #E8B84B, #B8860B)', fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#1A1410', letterSpacing:'0.1em', cursor:'pointer', boxShadow:'0 0 40px rgba(232,184,75,0.5)', animation:'tap-pulse 1.5s ease-in-out infinite' }}>
            TAP TO ENTER
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.35)', letterSpacing:'0.08em' }}>
            🎵 Click to enable music & enter the kingdom
          </div>
          {profile && (
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'rgba(232,184,75,0.6)', letterSpacing:'0.1em' }}>
              Welcome back, {profile.name}!
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes loading-bar{0%{width:0}100%{width:100%}}
        @keyframes pulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
        @keyframes tap-appear{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tap-pulse{0%,100%{box-shadow:0 0 30px rgba(232,184,75,0.4)}50%{box-shadow:0 0 60px rgba(232,184,75,0.8),0 0 100px rgba(232,184,75,0.3)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

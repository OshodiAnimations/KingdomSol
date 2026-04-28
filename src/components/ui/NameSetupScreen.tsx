'use client';
import { useState } from 'react';
import { useGameStore, CHARACTERS, CharacterKey } from '@/lib/store';

export function NameSetupScreen() {
  const { createProfile, profile } = useGameStore();
  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterKey>('okonkwo');
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [createdName, setCreatedName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return; }
    if (trimmed.length > 16) { setError('Name must be 16 characters or less'); return; }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) { setError('Letters, numbers, spaces, _ and - only'); return; }
    setCreatedName(trimmed);
    setShowWelcome(true);
  };

  const char = CHARACTERS.find(c => c.key === selectedChar)!;

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 40% 30%, #2C1A08 0%, #1A1410 50%, #0D0A08 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="pattern-kente" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 520,
        padding: '40px 36px', borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(44,26,8,0.95), rgba(26,20,16,0.98))',
        border: '2px solid rgba(232,184,75,0.25)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        animation: 'screen-enter 0.5s ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(232,184,75,0.6)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 10 }}>
            Welcome to
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, letterSpacing: '0.08em', marginBottom: 6 }}>
            <span className="text-gold-shimmer">KINGDOM</span>
            <span style={{ color: '#14F195' }}>SOL</span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(245,230,200,0.5)', lineHeight: 1.5 }}>
            Create your warrior profile to begin
          </div>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, color: 'rgba(232,184,75,0.7)', letterSpacing: '0.18em', marginBottom: 10 }}>
            YOUR WARRIOR NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Enter a unique name..."
            maxLength={16}
            autoFocus
            style={{
              width: '100%', padding: '14px 18px', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: `2px solid ${error ? 'rgba(255,68,68,0.5)' : 'rgba(232,184,75,0.25)'}`,
              color: '#F5E6C8', fontFamily: 'var(--font-display)', fontSize: 20,
              fontWeight: 700, outline: 'none', letterSpacing: '0.04em',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(232,184,75,0.6)')}
            onBlur={e => (e.target.style.borderColor = error ? 'rgba(255,68,68,0.5)' : 'rgba(232,184,75,0.25)')}
          />
          {error && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#FF8888', marginTop: 6 }}>{error}</div>
          )}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(245,230,200,0.3)', marginTop: 6, textAlign: 'right' }}>
            {name.length}/16
          </div>
        </div>

        {/* Character select */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 900, color: 'rgba(232,184,75,0.7)', letterSpacing: '0.18em', marginBottom: 10 }}>
            CHOOSE YOUR POWER
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CHARACTERS.map(c => (
              <button key={c.key} onClick={() => setSelectedChar(c.key)} style={{
                flex: '1 1 calc(50% - 4px)', minWidth: 140, padding: '12px 14px', borderRadius: 12,
                background: selectedChar === c.key ? `linear-gradient(135deg, ${c.accentColor}22, rgba(26,20,16,0.9))` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${selectedChar === c.key ? c.accentColor + '77' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                boxShadow: selectedChar === c.key ? `0 0 20px ${c.accentColor}22` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, color: selectedChar === c.key ? c.accentColor : '#E8B84B', letterSpacing: '0.06em' }}>
                      {c.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(245,230,200,0.4)' }}>
                      {c.title}
                    </div>
                  </div>
                </div>
                {selectedChar === c.key && (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: c.accentColor, marginTop: 4, letterSpacing: '0.04em' }}>
                    ⚡ {c.ability}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Selected ability desc */}
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: `${char.accentColor}10`, border: `1px solid ${char.accentColor}25`,
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(245,230,200,0.6)', lineHeight: 1.4,
          }}>
            <strong style={{ color: char.accentColor }}>{char.ability}:</strong> {char.abilityDesc}
          </div>
        </div>

        {/* Create button */}
        <button
          className="btn-primary"
          style={{ width: '100%', fontSize: 16, padding: '16px', letterSpacing: '0.12em', fontWeight: 900 }}
          onClick={handleCreate}
          disabled={name.trim().length < 2}
        >
          ENTER THE KINGDOM ⚔️
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(245,230,200,0.3)' }}>
          Your profile is saved locally on this device
        </div>
      </div>

      <style>{`
        @keyframes screen-enter { from{opacity:0;transform:scale(0.96) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes welcome-pop { from{opacity:0;transform:scale(0.7) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes welcome-glow { 0%,100%{box-shadow:0 0 40px rgba(232,184,75,0.3)} 50%{box-shadow:0 0 80px rgba(232,184,75,0.7),0 0 120px rgba(232,184,75,0.2)} }
      `}</style>

      {/* Welcome popup */}
      {showWelcome && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', padding:24 }}>
          <div style={{
            maxWidth:460, width:'100%', padding:'48px 40px', borderRadius:24, textAlign:'center',
            background:'linear-gradient(135deg, rgba(44,26,8,0.98), rgba(26,20,16,0.99))',
            border:'2px solid rgba(232,184,75,0.4)',
            boxShadow:'0 0 60px rgba(232,184,75,0.2)',
            animation:'welcome-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Crown icon */}
            <div style={{ fontSize:72, marginBottom:20, filter:'drop-shadow(0 0 20px rgba(232,184,75,0.6))', animation:'float 3s ease-in-out infinite' }}>
              👑
            </div>

            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'rgba(232,184,75,0.6)', letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:14 }}>
              Welcome to KingdomSol
            </div>

            <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,5vw,32px)', fontWeight:900, letterSpacing:'0.06em', marginBottom:6 }}>
              <span className="text-gold-shimmer">{createdName}</span>
            </div>

            <div style={{ fontFamily:'var(--font-body)', fontSize:17, color:'rgba(245,230,200,0.55)', lineHeight:1.7, marginBottom:32, maxWidth:340, margin:'12px auto 32px' }}>
              It's time to reclaim your wealth from the Time Thief. The ancient kingdoms await your return.
            </div>

            {/* Character preview */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'12px 20px', borderRadius:14, background:`${char.accentColor}15`, border:`1.5px solid ${char.accentColor}33`, marginBottom:32 }}>
              <span style={{ fontSize:28 }}>{char.icon}</span>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:char.accentColor, letterSpacing:'0.06em' }}>{char.name}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.45)' }}>⚡ {char.ability}</div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width:'100%', fontSize:16, padding:'16px', letterSpacing:'0.12em', fontWeight:900, animation:'welcome-glow 2s ease-in-out infinite' }}
              onClick={() => { setShowWelcome(false); createProfile(createdName, selectedChar); }}
            >
              ENTER THE KINGDOM ⚔️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

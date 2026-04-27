'use client';
import { useGameStore, CHARACTERS, levelFromXp } from '@/lib/store';

// ─── XP Bar Component ─────────────────────────────────────────────────────────

export function XPBar({ xp, level, compact = false }: { xp: number; level: number; compact?: boolean }) {
  const xpForCurrentLevel = (level - 1) * (level - 1) * 100;
  const xpForNextLevel = level * level * 100;
  const progress = Math.min(((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100, 100);

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <div className="xp-bar" style={{ width: 60 }}>
          <div className="xp-fill" style={{ width: `${progress}%` }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,230,200,0.35)' }}>
          {xp}/{xpForNextLevel} XP
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#9945FF', letterSpacing: '0.1em' }}>
          LEVEL {level}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,230,200,0.35)' }}>
          {xp} / {xpForNextLevel} XP
        </span>
      </div>
      <div className="xp-bar">
        <div className="xp-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { players, humanPlayerIndex, wallet, setScreen } = useGameStore();
  const player = players[humanPlayerIndex];

  if (!player) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #2C1A08 0%, #0D0A08 100%)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#E8B84B', marginBottom: 20 }}>
          No Active Profile
        </div>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(245,230,200,0.5)', marginBottom: 32 }}>
          Start a game first to create your profile
        </p>
        <button className="btn-primary" onClick={() => setScreen('menu')}>GO TO MENU</button>
      </div>
    );
  }

  const char = CHARACTERS.find(c => c.key === player.character)!;
  const xpForNextLevel = player.level * player.level * 100;

  const MOCK_STATS = {
    gamesPlayed: 47,
    gamesWon: 29,
    winRate: '61.7%',
    solEarned: 14.8,
    cardsPlayed: 1240,
    longestWinStreak: 6,
  };

  const MOCK_HISTORY = [
    { mode: 'Classic', result: 'Win', opponent: 'Yaa', xp: 120, token: '0.2 SOL', time: '2h ago' },
    { mode: 'Multiplayer', result: 'Loss', opponent: 'Kwame', xp: 30, token: '-0.1 SOL', time: '5h ago' },
    { mode: 'Story', result: 'Win', opponent: 'Fatima', xp: 150, token: '0.5 SOL', time: '1d ago' },
    { mode: 'Classic', result: 'Win', opponent: 'Tobias', xp: 110, token: '0.15 SOL', time: '1d ago' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 10%, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)',
    }}>
      <div className="pattern-kente" style={{ position: 'fixed', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

      {/* Nav */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px',
        borderBottom: '1px solid rgba(232,184,75,0.08)',
        background: 'rgba(13,10,8,0.5)', backdropFilter: 'blur(10px)',
      }}>
        <button onClick={() => setScreen('menu')} style={{
          background: 'transparent', border: '1px solid rgba(232,184,75,0.2)',
          color: 'rgba(245,230,200,0.5)', padding: '6px 14px', borderRadius: 6,
          cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em',
        }}>← MENU</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#E8B84B', letterSpacing: '0.1em' }}>
          PROFILE
        </span>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 5 }}>

        {/* Hero card */}
        <div style={{
          padding: '32px', borderRadius: 20, marginBottom: 24,
          background: `linear-gradient(135deg, ${char.accentColor}15 0%, rgba(26,20,16,0.9) 60%, ${char.color}20 100%)`,
          border: `1px solid ${char.accentColor}33`,
          display: 'flex', alignItems: 'center', gap: 28,
          backdropFilter: 'blur(10px)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: `radial-gradient(circle at 40% 35%, ${char.accentColor}44, ${char.color}88)`,
            border: `3px solid ${char.accentColor}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
            boxShadow: `0 0 30px ${char.accentColor}33`,
          }}>
            {['👑', '🔮', '🦊', '✨', '🌟'][CHARACTERS.indexOf(char)]}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 24, color: char.accentColor,
              letterSpacing: '0.06em', marginBottom: 4,
            }}>
              {player.name}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(245,230,200,0.5)', marginBottom: 16 }}>
              {char.title} · {char.origin}
            </div>
            <XPBar xp={player.xp} level={player.level} />
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900,
              color: char.accentColor, lineHeight: 1,
            }}>
              {player.level}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,230,200,0.35)', letterSpacing: '0.1em', marginTop: 4 }}>
              LEVEL
            </div>
            {wallet.connected && (
              <div style={{
                marginTop: 12, padding: '6px 12px', borderRadius: 20,
                background: 'rgba(20,241,149,0.1)',
                border: '1px solid rgba(20,241,149,0.25)',
                fontFamily: 'var(--font-mono)', fontSize: 12, color: '#14F195',
              }}>
                ◎ {wallet.balances.SOL.toFixed(3)}
              </div>
            )}
          </div>
        </div>

        {/* Character ability */}
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 24,
          background: `${char.accentColor}10`,
          border: `1px solid ${char.accentColor}25`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: char.accentColor, letterSpacing: '0.06em', marginBottom: 3 }}>
              ABILITY: {char.ability.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(245,230,200,0.55)' }}>
              {char.abilityDesc}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Games Played', value: MOCK_STATS.gamesPlayed, color: '#E8B84B' },
            { label: 'Games Won', value: MOCK_STATS.gamesWon, color: '#14F195' },
            { label: 'Win Rate', value: MOCK_STATS.winRate, color: '#9945FF' },
            { label: 'SOL Earned', value: `◎ ${MOCK_STATS.solEarned}`, color: '#9945FF' },
            { label: 'Cards Played', value: MOCK_STATS.cardsPlayed.toLocaleString(), color: '#00C2FF' },
            { label: 'Win Streak', value: `${MOCK_STATS.longestWinStreak}🔥`, color: '#FF6FD8' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              padding: '16px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(26,20,16,0.7)',
              border: '1px solid rgba(232,184,75,0.08)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
                color, letterSpacing: '-0.02em', marginBottom: 4,
              }}>
                {value}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(245,230,200,0.35)', letterSpacing: '0.05em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent games */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(245,230,200,0.3)', letterSpacing: '0.2em', marginBottom: 12 }}>
            RECENT GAMES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MOCK_HISTORY.map((game, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(26,20,16,0.6)',
                border: `1px solid ${game.result === 'Win' ? 'rgba(20,241,149,0.1)' : 'rgba(255,68,68,0.08)'}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: game.result === 'Win' ? 'rgba(20,241,149,0.15)' : 'rgba(255,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {game.result === 'Win' ? '👑' : '💀'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: game.result === 'Win' ? '#14F195' : '#FF6666', letterSpacing: '0.05em' }}>
                    {game.result} — {game.mode}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(245,230,200,0.4)', marginTop: 2 }}>
                    vs {game.opponent} · {game.time}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: game.result === 'Win' ? '#14F195' : '#FF6666' }}>
                    {game.token}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9945FF', marginTop: 2 }}>
                    +{game.xp} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

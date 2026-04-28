'use client';
import { useState } from 'react';
import { useGameStore, TokenSymbol } from '@/lib/store';

const TOKEN_INFO: Record<TokenSymbol, { name: string; icon: string; color: string }> = {
  SOL: { name: 'Solana', icon: '◎', color: '#9945FF' },
  USDC: { name: 'USD Coin', icon: '$', color: '#2775CA' },
  BONK: { name: 'Bonk', icon: '🐕', color: '#F7931A' },
  JUP: { name: 'Jupiter', icon: '⬡', color: '#16B674' },
  WIF: { name: 'dogwifhat', icon: '🎩', color: '#E8B84B' },
};

// ─── Wallet Chip (compact, used in nav) ──────────────────────────────────────

export function WalletChip({ compact = false }: { compact?: boolean }) {
  const { wallet, toggleWalletModal } = useGameStore();
  const [showFull, setShowFull] = useState(false);

  const providerIcon = wallet.provider === 'phantom' ? '👻' : wallet.provider === 'backpack' ? '🎒' : '🔥';
  const providerColor = wallet.provider === 'phantom' ? '#AB9FF2' : wallet.provider === 'backpack' ? '#E33E3F' : '#FC8E02';

  if (!wallet.connected) {
    return (
      <button className="wallet-chip" onClick={toggleWalletModal}>
        <span style={{ fontSize: 14 }}>◎</span>
        {!compact && <span>Connect Wallet</span>}
        {compact && <span>Connect</span>}
      </button>
    );
  }

  const addr = wallet.address!;
  const short = `${addr.slice(0, 6)}…${addr.slice(-6)}`;

  return (
    <button className="wallet-chip" onClick={toggleWalletModal}
      onMouseEnter={() => setShowFull(true)}
      onMouseLeave={() => setShowFull(false)}
      title={addr}
      style={{ gap: compact ? 6 : 10, position: 'relative' }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background:'#14F195', display:'inline-block', boxShadow:'0 0 8px rgba(20,241,149,0.8)', flexShrink:0 }} />
      {!compact && <span style={{ fontSize:15 }}>{providerIcon}</span>}
      <span style={{ color:'#14F195', fontFamily:'var(--font-mono)', fontSize:compact?10:11 }}>
        {showFull && !compact ? addr.slice(0,8)+'…'+addr.slice(-8) : short}
      </span>
      {!compact && (
        <span style={{ color:providerColor, fontWeight:700, fontFamily:'var(--font-mono)', fontSize:11 }}>
          ◎ {wallet.balances.SOL.toFixed(2)}
        </span>
      )}
    </button>
  );
}

// ─── Full Wallet Modal ────────────────────────────────────────────────────────

export function WalletModal() {
  const { wallet, showWalletModal, toggleWalletModal, connectWallet, disconnectWallet, stakeToken, stakeAmount, setStake } = useGameStore();
  const [connectingTo, setConnectingTo] = useState<'phantom' | 'backpack' | 'solflare' | null>(null);

  if (!showWalletModal) return null;

  const handleConnect = async (provider: 'phantom' | 'backpack' | 'solflare') => {
    setConnectingTo(provider);
    await new Promise(r => setTimeout(r, 1200)); // Simulate connect
    connectWallet(provider);
    setConnectingTo(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) toggleWalletModal(); }}
    >
      <div style={{
        width: 380, borderRadius: 20,
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #1A1410 100%)',
        border: '1px solid rgba(153,69,255,0.3)',
        boxShadow: '0 0 60px rgba(153,69,255,0.15), 0 20px 60px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        animation: 'modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(153,69,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#E8B84B', letterSpacing: '0.08em' }}>
              WALLET
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(245,230,200,0.4)', marginTop: 2 }}>
              {wallet.connected ? 'Connected to Solana' : 'Connect to play & earn'}
            </div>
          </div>
          <button onClick={toggleWalletModal} style={{
            background: 'transparent', border: 'none',
            color: 'rgba(245,230,200,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E8B84B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,200,0.4)')}
          >✕</button>
        </div>

        {!wallet.connected ? (
          /* Connect options */
          <div style={{ padding: '24px 28px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(245,230,200,0.3)', letterSpacing: '0.15em', marginBottom: 16 }}>
              SELECT WALLET
            </div>
            {[
              { provider: 'phantom' as const, name: 'Phantom', desc: 'The friendly Solana wallet', color: '#AB9FF2', icon: '👻' },
              { provider: 'backpack' as const, name: 'Backpack', desc: 'xNFT wallet by Coral', color: '#E33E3F', icon: '🎒' },
            ].map(({ provider, name, desc, color, icon }) => (
              <button key={provider}
                onClick={() => handleConnect(provider)}
                disabled={!!connectingTo}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 12, marginBottom: 10,
                  background: connectingTo === provider ? `${color}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${connectingTo === provider ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                  cursor: connectingTo ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!connectingTo) { (e.currentTarget as HTMLElement).style.borderColor = color + '55'; (e.currentTarget as HTMLElement).style.background = `${color}12`; } }}
                onMouseLeave={e => { if (!connectingTo) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; } }}
              >
                <span style={{ fontSize: 28 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color, letterSpacing: '0.05em' }}>
                    {connectingTo === provider ? 'Connecting...' : name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(245,230,200,0.35)', marginTop: 2 }}>
                    {desc}
                  </div>
                </div>
                {connectingTo === provider && (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${color}`,
                    borderTopColor: 'transparent',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                )}
              </button>
            ))}
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 8,
              background: 'rgba(20,241,149,0.05)',
              border: '1px solid rgba(20,241,149,0.1)',
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(20,241,149,0.5)',
              textAlign: 'center',
            }}>
              🔒 Mock wallet — no real funds required in demo
            </div>
          </div>
        ) : (
          /* Connected view */
          <div style={{ padding: '20px 28px 28px' }}>
            {/* Address */}
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 20,
              background: 'rgba(153,69,255,0.1)',
              border: '1px solid rgba(153,69,255,0.2)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>{wallet.provider === 'phantom' ? '👻' : wallet.provider === 'backpack' ? '🎒' : '🔥'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight:900, color: wallet.provider === 'phantom' ? '#AB9FF2' : wallet.provider === 'backpack' ? '#E33E3F' : '#FC8E02', letterSpacing: '0.08em' }}>
                    {wallet.provider?.toUpperCase()} · DEVNET
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#14F195', boxShadow: '0 0 6px rgba(20,241,149,0.8)', flexShrink:0 }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,230,200,0.5)', wordBreak:'break-all' as const }}>
                  {wallet.address}
                </div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(wallet.address || '').catch(()=>{})} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'rgba(245,230,200,0.5)', fontSize:11, flexShrink:0 }} title="Copy address">📋</button>
            </div>

            {/* Balances */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,230,200,0.3)', letterSpacing: '0.15em', marginBottom: 10 }}>
              BALANCES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {(Object.keys(TOKEN_INFO) as TokenSymbol[]).map(token => {
                const info = TOKEN_INFO[token];
                const bal = wallet.balances[token];
                const isStakeToken = stakeToken === token;
                return (
                  <div key={token}
                    onClick={() => setStake(token, stakeAmount)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      background: isStakeToken ? `${info.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isStakeToken ? info.color + '44' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{info.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: info.color, letterSpacing: '0.05em' }}>{token}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(245,230,200,0.35)' }}>{info.name}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(245,230,200,0.7)', textAlign: 'right' }}>
                      {typeof bal === 'number' && bal > 1000 ? bal.toLocaleString() : bal.toFixed ? bal.toFixed(3) : bal}
                    </div>
                    {isStakeToken && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: info.color }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stake selector */}
            <div style={{
              padding: '14px 16px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(232,184,75,0.06)',
              border: '1px solid rgba(232,184,75,0.15)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(232,184,75,0.5)', letterSpacing: '0.15em', marginBottom: 8 }}>
                STAKE PER GAME
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStake(stakeToken, e.target.value)}
                  step="0.1" min="0"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(232,184,75,0.2)',
                    color: '#E8B84B', fontFamily: 'var(--font-mono)', fontSize: 16,
                    outline: 'none',
                  }}
                />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: TOKEN_INFO[stakeToken].color, minWidth: 50 }}>
                  {stakeToken}
                </div>
              </div>
            </div>

            <button onClick={disconnectWallet} className="btn-secondary" style={{
              width: '100%', fontSize: 12, padding: '10px', letterSpacing: '0.1em',
              color: 'rgba(255,100,100,0.7)', borderColor: 'rgba(255,100,100,0.2)',
            }}>
              DISCONNECT WALLET
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

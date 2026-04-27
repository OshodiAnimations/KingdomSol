'use client';
import { useGameStore } from '@/lib/store';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MenuScreen } from '@/components/ui/MenuScreen';
import { GameBoard } from '@/components/game/GameBoard';
import { ProfileScreen } from '@/components/ui/XPBar';
import { LobbyScreen } from '@/components/ui/LobbyScreen';
import { WalletModal } from '@/components/wallet/WalletChip';

export default function Home() {
  const { screen, showWalletModal } = useGameStore();

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'menu' && <MenuScreen />}
      {screen === 'board' && <GameBoard />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {showWalletModal && <WalletModal />}
    </main>
  );
}

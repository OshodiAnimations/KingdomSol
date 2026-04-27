'use client';
import { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { NameSetupScreen } from '@/components/ui/NameSetupScreen';
import { MenuScreen } from '@/components/ui/MenuScreen';
import { GameBoard } from '@/components/game/GameBoard';
import { ProfileScreen } from '@/components/ui/XPBar';
import { LobbyScreen } from '@/components/ui/LobbyScreen';
import { WalletModal } from '@/components/wallet/WalletChip';

export default function Home() {
  const { screen, showWalletModal, joinWithCode, profile, setScreen } = useGameStore();

  // Check URL for room code on first load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && roomCode.length >= 4) {
      // Auto-navigate to lobby with this code after a short delay
      const timer = setTimeout(() => {
        if (profile) {
          joinWithCode(roomCode.toUpperCase());
        } else {
          // Store code in session to use after profile creation
          sessionStorage.setItem('pendingRoomCode', roomCode.toUpperCase());
        }
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, []);

  // After profile created, check for pending room code
  useEffect(() => {
    if (screen === 'menu' && typeof window !== 'undefined') {
      const pending = sessionStorage.getItem('pendingRoomCode');
      if (pending) {
        sessionStorage.removeItem('pendingRoomCode');
        joinWithCode(pending);
      }
    }
  }, [screen]);

  return (
    <main style={{ minHeight:'100vh', position:'relative' }}>
      {screen === 'loading'    && <LoadingScreen />}
      {screen === 'name_setup' && <NameSetupScreen />}
      {screen === 'menu'       && <MenuScreen />}
      {screen === 'board'      && <GameBoard />}
      {screen === 'profile'    && <ProfileScreen />}
      {screen === 'lobby'      && <LobbyScreen />}
      {showWalletModal         && <WalletModal />}
    </main>
  );
}

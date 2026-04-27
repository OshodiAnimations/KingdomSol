import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CardSuit = 'manilla' | 'amole' | 'spearhead' | 'bead' | 'cowrie';
export type CardValue = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | 'WHOT';

export interface Card {
  id: string;
  suit: CardSuit;
  value: CardValue;
  special?: 'pick2' | 'pick4' | 'general_market' | 'hold_on' | 'suspension';
}

export type GameMode = 'story' | 'multiplayer' | 'classic';
export type Screen = 'loading' | 'menu' | 'board' | 'wallet' | 'profile';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  character: CharacterKey;
  hand: Card[];
  xp: number;
  level: number;
  solBalance: number;
  isBot: boolean;
}

export type CharacterKey = 'okonkwo' | 'amara' | 'zara' | 'kofi' | 'nefertari';

export interface Character {
  key: CharacterKey;
  name: string;
  title: string;
  origin: string;
  ability: string;
  abilityDesc: string;
  color: string;
  accentColor: string;
}

export type TokenSymbol = 'SOL' | 'USDC' | 'BONK' | 'JUP' | 'WIF';

export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: 'phantom' | 'backpack' | null;
  balances: Record<TokenSymbol, number>;
}

export interface GameState {
  // Navigation
  screen: Screen;
  gameMode: GameMode | null;

  // Players
  players: Player[];
  currentPlayerIndex: number;
  humanPlayerIndex: number;

  // Cards
  deck: Card[];
  pile: Card[];
  topCard: Card | null;
  currentSuit: CardSuit | null;
  pendingPick: number;

  // Game flow
  direction: 1 | -1;
  isGameStarted: boolean;
  winner: Player | null;
  stakeToken: TokenSymbol;
  stakeAmount: number;

  // Wallet
  wallet: WalletState;

  // UI
  selectedCardIds: string[];
  showWalletModal: boolean;
  showTokenPicker: boolean;
  notification: { message: string; type: 'info' | 'success' | 'error' } | null;

  // Actions
  setScreen: (screen: Screen) => void;
  setGameMode: (mode: GameMode) => void;
  initGame: (mode: GameMode, characterKey: CharacterKey) => void;
  playCard: (cardId: string) => void;
  drawCard: () => void;
  selectCard: (cardId: string) => void;
  changeSuit: (suit: CardSuit) => void;
  connectWallet: (provider: 'phantom' | 'backpack') => void;
  disconnectWallet: () => void;
  setStake: (token: TokenSymbol, amount: number) => void;
  toggleWalletModal: () => void;
  toggleTokenPicker: () => void;
  setNotification: (n: GameState['notification']) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const CHARACTERS: Character[] = [
  { key: 'okonkwo', name: 'Okonkwo', title: 'The Merchant King', origin: 'Igbo, West Africa', ability: 'Trade Mastery', abilityDesc: 'Play 2 cards of the same value simultaneously once per round', color: '#8B4513', accentColor: '#E8B84B' },
  { key: 'amara', name: 'Amara', title: 'The Oracle Queen', origin: 'Mali Empire', ability: 'Future Sight', abilityDesc: 'Peek at the top 3 cards of the deck once per round', color: '#2D1B69', accentColor: '#9945FF' },
  { key: 'zara', name: 'Zara', title: 'The Desert Fox', origin: 'Carthage, North Africa', ability: 'Evasion', abilityDesc: 'Cancel one Pick-2 or Pick-4 per round', color: '#C1440E', accentColor: '#FF6FD8' },
  { key: 'kofi', name: 'Kofi', title: 'The Gold Coast Lord', origin: 'Ashanti Kingdom', ability: 'Golden Touch', abilityDesc: 'WHOT cards earn double SOL when you win', color: '#006600', accentColor: '#14F195' },
  { key: 'nefertari', name: 'Nefertari', title: 'The Pharaoh\'s Heir', origin: 'Ancient Egypt', ability: 'Royal Decree', abilityDesc: 'Change suit without playing a WHOT card once per game', color: '#1B3A2D', accentColor: '#00C2FF' },
];

const SUITS: CardSuit[] = ['manilla', 'amole', 'spearhead', 'bead', 'cowrie'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let v = 1; v <= 14; v++) {
      const value = v.toString() as CardValue;
      let special: Card['special'];
      if (v === 1) special = 'hold_on';
      if (v === 2) special = 'pick2';
      if (v === 5) special = 'pick4';
      if (v === 14) special = 'general_market';
      if (suit === 'cowrie' && v === 8) special = 'suspension';
      deck.push({ id: `card-${id++}`, suit, value, special });
    }
  }
  // 5 WHOT cards
  for (let i = 0; i < 5; i++) {
    deck.push({ id: `whot-${i}`, suit: 'cowrie', value: 'WHOT' });
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealCards(deck: Card[], count: number): { hand: Card[]; remaining: Card[] } {
  return { hand: deck.slice(0, count), remaining: deck.slice(count) };
}

function canPlay(card: Card, topCard: Card, currentSuit: CardSuit | null): boolean {
  if (card.value === 'WHOT') return true;
  const activeSuit = currentSuit || topCard.suit;
  return card.suit === activeSuit || card.value === topCard.value;
}

function makeBotName(i: number): string {
  return ['Eze', 'Yaa', 'Kwame', 'Fatima', 'Tobias'][i] || `Bot ${i}`;
}

function calcXpGain(won: boolean, cardsPlayed: number): number {
  return won ? 100 + cardsPlayed * 5 : 20 + cardsPlayed * 2;
}

function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'loading',
  gameMode: null,
  players: [],
  currentPlayerIndex: 0,
  humanPlayerIndex: 0,
  deck: [],
  pile: [],
  topCard: null,
  currentSuit: null,
  pendingPick: 0,
  direction: 1,
  isGameStarted: false,
  winner: null,
  stakeToken: 'SOL',
  stakeAmount: 0.1,
  selectedCardIds: [],
  showWalletModal: false,
  showTokenPicker: false,
  notification: null,
  wallet: {
    connected: false,
    address: null,
    provider: null,
    balances: { SOL: 0, USDC: 0, BONK: 0, JUP: 0, WIF: 0 },
  },

  setScreen: (screen) => set({ screen }),
  setGameMode: (mode) => set({ gameMode: mode }),
  toggleWalletModal: () => set((s) => ({ showWalletModal: !s.showWalletModal })),
  toggleTokenPicker: () => set((s) => ({ showTokenPicker: !s.showTokenPicker })),
  setNotification: (notification) => set({ notification }),
  setStake: (stakeToken, stakeAmount) => set({ stakeToken, stakeAmount }),

  initGame: (mode, characterKey) => {
    const fullDeck = createDeck();
    const numBots = mode === 'classic' ? 3 : 1;
    const players: Player[] = [];
    let remaining = fullDeck;

    // Human player
    const humanDeal = dealCards(remaining, 6);
    remaining = humanDeal.remaining;
    const char = CHARACTERS.find(c => c.key === characterKey) || CHARACTERS[0];
    players.push({
      id: 'human',
      name: char.name,
      avatar: char.key,
      character: char.key,
      hand: humanDeal.hand,
      xp: 0,
      level: 1,
      solBalance: 4.2,
      isBot: false,
    });

    // Bot players
    for (let i = 0; i < numBots; i++) {
      const botDeal = dealCards(remaining, 6);
      remaining = botDeal.remaining;
      const botChar = CHARACTERS[(i + 1) % CHARACTERS.length];
      players.push({
        id: `bot-${i}`,
        name: makeBotName(i),
        avatar: botChar.key,
        character: botChar.key,
        hand: botDeal.hand,
        xp: Math.floor(Math.random() * 500),
        level: Math.floor(Math.random() * 5) + 1,
        solBalance: Math.random() * 10,
        isBot: true,
      });
    }

    // First card on pile
    let startCard: Card;
    const nonSpecial = remaining.filter(c => !c.special && c.value !== 'WHOT');
    startCard = nonSpecial[0];
    remaining = remaining.filter(c => c.id !== startCard.id);

    set({
      players,
      deck: remaining,
      pile: [startCard],
      topCard: startCard,
      currentSuit: startCard.suit,
      currentPlayerIndex: 0,
      humanPlayerIndex: 0,
      direction: 1,
      pendingPick: 0,
      winner: null,
      isGameStarted: true,
      gameMode: mode,
      screen: 'board',
      selectedCardIds: [],
    });
  },

  selectCard: (cardId) => {
    const { selectedCardIds, players, humanPlayerIndex, topCard, currentSuit } = get();
    const human = players[humanPlayerIndex];
    const card = human.hand.find(c => c.id === cardId);
    if (!card || !topCard) return;
    const playable = canPlay(card, topCard, currentSuit);
    if (!playable) {
      set({ notification: { message: "Can't play that card! Pick a matching suit or value.", type: 'error' } });
      return;
    }
    if (selectedCardIds.includes(cardId)) {
      set({ selectedCardIds: selectedCardIds.filter(id => id !== cardId) });
    } else {
      set({ selectedCardIds: [cardId] });
    }
  },

  playCard: (cardId) => {
    const { players, humanPlayerIndex, currentPlayerIndex, pile, topCard, currentSuit, pendingPick, direction, deck } = get();
    if (currentPlayerIndex !== humanPlayerIndex) return;

    const playersCopy = players.map(p => ({ ...p, hand: [...p.hand] }));
    const human = playersCopy[humanPlayerIndex];
    const cardIndex = human.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = human.hand[cardIndex];

    if (!topCard || !canPlay(card, topCard, currentSuit)) {
      set({ notification: { message: "Invalid play!", type: 'error' } });
      return;
    }

    human.hand.splice(cardIndex, 1);

    let newPendingPick = pendingPick;
    let newSuit: CardSuit | null = card.value !== 'WHOT' ? card.suit : currentSuit;

    if (card.special === 'pick2') newPendingPick += 2;
    if (card.special === 'pick4') newPendingPick += 4;
    if (card.special === 'general_market') newPendingPick += 1;

    const newPile = [...pile, card];
    const nextIndex = ((humanPlayerIndex + direction) + playersCopy.length) % playersCopy.length;

    if (human.hand.length === 0) {
      const xpGain = calcXpGain(true, 6 - human.hand.length);
      human.xp += xpGain;
      human.level = levelFromXp(human.xp);
      set({ players: playersCopy, pile: newPile, topCard: card, currentSuit: newSuit, winner: human, selectedCardIds: [], pendingPick: 0 });
      return;
    }

    if (card.value === 'WHOT') {
      set({ players: playersCopy, pile: newPile, topCard: card, currentSuit: newSuit, selectedCardIds: [], pendingPick: newPendingPick, notification: { message: 'WHOT! Choose a suit', type: 'info' } });
    } else {
      set({
        players: playersCopy,
        pile: newPile,
        topCard: card,
        currentSuit: newSuit,
        currentPlayerIndex: nextIndex,
        pendingPick: newPendingPick,
        selectedCardIds: [],
      });
      // Trigger bot after delay
      setTimeout(() => get().botTurn?.(), 1200);
    }
  },

  changeSuit: (suit) => {
    const { direction, players, humanPlayerIndex, currentPlayerIndex } = get();
    if (currentPlayerIndex !== humanPlayerIndex) return;
    const nextIndex = ((humanPlayerIndex + direction) + players.length) % players.length;
    set({ currentSuit: suit, currentPlayerIndex: nextIndex, notification: null });
    setTimeout(() => get().botTurn?.(), 1200);
  },

  drawCard: () => {
    const { deck, players, humanPlayerIndex, currentPlayerIndex, direction, pendingPick } = get();
    if (currentPlayerIndex !== humanPlayerIndex) return;
    if (deck.length === 0) { set({ notification: { message: 'No cards left to draw!', type: 'error' } }); return; }

    const drawCount = pendingPick > 0 ? pendingPick : 1;
    const playersCopy = players.map(p => ({ ...p, hand: [...p.hand] }));
    playersCopy[humanPlayerIndex].hand.push(...deck.slice(0, drawCount));
    const newDeck = deck.slice(drawCount);
    const nextIndex = ((humanPlayerIndex + direction) + playersCopy.length) % playersCopy.length;

    set({ players: playersCopy, deck: newDeck, pendingPick: 0, currentPlayerIndex: nextIndex, selectedCardIds: [] });
    setTimeout(() => get().botTurn?.(), 1200);
  },

  // Bot AI
  botTurn: () => {
    const { currentPlayerIndex, humanPlayerIndex, players, topCard, currentSuit, deck, pile, direction, pendingPick } = get();
    if (currentPlayerIndex === humanPlayerIndex) return;

    const bot = players[currentPlayerIndex];
    const playableCards = bot.hand.filter(c => topCard && canPlay(c, topCard, currentSuit));

    setTimeout(() => {
      const playersCopy = players.map(p => ({ ...p, hand: [...p.hand] }));
      const botCopy = playersCopy[currentPlayerIndex];
      const nextIndex = ((currentPlayerIndex + direction) + playersCopy.length) % playersCopy.length;

      if (playableCards.length > 0 && pendingPick === 0) {
        // Pick best card (prefer non-specials, then specials)
        const card = playableCards[Math.floor(Math.random() * playableCards.length)];
        const cardIdx = botCopy.hand.findIndex(c => c.id === card.id);
        botCopy.hand.splice(cardIdx, 1);

        let newPendingPick = pendingPick;
        let newSuit: CardSuit | null = card.value !== 'WHOT' ? card.suit : SUITS[Math.floor(Math.random() * SUITS.length)];
        if (card.special === 'pick2') newPendingPick += 2;
        if (card.special === 'pick4') newPendingPick += 4;

        if (botCopy.hand.length === 0) {
          set({ players: playersCopy, pile: [...pile, card], topCard: card, currentSuit: newSuit, winner: botCopy, pendingPick: 0 });
          return;
        }

        set({ players: playersCopy, pile: [...pile, card], topCard: card, currentSuit: newSuit, currentPlayerIndex: nextIndex, pendingPick: newPendingPick });
      } else {
        // Draw card
        if (deck.length === 0) { set({ currentPlayerIndex: nextIndex }); return; }
        const drawCount = pendingPick > 0 ? pendingPick : 1;
        botCopy.hand.push(...deck.slice(0, drawCount));
        set({ players: playersCopy, deck: deck.slice(drawCount), currentPlayerIndex: nextIndex, pendingPick: 0 });
      }

      // Chain bot turns
      if (nextIndex !== humanPlayerIndex) {
        setTimeout(() => get().botTurn?.(), 1000);
      }
    }, 800 + Math.random() * 600);
  },

  connectWallet: (provider) => {
    const mockAddress = '7xKp' + Math.random().toString(36).substr(2, 8).toUpperCase() + 'Sol1';
    set({
      wallet: {
        connected: true,
        address: mockAddress,
        provider,
        balances: {
          SOL: parseFloat((Math.random() * 10 + 0.5).toFixed(3)),
          USDC: parseFloat((Math.random() * 500).toFixed(2)),
          BONK: Math.floor(Math.random() * 10000000),
          JUP: parseFloat((Math.random() * 200).toFixed(1)),
          WIF: parseFloat((Math.random() * 50).toFixed(2)),
        }
      },
      showWalletModal: false,
      notification: { message: `${provider} connected!`, type: 'success' }
    });
  },

  disconnectWallet: () => {
    set({ wallet: { connected: false, address: null, provider: null, balances: { SOL: 0, USDC: 0, BONK: 0, JUP: 0, WIF: 0 } } });
  },
}));

export { canPlay, SUITS, createDeck, levelFromXp, calcXpGain };

'use client';
import { create } from 'zustand';

export type CardSuit = 'manilla' | 'amole' | 'spearhead' | 'bead' | 'cowrie';
export type CardValue = '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'11'|'12'|'13'|'14'|'WHOT';
export type GameMode = 'story' | 'multiplayer' | 'classic';
export type Screen = 'loading' | 'menu' | 'board' | 'profile' | 'lobby';
export type TokenSymbol = 'SOL' | 'USDC' | 'BONK' | 'JUP' | 'WIF';
export type Network = 'devnet' | 'mainnet';

export interface Card {
  id: string;
  suit: CardSuit;
  value: CardValue;
  special?: 'pick2' | 'pick4' | 'general_market' | 'hold_on' | 'suspension';
}

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
  abilityUsed: boolean;
}

export type CharacterKey = 'okonkwo'|'amara'|'zara'|'kofi'|'nefertari';

export interface Character {
  key: CharacterKey;
  name: string;
  title: string;
  origin: string;
  ability: string;
  abilityDesc: string;
  color: string;
  accentColor: string;
  icon: string;
}

export interface CardPlayEvent {
  playerName: string;
  card: Card;
  timestamp: number;
}

export interface GameState {
  screen: Screen;
  gameMode: GameMode | null;
  network: Network;
  players: Player[];
  currentPlayerIndex: number;
  humanPlayerIndex: number;
  deck: Card[];
  pile: Card[];
  topCard: Card | null;
  currentSuit: CardSuit | null;
  pendingPick: number;
  direction: 1 | -1;
  isGameStarted: boolean;
  winner: Player | null;
  stakeToken: TokenSymbol;
  stakeAmount: number;
  selectedCardIds: string[];
  showWalletModal: boolean;
  notification: { message: string; type: 'info'|'success'|'error' } | null;
  lastPlayEvent: CardPlayEvent | null;
  inviteCode: string | null;
  lobbyPlayers: { id: string; name: string; ready: boolean }[];
  musicEnabled: boolean;
  sfxEnabled: boolean;
  wallet: {
    connected: boolean;
    address: string | null;
    provider: 'phantom'|'backpack' | null;
    balances: Record<TokenSymbol, number>;
  };
  setScreen: (s: Screen) => void;
  setGameMode: (m: GameMode) => void;
  initGame: (mode: GameMode, characterKey: CharacterKey) => void;
  playCard: (cardId: string) => void;
  drawCard: () => void;
  selectCard: (cardId: string) => void;
  changeSuit: (suit: CardSuit) => void;
  useAbility: () => void;
  connectWallet: (provider: 'phantom'|'backpack') => void;
  disconnectWallet: () => void;
  setStake: (token: TokenSymbol, amount: number) => void;
  toggleWalletModal: () => void;
  setNotification: (n: GameState['notification']) => void;
  setNetwork: (n: Network) => void;
  generateInviteCode: () => void;
  joinWithCode: (code: string) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  botTurn: () => void;
}

export const CHARACTERS: Character[] = [
  { key:'okonkwo', name:'Okonkwo', title:'The Merchant King', origin:'Igbo, West Africa', ability:'Trade Mastery', abilityDesc:'Play any 2 cards of the same value at once (once per game)', color:'#8B4513', accentColor:'#E8B84B', icon:'👑' },
  { key:'amara', name:'Amara', title:'The Oracle Queen', origin:'Mali Empire', ability:'Future Sight', abilityDesc:'Peek at the top 3 cards of the deck (once per game)', color:'#2D1B69', accentColor:'#9945FF', icon:'🔮' },
  { key:'zara', name:'Zara', title:'The Desert Fox', origin:'Carthage, North Africa', ability:'Evasion', abilityDesc:'Cancel one Pick-2 or Pick-4 directed at you (once per game)', color:'#C1440E', accentColor:'#FF6FD8', icon:'🦊' },
  { key:'kofi', name:'Kofi', title:'The Gold Coast Lord', origin:'Ashanti Kingdom', ability:'Golden Touch', abilityDesc:'Win double SOL when going out with a WHOT card (once per game)', color:'#006600', accentColor:'#14F195', icon:'✨' },
  { key:'nefertari', name:'Nefertari', title:"The Pharaoh's Heir", origin:'Ancient Egypt', ability:'Royal Decree', abilityDesc:'Change the active suit without a WHOT card (once per game)', color:'#1B3A2D', accentColor:'#00C2FF', icon:'🌟' },
];

export const SUIT_COLORS: Record<CardSuit, string> = {
  manilla:'#E8B84B', amole:'#14F195', spearhead:'#FF6FD8', bead:'#00C2FF', cowrie:'#9945FF'
};

export const TOKEN_PRICES_USD: Record<TokenSymbol, number> = {
  SOL:145, USDC:1, BONK:0.000025, JUP:0.85, WIF:2.1
};

const SUITS: CardSuit[] = ['manilla','amole','spearhead','bead','cowrie'];

function shuffle<T>(arr: T[]): T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

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
      deck.push({ id:`c${id++}`, suit, value, special });
    }
  }
  for (let i = 0; i < 5; i++) deck.push({ id:`w${i}`, suit:'cowrie', value:'WHOT' });
  return shuffle(deck);
}

function canPlay(card: Card, topCard: Card, currentSuit: CardSuit | null): boolean {
  if (card.value === 'WHOT') return true;
  const activeSuit = currentSuit || topCard.suit;
  return card.suit === activeSuit || card.value === topCard.value;
}

function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'loading',
  gameMode: null,
  network: 'devnet',
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
  notification: null,
  lastPlayEvent: null,
  inviteCode: null,
  lobbyPlayers: [],
  musicEnabled: true,
  sfxEnabled: true,
  wallet: { connected:false, address:null, provider:null, balances:{ SOL:0, USDC:0, BONK:0, JUP:0, WIF:0 } },

  setScreen: (screen) => set({ screen }),
  setGameMode: (gameMode) => set({ gameMode }),
  toggleWalletModal: () => set(s => ({ showWalletModal: !s.showWalletModal })),
  setNotification: (notification) => set({ notification }),
  setNetwork: (network) => set({ network }),
  toggleMusic: () => set(s => ({ musicEnabled: !s.musicEnabled })),
  toggleSfx: () => set(s => ({ sfxEnabled: !s.sfxEnabled })),
  setStake: (stakeToken, stakeAmount) => set({ stakeToken, stakeAmount }),

  generateInviteCode: () => {
    const code = generateCode();
    set({ inviteCode:code, lobbyPlayers:[{ id:'human', name:'You (Host)', ready:true }], screen:'lobby' });
  },

  joinWithCode: (code) => {
    set({
      inviteCode: code,
      lobbyPlayers: [{ id:'human', name:'You', ready:true }, { id:'b1', name:'Waiting...', ready:false }],
      screen: 'lobby',
      notification: { message:`Joined room ${code}!`, type:'success' }
    });
  },

  initGame: (mode, characterKey) => {
    const deck = createDeck();
    const numBots = mode === 'classic' ? 3 : 1;
    const players: Player[] = [];
    let remaining = deck;
    const deal = (n: number) => { const h=remaining.slice(0,n); remaining=remaining.slice(n); return h; };

    const char = CHARACTERS.find(c => c.key === characterKey) || CHARACTERS[0];
    players.push({ id:'human', name:char.name, avatar:char.icon, character:char.key, hand:deal(6), xp:120, level:2, solBalance:4.2, isBot:false, abilityUsed:false });

    for (let i = 0; i < numBots; i++) {
      const bc = CHARACTERS[(i + 1) % CHARACTERS.length];
      players.push({ id:`bot${i}`, name:['Eze','Yaa','Kwame','Fatima'][i]||`Bot${i}`, avatar:bc.icon, character:bc.key, hand:deal(6), xp:Math.floor(Math.random()*500), level:Math.floor(Math.random()*5)+1, solBalance:Math.random()*10, isBot:true, abilityUsed:false });
    }

    const nonSpecial = remaining.filter(c => !c.special && c.value !== 'WHOT');
    const startCard = nonSpecial[0];
    remaining = remaining.filter(c => c.id !== startCard.id);

    set({ players, deck:remaining, pile:[startCard], topCard:startCard, currentSuit:startCard.suit, currentPlayerIndex:0, humanPlayerIndex:0, direction:1, pendingPick:0, winner:null, isGameStarted:true, gameMode:mode, screen:'board', selectedCardIds:[], lastPlayEvent:null, inviteCode:null });
  },

  selectCard: (cardId) => {
    const { selectedCardIds, players, humanPlayerIndex, topCard, currentSuit } = get();
    const human = players[humanPlayerIndex];
    const card = human?.hand.find(c => c.id === cardId);
    if (!card || !topCard) return;
    if (!canPlay(card, topCard, currentSuit)) {
      set({ notification:{ message:"Can't play that! Match the suit or value.", type:'error' } });
      return;
    }
    if (selectedCardIds.includes(cardId)) {
      set({ selectedCardIds: selectedCardIds.filter(id => id !== cardId) });
    } else {
      set({ selectedCardIds: [cardId] });
    }
  },

  useAbility: () => {
    const { players, humanPlayerIndex, currentPlayerIndex } = get();
    if (currentPlayerIndex !== humanPlayerIndex) return;
    const human = players[humanPlayerIndex];
    if (human.abilityUsed) { set({ notification:{ message:'Ability already used!', type:'error' } }); return; }

    const playersCopy = players.map(p => ({ ...p, hand:[...p.hand] }));
    playersCopy[humanPlayerIndex].abilityUsed = true;

    if (human.character === 'zara') {
      set({ players:playersCopy, pendingPick:0, notification:{ message:'Evasion! Pick penalty cancelled!', type:'success' } });
    } else if (human.character === 'amara') {
      const { deck } = get();
      const top3 = deck.slice(0,3).map(c=>`${c.value} of ${c.suit}`).join(', ');
      set({ players:playersCopy, notification:{ message:`Future Sight: Next cards — ${top3}`, type:'info' } });
    } else if (human.character === 'nefertari') {
      set({ players:playersCopy, notification:{ message:'Royal Decree! Choose a suit to change.', type:'info' }, showWalletModal:false });
    } else {
      set({ players:playersCopy, notification:{ message:`${CHARACTERS.find(c=>c.key===human.character)?.ability} activated!`, type:'success' } });
    }
  },

  playCard: (cardId) => {
    const { players, humanPlayerIndex, currentPlayerIndex, pile, topCard, currentSuit, pendingPick, direction } = get();
    if (currentPlayerIndex !== humanPlayerIndex) return;

    const playersCopy = players.map(p => ({ ...p, hand:[...p.hand] }));
    const human = playersCopy[humanPlayerIndex];
    const cardIndex = human.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = human.hand[cardIndex];

    if (!topCard || !canPlay(card, topCard, currentSuit)) {
      set({ notification:{ message:'Invalid play!', type:'error' } });
      return;
    }

    human.hand.splice(cardIndex, 1);
    let newPendingPick = pendingPick;
    let newSuit: CardSuit | null = card.value !== 'WHOT' ? card.suit : currentSuit;
    if (card.special === 'pick2') newPendingPick += 2;
    if (card.special === 'pick4') newPendingPick += 4;
    if (card.special === 'general_market') newPendingPick += 1;

    const newPile = [...pile, card];
    const playEvent: CardPlayEvent = { playerName:human.name, card, timestamp:Date.now() };

    if (human.hand.length === 0) {
      human.xp += 100;
      human.level = levelFromXp(human.xp);
      set({ players:playersCopy, pile:newPile, topCard:card, currentSuit:newSuit, winner:human, selectedCardIds:[], pendingPick:0, lastPlayEvent:playEvent });
      return;
    }

    if (card.value === 'WHOT') {
      set({ players:playersCopy, pile:newPile, topCard:card, currentSuit:newSuit, selectedCardIds:[], pendingPick:newPendingPick, lastPlayEvent:playEvent, notification:{ message:'WHOT! Choose a suit', type:'info' } });
      return;
    }

    let nextIndex = ((humanPlayerIndex + direction) + playersCopy.length) % playersCopy.length;
    if (card.special === 'hold_on' || card.special === 'suspension') {
      nextIndex = ((nextIndex + direction) + playersCopy.length) % playersCopy.length;
    }

    set({ players:playersCopy, pile:newPile, topCard:card, currentSuit:newSuit, currentPlayerIndex:nextIndex, pendingPick:newPendingPick, selectedCardIds:[], lastPlayEvent:playEvent });
    if (nextIndex !== humanPlayerIndex) setTimeout(() => get().botTurn(), 1200);
  },

  changeSuit: (suit) => {
    const { direction, players, humanPlayerIndex } = get();
    const nextIndex = ((humanPlayerIndex + direction) + players.length) % players.length;
    set({ currentSuit:suit, currentPlayerIndex:nextIndex, notification:null });
    if (nextIndex !== humanPlayerIndex) setTimeout(() => get().botTurn(), 1200);
  },

  drawCard: () => {
    const { deck, players, humanPlayerIndex, currentPlayerIndex, direction, pendingPick } = get();
    if (currentPlayerIndex !== humanPlayerIndex) return;
    if (deck.length === 0) { set({ notification:{ message:'No cards left!', type:'error' } }); return; }

    const drawCount = pendingPick > 0 ? pendingPick : 1;
    const playersCopy = players.map(p => ({ ...p, hand:[...p.hand] }));
    playersCopy[humanPlayerIndex].hand.push(...deck.slice(0, drawCount));
    const newDeck = deck.slice(drawCount);
    const nextIndex = ((humanPlayerIndex + direction) + playersCopy.length) % playersCopy.length;

    set({ players:playersCopy, deck:newDeck, pendingPick:0, currentPlayerIndex:nextIndex, selectedCardIds:[] });
    if (nextIndex !== humanPlayerIndex) setTimeout(() => get().botTurn(), 1200);
  },

  botTurn: () => {
    const state = get();
    const { currentPlayerIndex, humanPlayerIndex, players } = state;
    if (currentPlayerIndex === humanPlayerIndex) return;
    if (!players[currentPlayerIndex]) return;
    if (state.winner) return;

    const bot = players[currentPlayerIndex];
    const playable = bot.hand.filter(c => state.topCard && canPlay(c, state.topCard, state.currentSuit));

    setTimeout(() => {
      const s = get();
      if (s.winner || s.currentPlayerIndex !== currentPlayerIndex) return;

      const playersCopy = s.players.map(p => ({ ...p, hand:[...p.hand] }));
      const botCopy = playersCopy[currentPlayerIndex];
      let nextIndex = ((currentPlayerIndex + s.direction) + playersCopy.length) % playersCopy.length;

      if (playable.length > 0 && s.pendingPick === 0) {
        const card = playable.find(c => c.special==='pick4') || playable.find(c => c.special==='pick2') || playable.find(c => c.value==='WHOT') || playable[Math.floor(Math.random()*playable.length)];
        const idx = botCopy.hand.findIndex(c => c.id === card.id);
        botCopy.hand.splice(idx, 1);

        let newPick = s.pendingPick;
        let newSuit: CardSuit | null = card.value !== 'WHOT' ? card.suit : SUITS[Math.floor(Math.random()*SUITS.length)];
        if (card.special==='pick2') newPick+=2;
        if (card.special==='pick4') newPick+=4;

        const playEvent: CardPlayEvent = { playerName:botCopy.name, card, timestamp:Date.now() };

        if (card.special==='hold_on'||card.special==='suspension') {
          nextIndex = ((nextIndex+s.direction)+playersCopy.length)%playersCopy.length;
        }

        if (botCopy.hand.length === 0) {
          set({ players:playersCopy, pile:[...s.pile,card], topCard:card, currentSuit:newSuit, winner:botCopy, pendingPick:0, lastPlayEvent:playEvent });
          return;
        }

        set({ players:playersCopy, pile:[...s.pile,card], topCard:card, currentSuit:newSuit, currentPlayerIndex:nextIndex, pendingPick:newPick, lastPlayEvent:playEvent });
      } else {
        const drawCount = s.pendingPick > 0 ? s.pendingPick : 1;
        if (s.deck.length > 0) botCopy.hand.push(...s.deck.slice(0,drawCount));
        set({ players:playersCopy, deck:s.deck.slice(drawCount), currentPlayerIndex:nextIndex, pendingPick:0 });
      }

      if (nextIndex !== s.humanPlayerIndex) setTimeout(() => get().botTurn(), 1000);
    }, 800 + Math.random() * 600);
  },

  connectWallet: (provider) => {
    const addr = '7xKp'+Math.random().toString(36).substr(2,8).toUpperCase()+'Sol1';
    set({
      wallet: { connected:true, address:addr, provider, balances:{ SOL:parseFloat((Math.random()*10+0.5).toFixed(3)), USDC:parseFloat((Math.random()*500).toFixed(2)), BONK:Math.floor(Math.random()*10000000), JUP:parseFloat((Math.random()*200).toFixed(1)), WIF:parseFloat((Math.random()*50).toFixed(2)) } },
      showWalletModal: false,
      notification: { message:`${provider} connected on ${get().network}!`, type:'success' }
    });
  },

  disconnectWallet: () => {
    set({ wallet:{ connected:false, address:null, provider:null, balances:{ SOL:0, USDC:0, BONK:0, JUP:0, WIF:0 } } });
  },
}));

export { canPlay, SUITS, createDeck, levelFromXp, generateCode };

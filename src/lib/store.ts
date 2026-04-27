'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CardSuit = 'manilla' | 'amole' | 'spearhead' | 'bead' | 'cowrie';
export type CardValue = '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'11'|'12'|'13'|'14'|'WHOT';
export type GameMode = 'story' | 'multiplayer' | 'classic';
export type MultiMode = 'war' | 'friendly' | 'raid';
export type Screen = 'loading' | 'name_setup' | 'menu' | 'board' | 'profile' | 'lobby';
export type TokenSymbol = 'SOL' | 'USDC' | 'BONK' | 'JUP' | 'WIF';

export interface Card {
  id: string;
  suit: CardSuit;
  value: CardValue;
  special?: 'pick2' | 'pick4' | 'general_market' | 'hold_on' | 'suspension';
}

export interface PlayerProfile {
  name: string;
  character: CharacterKey;
  gamesPlayed: number;
  gamesWon: number;
  xp: number;
  level: number;
  solEarned: number;
  cardsPlayed: number;
  winStreak: number;
  bestStreak: number;
  createdAt: number;
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

export interface LobbyPlayer {
  id: string;
  name: string;
  character: CharacterKey;
  ready: boolean;
  isHost: boolean;
}

export interface GameState {
  // Navigation
  screen: Screen;
  gameMode: GameMode | null;
  multiMode: MultiMode | null;

  // Player profile (persisted)
  profile: PlayerProfile | null;

  // Active game
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
  raidTimeLeft: number | null;

  // Stake
  stakeToken: TokenSymbol;
  stakeAmount: string;

  // UI state
  selectedCardIds: string[];
  showWalletModal: boolean;
  notification: { message: string; type: 'info'|'success'|'error' } | null;
  lastPlayEvent: CardPlayEvent | null;
  musicEnabled: boolean;
  sfxEnabled: boolean;

  // Multiplayer lobby
  inviteCode: string | null;
  lobbyPlayers: LobbyPlayer[];

  // Wallet
  wallet: {
    connected: boolean;
    address: string | null;
    provider: 'phantom'|'backpack' | null;
    balances: Record<TokenSymbol, number>;
  };

  // Actions
  setScreen: (s: Screen) => void;
  setGameMode: (m: GameMode) => void;
  setMultiMode: (m: MultiMode) => void;
  createProfile: (name: string, character: CharacterKey) => void;
  initGame: (mode: GameMode, multiMode?: MultiMode) => void;
  playCard: (cardId: string) => void;
  drawCard: () => void;
  selectCard: (cardId: string) => void;
  changeSuit: (suit: CardSuit) => void;
  useAbility: () => void;
  recordGameResult: (won: boolean, cardsPlayed: number, solChange: number) => void;
  connectWallet: (provider: 'phantom'|'backpack') => void;
  disconnectWallet: () => void;
  setStake: (token: TokenSymbol, amount: string) => void;
  toggleWalletModal: () => void;
  setNotification: (n: GameState['notification']) => void;
  generateInviteCode: (multiMode: MultiMode) => void;
  joinWithCode: (code: string) => void;
  setLobbyReady: () => void;
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

const SUITS: CardSuit[] = ['manilla','amole','spearhead','bead','cowrie'];

function shuffle<T>(arr: T[]): T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function createDeck(): Card[] {
  const deck: Card[]=[];let id=0;
  for(const suit of SUITS){
    for(let v=1;v<=14;v++){
      const value=v.toString() as CardValue;
      let special:Card['special'];
      if(v===1)special='hold_on';if(v===2)special='pick2';if(v===5)special='pick4';
      if(v===14)special='general_market';if(suit==='cowrie'&&v===8)special='suspension';
      deck.push({id:`c${id++}`,suit,value,special});
    }
  }
  for(let i=0;i<5;i++)deck.push({id:`w${i}`,suit:'cowrie',value:'WHOT'});
  return shuffle(deck);
}

function canPlay(card:Card,topCard:Card,currentSuit:CardSuit|null):boolean{
  if(card.value==='WHOT')return true;
  const s=currentSuit||topCard.suit;
  return card.suit===s||card.value===topCard.value;
}

function levelFromXp(xp:number):number{return Math.floor(Math.sqrt(xp/100))+1;}

function generateCode():string{
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
}

export const useGameStore = create<GameState>()(
  persist(
    (set,get)=>({
      screen:'loading',
      gameMode:null,
      multiMode:null,
      profile:null,
      players:[],
      currentPlayerIndex:0,
      humanPlayerIndex:0,
      deck:[],pile:[],topCard:null,currentSuit:null,
      pendingPick:0,direction:1,isGameStarted:false,winner:null,raidTimeLeft:null,
      stakeToken:'SOL',stakeAmount:'0.1',
      selectedCardIds:[],showWalletModal:false,notification:null,lastPlayEvent:null,
      musicEnabled:true,sfxEnabled:true,
      inviteCode:null,lobbyPlayers:[],
      wallet:{connected:false,address:null,provider:null,balances:{SOL:0,USDC:0,BONK:0,JUP:0,WIF:0}},

      setScreen:(screen)=>set({screen}),
      setGameMode:(gameMode)=>set({gameMode}),
      setMultiMode:(multiMode)=>set({multiMode}),
      toggleWalletModal:()=>set(s=>({showWalletModal:!s.showWalletModal})),
      setNotification:(notification)=>set({notification}),
      toggleMusic:()=>set(s=>({musicEnabled:!s.musicEnabled})),
      toggleSfx:()=>set(s=>({sfxEnabled:!s.sfxEnabled})),
      setStake:(stakeToken,stakeAmount)=>set({stakeToken,stakeAmount}),

      createProfile:(name,character)=>{
        const profile:PlayerProfile={
          name,character,gamesPlayed:0,gamesWon:0,xp:0,level:1,
          solEarned:0,cardsPlayed:0,winStreak:0,bestStreak:0,createdAt:Date.now()
        };
        set({profile,screen:'menu'});
      },

      recordGameResult:(won,cardsPlayed,solChange)=>{
        const {profile}=get();
        if(!profile)return;
        const xpGain=won?100+cardsPlayed*3:20+cardsPlayed;
        const newXp=profile.xp+xpGain;
        const newStreak=won?profile.winStreak+1:0;
        set({profile:{
          ...profile,
          gamesPlayed:profile.gamesPlayed+1,
          gamesWon:profile.gamesWon+(won?1:0),
          xp:newXp,level:levelFromXp(newXp),
          solEarned:profile.solEarned+Math.max(0,solChange),
          cardsPlayed:profile.cardsPlayed+cardsPlayed,
          winStreak:newStreak,
          bestStreak:Math.max(profile.bestStreak,newStreak),
        }});
      },

      initGame:(mode,multiMode)=>{
        const {profile}=get();
        const charKey=profile?.character||'okonkwo';
        const char=CHARACTERS.find(c=>c.key===charKey)||CHARACTERS[0];
        const deck=createDeck();
        const isRaid=multiMode==='raid';
        const handSize=isRaid?3:6;
        const numBots=mode==='multiplayer'?0:mode==='classic'?3:1;
        const players:Player[]=[];
        let remaining=deck;
        const deal=(n:number)=>{const h=remaining.slice(0,n);remaining=remaining.slice(n);return h;};

        players.push({
          id:'human',name:profile?.name||char.name,avatar:char.icon,
          character:charKey,hand:deal(handSize),xp:profile?.xp||0,
          level:profile?.level||1,solBalance:4.2,isBot:false,abilityUsed:false
        });

        for(let i=0;i<numBots;i++){
          const bc=CHARACTERS[(i+1)%CHARACTERS.length];
          players.push({id:`bot${i}`,name:['Eze','Yaa','Kwame','Fatima'][i]||`Bot${i}`,avatar:bc.icon,character:bc.key,hand:deal(handSize),xp:Math.floor(Math.random()*500),level:Math.floor(Math.random()*5)+1,solBalance:Math.random()*10,isBot:true,abilityUsed:false});
        }

        const nonSpecial=remaining.filter(c=>!c.special&&c.value!=='WHOT');
        const startCard=nonSpecial[0];
        remaining=remaining.filter(c=>c.id!==startCard.id);

        set({
          players,deck:remaining,pile:[startCard],topCard:startCard,
          currentSuit:startCard.suit,currentPlayerIndex:0,humanPlayerIndex:0,
          direction:1,pendingPick:0,winner:null,isGameStarted:true,
          gameMode:mode,multiMode:multiMode||null,screen:'board',
          selectedCardIds:[],lastPlayEvent:null,
          raidTimeLeft:isRaid?180:null,
        });

        // Start raid timer
        if(isRaid){
          const interval=setInterval(()=>{
            const s=get();
            if(s.winner||!s.raidTimeLeft){clearInterval(interval);return;}
            if(s.raidTimeLeft<=1){
              clearInterval(interval);
              // Player with fewest cards wins raid
              const fewest=s.players.reduce((a,b)=>a.hand.length<=b.hand.length?a:b);
              set({winner:fewest,raidTimeLeft:0});
              return;
            }
            set({raidTimeLeft:s.raidTimeLeft-1});
          },1000);
        }
      },

      selectCard:(cardId)=>{
        const{selectedCardIds,players,humanPlayerIndex,topCard,currentSuit}=get();
        const human=players[humanPlayerIndex];
        const card=human?.hand.find(c=>c.id===cardId);
        if(!card||!topCard)return;
        if(!canPlay(card,topCard,currentSuit)){set({notification:{message:"Can't play that! Match the suit or value.",type:'error'}});return;}
        if(selectedCardIds.includes(cardId)){set({selectedCardIds:selectedCardIds.filter(id=>id!==cardId)});}
        else{set({selectedCardIds:[cardId]});}
      },

      useAbility:()=>{
        const{players,humanPlayerIndex,currentPlayerIndex}=get();
        if(currentPlayerIndex!==humanPlayerIndex)return;
        const human=players[humanPlayerIndex];
        if(human.abilityUsed){set({notification:{message:'Ability already used!',type:'error'}});return;}
        const pc=players.map(p=>({...p,hand:[...p.hand]}));
        pc[humanPlayerIndex].abilityUsed=true;
        if(human.character==='zara'){set({players:pc,pendingPick:0,notification:{message:'Evasion! Pick penalty cancelled!',type:'success'}});}
        else if(human.character==='amara'){const{deck}=get();const t=deck.slice(0,3).map(c=>`${c.value} of ${c.suit}`).join(', ');set({players:pc,notification:{message:`Future Sight: ${t}`,type:'info'}});}
        else if(human.character==='nefertari'){set({players:pc,notification:{message:'Royal Decree! Choose a suit.',type:'info'}});}
        else{set({players:pc,notification:{message:`${CHARACTERS.find(c=>c.key===human.character)?.ability} activated!`,type:'success'}});}
      },

      playCard:(cardId)=>{
        const{players,humanPlayerIndex,currentPlayerIndex,pile,topCard,currentSuit,pendingPick,direction}=get();
        if(currentPlayerIndex!==humanPlayerIndex)return;
        const pc=players.map(p=>({...p,hand:[...p.hand]}));
        const human=pc[humanPlayerIndex];
        const ci=human.hand.findIndex(c=>c.id===cardId);
        if(ci===-1)return;
        const card=human.hand[ci];
        if(!topCard||!canPlay(card,topCard,currentSuit)){set({notification:{message:'Invalid play!',type:'error'}});return;}
        human.hand.splice(ci,1);
        let np=pendingPick;
        let ns:CardSuit|null=card.value!=='WHOT'?card.suit:currentSuit;
        if(card.special==='pick2')np+=2;if(card.special==='pick4')np+=4;if(card.special==='general_market')np+=1;
        const newPile=[...pile,card];
        const ev:CardPlayEvent={playerName:human.name,card,timestamp:Date.now()};
        if(human.hand.length===0){
          human.xp+=100;human.level=levelFromXp(human.xp);
          get().recordGameResult(true,6,parseFloat(get().stakeAmount)||0);
          set({players:pc,pile:newPile,topCard:card,currentSuit:ns,winner:human,selectedCardIds:[],pendingPick:0,lastPlayEvent:ev});
          return;
        }
        if(card.value==='WHOT'){set({players:pc,pile:newPile,topCard:card,currentSuit:ns,selectedCardIds:[],pendingPick:np,lastPlayEvent:ev,notification:{message:'WHOT! Choose a suit',type:'info'}});return;}
        let ni=((humanPlayerIndex+direction)+pc.length)%pc.length;
        if(card.special==='hold_on'||card.special==='suspension')ni=((ni+direction)+pc.length)%pc.length;
        set({players:pc,pile:newPile,topCard:card,currentSuit:ns,currentPlayerIndex:ni,pendingPick:np,selectedCardIds:[],lastPlayEvent:ev});
        if(ni!==humanPlayerIndex)setTimeout(()=>get().botTurn(),1200);
      },

      changeSuit:(suit)=>{
        const{direction,players,humanPlayerIndex}=get();
        const ni=((humanPlayerIndex+direction)+players.length)%players.length;
        set({currentSuit:suit,currentPlayerIndex:ni,notification:null});
        if(ni!==humanPlayerIndex)setTimeout(()=>get().botTurn(),1200);
      },

      drawCard:()=>{
        const{deck,players,humanPlayerIndex,currentPlayerIndex,direction,pendingPick}=get();
        if(currentPlayerIndex!==humanPlayerIndex)return;
        if(deck.length===0){set({notification:{message:'No cards left!',type:'error'}});return;}
        const count=pendingPick>0?pendingPick:1;
        const pc=players.map(p=>({...p,hand:[...p.hand]}));
        pc[humanPlayerIndex].hand.push(...deck.slice(0,count));
        const ni=((humanPlayerIndex+direction)+pc.length)%pc.length;
        set({players:pc,deck:deck.slice(count),pendingPick:0,currentPlayerIndex:ni,selectedCardIds:[]});
        if(ni!==humanPlayerIndex)setTimeout(()=>get().botTurn(),1200);
      },

      botTurn:()=>{
        const s=get();
        const{currentPlayerIndex:ci,humanPlayerIndex:hi,players}=s;
        if(ci===hi||!players[ci]||s.winner)return;
        const bot=players[ci];
        const playable=bot.hand.filter(c=>s.topCard&&canPlay(c,s.topCard,s.currentSuit));
        setTimeout(()=>{
          const ns=get();
          if(ns.winner||ns.currentPlayerIndex!==ci)return;
          const pc=ns.players.map(p=>({...p,hand:[...p.hand]}));
          const bc=pc[ci];
          let ni=((ci+ns.direction)+pc.length)%pc.length;
          if(playable.length>0&&ns.pendingPick===0){
            const card=playable.find(c=>c.special==='pick4')||playable.find(c=>c.special==='pick2')||playable.find(c=>c.value==='WHOT')||playable[Math.floor(Math.random()*playable.length)];
            const idx=bc.hand.findIndex(c=>c.id===card.id);
            bc.hand.splice(idx,1);
            let np=ns.pendingPick;
            let nsuit:CardSuit|null=card.value!=='WHOT'?card.suit:SUITS[Math.floor(Math.random()*SUITS.length)];
            if(card.special==='pick2')np+=2;if(card.special==='pick4')np+=4;
            if(card.special==='hold_on'||card.special==='suspension')ni=((ni+ns.direction)+pc.length)%pc.length;
            const ev:CardPlayEvent={playerName:bc.name,card,timestamp:Date.now()};
            if(bc.hand.length===0){set({players:pc,pile:[...ns.pile,card],topCard:card,currentSuit:nsuit,winner:bc,pendingPick:0,lastPlayEvent:ev});return;}
            set({players:pc,pile:[...ns.pile,card],topCard:card,currentSuit:nsuit,currentPlayerIndex:ni,pendingPick:np,lastPlayEvent:ev});
          }else{
            const count=ns.pendingPick>0?ns.pendingPick:1;
            if(ns.deck.length>0)bc.hand.push(...ns.deck.slice(0,count));
            set({players:pc,deck:ns.deck.slice(count),currentPlayerIndex:ni,pendingPick:0});
          }
          if(ni!==ns.humanPlayerIndex)setTimeout(()=>get().botTurn(),1000);
        },800+Math.random()*600);
      },

      generateInviteCode:(multiMode)=>{
        const{profile}=get();
        const code=generateCode();
        const host:LobbyPlayer={id:'human',name:profile?.name||'Host',character:profile?.character||'okonkwo',ready:true,isHost:true};
        set({inviteCode:code,multiMode,lobbyPlayers:[host],screen:'lobby'});
      },

      joinWithCode:(code)=>{
        const{profile}=get();
        set({
          inviteCode:code,
          lobbyPlayers:[
            {id:'human',name:profile?.name||'You',character:profile?.character||'okonkwo',ready:true,isHost:false},
          ],
          screen:'lobby',
          notification:{message:`Joined room ${code}!`,type:'success'}
        });
      },

      setLobbyReady:()=>{
        const{lobbyPlayers}=get();
        set({lobbyPlayers:lobbyPlayers.map(p=>p.id==='human'?{...p,ready:true}:p)});
      },

      connectWallet:(provider)=>{
        const addr='7xKp'+Math.random().toString(36).substr(2,8).toUpperCase()+'Dev1';
        set({
          wallet:{connected:true,address:addr,provider,balances:{SOL:parseFloat((Math.random()*10+2).toFixed(3)),USDC:parseFloat((Math.random()*500).toFixed(2)),BONK:Math.floor(Math.random()*10000000),JUP:parseFloat((Math.random()*200).toFixed(1)),WIF:parseFloat((Math.random()*50).toFixed(2))}},
          showWalletModal:false,
          notification:{message:`${provider} connected! (Devnet — use faucet.solana.com for free SOL)`,type:'success'}
        });
      },

      disconnectWallet:()=>{
        set({wallet:{connected:false,address:null,provider:null,balances:{SOL:0,USDC:0,BONK:0,JUP:0,WIF:0}}});
      },
    }),
    {
      name:'kingdomsol-profile',
      partialize:(s)=>({profile:s.profile,musicEnabled:s.musicEnabled,sfxEnabled:s.sfxEnabled,stakeToken:s.stakeToken,stakeAmount:s.stakeAmount}),
    }
  )
);

export{canPlay,SUITS,createDeck,levelFromXp,generateCode};

'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CardSuit = 'manilla' | 'amole' | 'spearhead' | 'bead' | 'cowrie';
export type CardValue = '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'11'|'12'|'13'|'14'|'WHOT';
export type GameMode = 'story' | 'multiplayer' | 'classic' | 'easy' | 'warrior';
export type MultiMode = 'war' | 'friendly' | 'raid';
export type Screen = 'loading' | 'name_setup' | 'menu' | 'board' | 'profile' | 'lobby' | 'tutorial' | 'leaderboard';
export type TokenSymbol = 'SOL' | 'USDC' | 'BONK' | 'JUP' | 'WIF' | 'KSL';

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
  kslBalance: number;       // KingdomSol tokens
  kslSpent: number;         // total KSL spent on games
  multiplayerGamesPlayed: number;
  avatarUrl: string | null;   // custom photo URL or null
  avatarSymbol: string;       // emoji symbol fallback
}

export interface PlayerStake {
  playerId: string;
  playerName: string;
  token: TokenSymbol;
  amount: string;
  confirmed: boolean;
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
  stake?: PlayerStake;
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
  playerId: string;   // who played this card
  card: Card;
  timestamp: number;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  character: CharacterKey;
  ready: boolean;
  isHost: boolean;
  stake?: PlayerStake;
}

export interface LeaderboardEntry {
  name: string;
  character: CharacterKey;
  xp: number;
  level: number;
  gamesWon: number;
  winStreak: number;
}

export interface GameState {
  screen: Screen;
  gameMode: GameMode | null;
  multiMode: MultiMode | null;
  profile: PlayerProfile | null;
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
  playerStakes: PlayerStake[];
  stakeToken: TokenSymbol;
  stakeAmount: string;
  selectedCardIds: string[];
  showWalletModal: boolean;
  notification: { message: string; type: 'info'|'success'|'error' } | null;
  lastPlayEvent: CardPlayEvent | null;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  inviteCode: string | null;
  lobbyPlayers: LobbyPlayer[];
  leaderboard: LeaderboardEntry[];
  wallet: {
    connected: boolean;
    address: string | null;
    provider: 'phantom'|'backpack'|'solflare' | null;
    balances: Record<string, number>;
    kslBalance: number;
  };

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
  setPlayerStake: (stake: PlayerStake) => void;
  confirmAllStakes: () => void;
  recordGameResult: (won: boolean, cardsPlayed: number) => void;
  topUpKSL: (usdcAmount: number) => void;
  withdrawKSL: (kslAmount: number) => void;
  connectWallet: (provider: 'phantom'|'backpack'|'solflare') => void;
  disconnectWallet: () => void;
  setStake: (token: TokenSymbol, amount: string) => void;
  toggleWalletModal: () => void;
  setNotification: (n: GameState['notification']) => void;
  generateInviteCode: (multiMode: MultiMode) => void;
  joinWithCode: (code: string) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  botTurn: () => void;
  updateLeaderboard: () => void;
  setAvatar: (avatarUrl: string | null, avatarSymbol?: string) => void;
}

export const CHARACTERS: Character[] = [
  { key:'okonkwo', name:'Okonkwo', title:'The Merchant King', origin:'Igbo, West Africa', ability:'Trade Mastery', abilityDesc:'Play any 2 cards of the same value at once (once per game)', color:'#8B4513', accentColor:'#E8B84B', icon:'👑' },
  { key:'amara', name:'Amara', title:'The Oracle Queen', origin:'Mali Empire', ability:'Future Sight', abilityDesc:'Peek at the top 3 cards of the deck (once per game)', color:'#2D1B69', accentColor:'#9945FF', icon:'🔮' },
  { key:'zara', name:'Zara', title:'The Desert Fox', origin:'Carthage, North Africa', ability:'Evasion', abilityDesc:'Cancel one Pick-2 or Pick-4 directed at you (once per game)', color:'#C1440E', accentColor:'#FF6FD8', icon:'🦊' },
  { key:'kofi', name:'Kofi', title:'The Gold Coast Lord', origin:'Ashanti Kingdom', ability:'Golden Touch', abilityDesc:'Win double KSL when going out with a SOL CARD (once per game)', color:'#006600', accentColor:'#14F195', icon:'✨' },
  { key:'nefertari', name:'Nefertari', title:"The Pharaoh's Heir", origin:'Ancient Egypt', ability:'Royal Decree', abilityDesc:'Change the active suit without a SOL CARD (once per game)', color:'#1B3A2D', accentColor:'#00C2FF', icon:'🌟' },
];

export const SUIT_COLORS: Record<CardSuit, string> = {
  manilla:'#E8B84B', amole:'#14F195', spearhead:'#FF6FD8', bead:'#00C2FF', cowrie:'#9945FF'
};

// KSL token economics
export const KSL_PER_USDC = 100; // $1 = 100 KSL
export const KSL_PER_MULTIPLAYER_GAME = 25;
export const KSL_STARTING_BALANCE = 100;
export const KSL_USDC_RATE = 0.01; // 1 KSL = $0.01 USDC

const SUITS: CardSuit[] = ['manilla','amole','spearhead','bead','cowrie'];

function shuffle<T>(arr: T[]): T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function createDeck(): Card[] {
  const deck:Card[]=[];let id=0;
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

// Broadcasts current game state to Supabase for multiplayer sync
async function broadcastIfMultiplayer(get: () => GameState) {
  const s = get();
  if (s.gameMode !== 'multiplayer' || !s.inviteCode) return;
  try {
    const { broadcastGameState } = await import('@/lib/supabase');
    await broadcastGameState(s.inviteCode, {
      pile: s.pile,
      topCard: s.topCard,
      currentSuit: s.currentSuit || s.topCard?.suit || 'cowrie',
      currentPlayerIndex: s.currentPlayerIndex,
      direction: s.direction,
      pendingPick: s.pendingPick,
      winner: s.winner?.id || null,
      hands: Object.fromEntries(s.players.map(p => [p.id, p.hand])),
      playerOrder: s.players.map(p => p.id),
      playerNames: Object.fromEntries(s.players.map(p => [p.id, p.name])),
      deck: s.deck,
      multiMode: s.multiMode || 'war',
      stakeToken: s.stakeToken,
      stakeAmount: s.stakeAmount,
      lastPlayerId: s.lastPlayEvent?.playerId,
    });
  } catch {}
}

export const useGameStore = create<GameState>()(
  persist(
    (set,get)=>({
      screen:'loading', gameMode:null, multiMode:null, profile:null,
      players:[], currentPlayerIndex:0, humanPlayerIndex:0,
      deck:[], pile:[], topCard:null, currentSuit:null,
      pendingPick:0, direction:1, isGameStarted:false, winner:null, raidTimeLeft:null,
      playerStakes:[], stakeToken:'KSL', stakeAmount:'0',
      selectedCardIds:[], showWalletModal:false, notification:null, lastPlayEvent:null,
      musicEnabled:true, sfxEnabled:true,
      inviteCode:null, lobbyPlayers:[],
      leaderboard:[],
      wallet:{connected:false,address:null,provider:null,balances:{SOL:0,USDC:0,BONK:0,JUP:0,WIF:0},kslBalance:0},

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
          solEarned:0,cardsPlayed:0,winStreak:0,bestStreak:0,
          createdAt:Date.now(),kslBalance:KSL_STARTING_BALANCE,
          kslSpent:0,multiplayerGamesPlayed:0,
          avatarUrl:null,avatarSymbol:'👑'
        };
        set({profile,screen:'menu'});
      },

      topUpKSL:(usdcAmount)=>{
        const{profile,wallet}=get();
        if(!profile)return;
        const kslGained=usdcAmount*KSL_PER_USDC;
        const newUSDC=(wallet.balances.USDC||0)-usdcAmount;
        if(newUSDC<0){set({notification:{message:'Insufficient USDC balance',type:'error'}});return;}
        set({
          profile:{...profile,kslBalance:profile.kslBalance+kslGained},
          wallet:{...wallet,balances:{...wallet.balances,USDC:parseFloat(newUSDC.toFixed(2))},kslBalance:wallet.kslBalance+kslGained},
          notification:{message:`Topped up ${kslGained} KSL tokens!`,type:'success'}
        });
      },

      withdrawKSL:(kslAmount)=>{
        const{profile,wallet}=get();
        if(!profile)return;
        if(profile.kslBalance<kslAmount){set({notification:{message:'Insufficient KSL balance',type:'error'}});return;}
        const usdcEquiv=kslAmount*KSL_USDC_RATE;
        set({
          profile:{...profile,kslBalance:profile.kslBalance-kslAmount},
          wallet:{...wallet,balances:{...wallet.balances,USDC:parseFloat(((wallet.balances.USDC||0)+usdcEquiv).toFixed(2))},kslBalance:wallet.kslBalance-kslAmount},
          notification:{message:`Withdrew ${kslAmount} KSL = $${usdcEquiv.toFixed(2)} USDC`,type:'success'}
        });
      },

      setPlayerStake:(stake)=>{
        const{playerStakes}=get();
        const existing=playerStakes.findIndex(s=>s.playerId===stake.playerId);
        if(existing>=0){
          const updated=[...playerStakes];updated[existing]=stake;
          set({playerStakes:updated});
        }else{
          set({playerStakes:[...playerStakes,stake]});
        }
      },

      confirmAllStakes:()=>{
        set(s=>({playerStakes:s.playerStakes.map(st=>({...st,confirmed:true}))}));
      },

      recordGameResult:(won,cardsPlayed)=>{
        const{profile,gameMode,playerStakes,humanPlayerIndex,players,wallet}=get();
        if(!profile)return;
        const xpGain=won?100+cardsPlayed*3:20+cardsPlayed;
        const newXp=profile.xp+xpGain;
        const newLevel=levelFromXp(newXp);
        const newStreak=won?profile.winStreak+1:0;
        const myStake=playerStakes.find(s=>s.playerId==='human');
        const stakeAmt=parseFloat(myStake?.amount||'0');

        let kslChange=0;
        if(gameMode!=='multiplayer'){
          if(!won&&stakeAmt>0&&myStake?.token==='KSL'){kslChange=-stakeAmt;}
        }

        const updatedProfile={
          ...profile,
          gamesPlayed:profile.gamesPlayed+1,
          gamesWon:profile.gamesWon+(won?1:0),
          xp:newXp,level:newLevel,
          cardsPlayed:profile.cardsPlayed+cardsPlayed,
          winStreak:newStreak,
          bestStreak:Math.max(profile.bestStreak,newStreak),
          kslBalance:Math.max(0,profile.kslBalance+kslChange),
          multiplayerGamesPlayed:profile.multiplayerGamesPlayed+(gameMode==='multiplayer'?1:0),
        };

        set({profile:updatedProfile});
        get().updateLeaderboard();

        // Sync to Supabase global leaderboard
        import('@/lib/supabase').then(({upsertPlayerStats,getPlayerId})=>{
          const pid=getPlayerId();
          upsertPlayerStats({
            player_id:pid,
            player_name:profile.name,
            character_key:profile.character,
            avatar_symbol:profile.avatarSymbol||'👑',
            xp:newXp,
            level:newLevel,
            games_played:updatedProfile.gamesPlayed,
            games_won:updatedProfile.gamesWon,
            games_lost:updatedProfile.gamesPlayed-updatedProfile.gamesWon,
            win_streak:newStreak,
            best_streak:updatedProfile.bestStreak,
            cards_played:updatedProfile.cardsPlayed,
            multiplayer_wins:gameMode==='multiplayer'&&won?updatedProfile.multiplayerGamesPlayed:0,
            solo_wins:gameMode!=='multiplayer'&&won?updatedProfile.gamesWon:0,
            wallet_address:wallet?.address||undefined,
          });
        }).catch(()=>{});
      },

      setAvatar:(avatarUrl, avatarSymbol)=>{
        const{profile}=get();
        if(!profile)return;
        set({profile:{...profile,avatarUrl:avatarUrl||null,avatarSymbol:avatarSymbol||profile.avatarSymbol}});
      },

      updateLeaderboard:()=>{
        const{profile,leaderboard}=get();
        if(!profile)return;
        const entry:LeaderboardEntry={
          name:profile.name,character:profile.character,
          xp:profile.xp,level:levelFromXp(profile.xp),
          gamesWon:profile.gamesWon,winStreak:profile.bestStreak
        };
        const existing=leaderboard.findIndex(e=>e.name===profile.name);
        let updated=[...leaderboard];
        if(existing>=0)updated[existing]=entry;
        else updated.push(entry);
        updated.sort((a,b)=>b.xp-a.xp);
        set({leaderboard:updated.slice(0,20)});
      },

      initGame:(mode,multiMode)=>{
        const{profile,playerStakes,stakeAmount,stakeToken}=get();
        const charKey=profile?.character||'okonkwo';
        const char=CHARACTERS.find(c=>c.key===charKey)||CHARACTERS[0];
        const deck=createDeck();
        const isRaid=multiMode==='raid';
        // Easy: 1 weak bot, Warrior: 3 strong bots, Classic: 3 normal bots
        const isEasy=mode==='easy';
        const isWarrior=mode==='warrior';
        const handSize=isRaid?3:isEasy?8:6; // easy gives player more cards
        const numBots=mode==='multiplayer'?0:isEasy?1:mode==='classic'||isWarrior?3:1;
        const players:Player[]=[];
        let remaining=deck;
        const deal=(n:number)=>{const h=remaining.slice(0,n);remaining=remaining.slice(n);return h;};

        // Player's stake
        const playerStake:PlayerStake={playerId:'human',playerName:profile?.name||char.name,token:stakeToken,amount:stakeAmount,confirmed:true};

        players.push({
          id:'human',name:profile?.name||char.name,avatar:char.icon,
          character:charKey,hand:deal(handSize),xp:profile?.xp||0,
          level:profile?.level||1,solBalance:4.2,isBot:false,abilityUsed:false,
          stake:playerStake,
        });

        for(let i=0;i<numBots;i++){
          const bc=CHARACTERS[(i+1)%CHARACTERS.length];
          // Bot matches player's stake
          const botStake:PlayerStake={playerId:`bot${i}`,playerName:bc.name,token:stakeToken,amount:stakeAmount,confirmed:true};
          const botLevel = isWarrior ? Math.floor(Math.random()*3)+8 : isEasy ? 1 : Math.floor(Math.random()*5)+1;
          const botXp = botLevel * botLevel * 100;
          // Warrior bots get fewer starting cards (harder for player)
          const botHandSize = isWarrior ? handSize : handSize;
          players.push({id:`bot${i}`,name:isWarrior?['Pharaoh Eze','War Queen Yaa','Iron Kwame','Shadow Fatima'][i]||`Warrior Bot${i}`:['Eze','Yaa','Kwame','Fatima'][i]||`Bot${i}`,avatar:bc.icon,character:bc.key,hand:deal(handSize),xp:botXp,level:botLevel,solBalance:Math.random()*10,isBot:true,abilityUsed:false,stake:botStake});
        }

        const nonSpecial=remaining.filter(c=>!c.special&&c.value!=='WHOT');
        const startCard=nonSpecial[0];
        remaining=remaining.filter(c=>c.id!==startCard.id);

        // Deduct KSL for multiplayer game
        const{profile:p}=get();
        if(mode==='multiplayer'&&p){
          set({profile:{...p,kslBalance:Math.max(0,p.kslBalance-KSL_PER_MULTIPLAYER_GAME),kslSpent:p.kslSpent+KSL_PER_MULTIPLAYER_GAME}});
        }

        set({
          players,deck:remaining,pile:[startCard],topCard:startCard,
          currentSuit:startCard.suit,currentPlayerIndex:0,humanPlayerIndex:0,
          direction:1,pendingPick:0,winner:null,isGameStarted:true,
          gameMode:mode,multiMode:multiMode||null,screen:'board',
          selectedCardIds:[],lastPlayEvent:null,
          playerStakes:[playerStake],
          raidTimeLeft:isRaid?180:null,
        });

        if(isRaid){
          const interval=setInterval(()=>{
            const s=get();
            if(s.winner||!s.raidTimeLeft){clearInterval(interval);return;}
            if(s.raidTimeLeft<=1){clearInterval(interval);const fewest=s.players.reduce((a,b)=>a.hand.length<=b.hand.length?a:b);set({winner:fewest,raidTimeLeft:0});return;}
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
        if(human.character==='zara'){
          if(get().pendingPick===0){set({notification:{message:'No pick penalty to cancel right now!',type:'error'}});pc[humanPlayerIndex].abilityUsed=false;return;}
          set({players:pc,pendingPick:0,notification:{message:'Evasion activated! Pick penalty cancelled!',type:'success'}});
        }
        else if(human.character==='amara'){const{deck}=get();const t=deck.slice(0,3).map(c=>`${c.value} of ${c.suit}`).join(', ');set({players:pc,notification:{message:`Future Sight: ${t}`,type:'info'}});}
        else if(human.character==='nefertari'){
          // Trigger suit selector without playing a card
          set({players:pc,notification:{message:'Royal Decree! Choose a suit to change.',type:'info'},showWalletModal:false});
          // Show suit selector by triggering WHOT notification pattern
          setTimeout(()=>set({notification:{message:'SOL CARD! Choose a suit',type:'info'}}),100);
        }
        else if(human.character==='kofi'){
          set({players:pc,notification:{message:'Golden Touch activated! Win with SOL CARD for double KSL!',type:'success'}});
        }
        else if(human.character==='okonkwo'){
          // Trade Mastery: allow playing 2 cards of same value - just notify
          set({players:pc,notification:{message:'Trade Mastery ready! Select 2 cards of same value to play both.',type:'info'}});
        }
        else{set({players:pc,notification:{message:`${CHARACTERS.find(c=>c.key===human.character)?.ability} activated!`,type:'success'}});}
      },

      playCard:(cardId)=>{
        const{players,humanPlayerIndex,currentPlayerIndex,pile,topCard,currentSuit,pendingPick,direction,gameMode}=get();
        if(currentPlayerIndex!==humanPlayerIndex)return;
        // In multiplayer: extra guard - check it's actually our turn in the shared order
        if(gameMode==='multiplayer'){
          const myPlayer=players[humanPlayerIndex];
          const currentPlayer=players[currentPlayerIndex];
          if(!myPlayer||!currentPlayer||myPlayer.id!==currentPlayer.id)return;
        }
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
        const myId=typeof window!=='undefined'?localStorage.getItem('kingdomsol-pid')||'human':'human';
        const ev:CardPlayEvent={playerName:human.name,playerId:myId,card,timestamp:Date.now()};
        if(human.hand.length===0){
          human.xp+=100;human.level=levelFromXp(human.xp);
          get().recordGameResult(true,6);
          set({players:pc,pile:newPile,topCard:card,currentSuit:ns,winner:human,selectedCardIds:[],pendingPick:0,lastPlayEvent:ev});
          // Multiplayer: immediately broadcast win to all players
          if(get().gameMode==='multiplayer') setTimeout(()=>broadcastIfMultiplayer(get),50);
          return;
        }
        if(card.value==='WHOT'){set({players:pc,pile:newPile,topCard:card,currentSuit:ns,selectedCardIds:[],pendingPick:np,lastPlayEvent:ev,notification:{message:'SOL CARD! Choose a suit',type:'info'}});return;}
        let ni=((humanPlayerIndex+direction)+pc.length)%pc.length;
        if(card.special==='hold_on'||card.special==='suspension')ni=((ni+direction)+pc.length)%pc.length;
        set({players:pc,pile:newPile,topCard:card,currentSuit:ns,currentPlayerIndex:ni,pendingPick:np,selectedCardIds:[],lastPlayEvent:ev});
        if(ni!==humanPlayerIndex&&get().gameMode!=='multiplayer')setTimeout(()=>get().botTurn(),1200);
        else if(get().gameMode==='multiplayer') setTimeout(()=>broadcastIfMultiplayer(get),100);
      },

      changeSuit:(suit)=>{
        const{direction,players,humanPlayerIndex,gameMode}=get();
        const ni=((humanPlayerIndex+direction)+players.length)%players.length;
        set({currentSuit:suit,currentPlayerIndex:ni,notification:null});
        if(gameMode==='multiplayer'){
          // In multiplayer: broadcast new state to all players
          setTimeout(()=>broadcastIfMultiplayer(get),100);
        } else if(ni!==humanPlayerIndex){
          setTimeout(()=>get().botTurn(),1200);
        }
      },

      drawCard:()=>{
        const{deck,players,humanPlayerIndex,currentPlayerIndex,direction,pendingPick,gameMode}=get();
        if(currentPlayerIndex!==humanPlayerIndex)return;
        // Multiplayer strict guard
        if(gameMode==='multiplayer'){
          const myPlayer=players[humanPlayerIndex];
          const currentPlayer=players[currentPlayerIndex];
          if(!myPlayer||!currentPlayer||myPlayer.id!==currentPlayer.id)return;
        }
        // Auto-reshuffle: if deck is empty, create a fresh shuffled deck from played pile (keep top card)
        let activeDeck = deck;
        if (activeDeck.length < 2) {
          const {pile} = get();
          const topCard = pile[pile.length - 1];
          const reshuffled = createDeck();
          activeDeck = reshuffled;
          set({ pile: topCard ? [topCard] : [], deck: reshuffled, notification: { message: '🔀 Deck reshuffled!', type: 'info' } });
        }
        const count=pendingPick>0?pendingPick:1;
        const pc=players.map(p=>({...p,hand:[...p.hand]}));
        pc[humanPlayerIndex].hand.push(...activeDeck.slice(0,count));
        const ni=((humanPlayerIndex+direction)+pc.length)%pc.length;
        set({players:pc,deck:activeDeck.slice(count),pendingPick:0,currentPlayerIndex:ni,selectedCardIds:[]});
        if(ni!==humanPlayerIndex&&get().gameMode!=='multiplayer')setTimeout(()=>get().botTurn(),1200);
        else if(get().gameMode==='multiplayer') setTimeout(()=>broadcastIfMultiplayer(get),100);
      },

      botTurn:()=>{
        const s=get();
        const{currentPlayerIndex:ci,humanPlayerIndex:hi,players}=s;
        if(ci===hi||!players[ci]||s.winner||s.gameMode==='multiplayer')return;
        const bot=players[ci];
        const playable=bot.hand.filter(c=>s.topCard&&canPlay(c,s.topCard,s.currentSuit));
        const isEasyBot=s.gameMode==='easy';
        const isWarriorBot=s.gameMode==='warrior';
        // Easy: bot draws 30% of the time even when it can play, slower thinking
        const botDelay=isEasyBot?1800+Math.random()*1200:isWarriorBot?400+Math.random()*300:800+Math.random()*600;
        setTimeout(()=>{
          const ns=get();
          if(ns.winner||ns.currentPlayerIndex!==ci||ns.gameMode==='multiplayer')return;
          const pc=ns.players.map(p=>({...p,hand:[...p.hand]}));
          const bc=pc[ci];
          let ni=((ci+ns.direction)+pc.length)%pc.length;
          // Easy bot: 30% chance to draw even if it can play (makes mistakes)
          const easyMistake=isEasyBot&&Math.random()<0.30;
          if(playable.length>0&&ns.pendingPick===0&&!easyMistake){
            // Easy: picks worst card (regular, no specials). Warrior: picks best card (pick4 > pick2 > WHOT > regular)
            const card=isEasyBot
              ? playable.find(c=>!c.special&&c.value!=='WHOT')||playable[playable.length-1]  // Easy: play weakest
              : playable.find(c=>c.special==='pick4')||playable.find(c=>c.special==='pick2')||playable.find(c=>c.value==='WHOT')||playable[Math.floor(Math.random()*playable.length)]; // Warrior: play strongest
            const idx=bc.hand.findIndex(c=>c.id===card.id);
            bc.hand.splice(idx,1);
            let np=ns.pendingPick;
            let nsuit:CardSuit|null=card.value!=='WHOT'?card.suit:SUITS[Math.floor(Math.random()*SUITS.length)];
            if(card.special==='pick2')np+=2;if(card.special==='pick4')np+=4;
            if(card.special==='hold_on'||card.special==='suspension')ni=((ni+ns.direction)+pc.length)%pc.length;
            const ev:CardPlayEvent={playerName:bc.name,playerId:bc.id,card,timestamp:Date.now()};
            if(bc.hand.length===0){
              get().recordGameResult(false,6);
              set({players:pc,pile:[...ns.pile,card],topCard:card,currentSuit:nsuit,winner:bc,pendingPick:0,lastPlayEvent:ev});
              if(get().gameMode==='multiplayer') setTimeout(()=>broadcastIfMultiplayer(get),50);
              return;
            }
            set({players:pc,pile:[...ns.pile,card],topCard:card,currentSuit:nsuit,currentPlayerIndex:ni,pendingPick:np,lastPlayEvent:ev});
          }else{
            const count=ns.pendingPick>0?ns.pendingPick:1;
            let botDeck = ns.deck;
            if (botDeck.length < 2) {
              botDeck = createDeck();
              set({ pile: ns.pile.slice(-1), notification: { message: '🔀 Deck reshuffled!', type: 'info' } });
            }
            bc.hand.push(...botDeck.slice(0,count));
            set({players:pc,deck:botDeck.slice(count),currentPlayerIndex:ni,pendingPick:0});
          }
          if(ni!==ns.humanPlayerIndex&&get().gameMode!=='multiplayer')setTimeout(()=>get().botTurn(),isEasyBot?1600:isWarriorBot?350:1000);
        },botDelay);
      },

      generateInviteCode:(multiMode)=>{
        const{profile}=get();
        const code=generateCode();
        const host:LobbyPlayer={id:'human',name:profile?.name||'Host',character:profile?.character||'okonkwo',ready:true,isHost:true};
        set({inviteCode:code,multiMode,lobbyPlayers:[host],screen:'lobby',gameMode:'multiplayer'});
      },

      joinWithCode:(code)=>{
        const{profile}=get();
        set({
          inviteCode:code.toUpperCase(),
          lobbyPlayers:[{id:'human',name:profile?.name||'You',character:profile?.character||'okonkwo',ready:true,isHost:false}],
          screen:'lobby',gameMode:'multiplayer',
          notification:{message:`Joining room ${code.toUpperCase()}...`,type:'info'}
        });
      },

      connectWallet:(provider)=>{
        const storageKey=`kingdomsol-wallet-${provider}`;
        let addr=typeof window!=='undefined'?localStorage.getItem(storageKey):null;
        if(!addr){
          const base58chars='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
          const prefix=provider==='phantom'?'Ph':provider==='backpack'?'Bp':'Sf';
          addr=prefix+Array.from({length:42},()=>base58chars[Math.floor(Math.random()*base58chars.length)]).join('');
          if(typeof window!=='undefined')localStorage.setItem(storageKey,addr);
        }
        const balanceKey=`kingdomsol-balances-${addr}`;
        let balances:any=null;
        try{const stored=typeof window!=='undefined'?localStorage.getItem(balanceKey):null;if(stored)balances=JSON.parse(stored);}catch{}
        if(!balances){
          balances={SOL:parseFloat((Math.random()*8+2).toFixed(3)),USDC:parseFloat((Math.random()*400+50).toFixed(2)),BONK:Math.floor(Math.random()*8000000+500000),JUP:parseFloat((Math.random()*150+20).toFixed(1)),WIF:parseFloat((Math.random()*40+5).toFixed(2))};
          if(typeof window!=='undefined')localStorage.setItem(balanceKey,JSON.stringify(balances));
        }
        const{profile}=get();
        const kslBal=profile?.kslBalance||KSL_STARTING_BALANCE;
        set({
          wallet:{connected:true,address:addr,provider,balances,kslBalance:kslBal},
          showWalletModal:false,
          notification:{message:`${provider.charAt(0).toUpperCase()+provider.slice(1)} connected! (Devnet)`,type:'success'}
        });
      },

      disconnectWallet:()=>{
        set({wallet:{connected:false,address:null,provider:null,balances:{SOL:0,USDC:0,BONK:0,JUP:0,WIF:0},kslBalance:0}});
      },
    }),
    {
      name:'kingdomsol-v7',
      partialize:(s)=>({
        profile:s.profile,musicEnabled:s.musicEnabled,sfxEnabled:s.sfxEnabled,
        stakeToken:s.stakeToken,stakeAmount:s.stakeAmount,leaderboard:s.leaderboard
      }),
    }
  )
);

export{canPlay,SUITS,createDeck,levelFromXp,generateCode};

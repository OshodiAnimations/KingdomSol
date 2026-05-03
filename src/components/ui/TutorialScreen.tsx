'use client';
import { useState, useEffect } from 'react';
import { useGameStore, CHARACTERS, SUIT_COLORS, CardSuit } from '@/lib/store';
import { GameCard } from '@/components/cards/GameCard';

// ── Tutorial Steps ────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to KingdomSol! 👑',
    text: 'You are a time traveller stranded in 2030. Your mission: master the ancient card game and earn enough Solana to power your time machine home.\n\nLet\'s learn how to play. Tap NEXT to continue.',
    highlight: null,
    action: null,
  },
  {
    id: 'suits',
    title: 'The 5 Ancient Suits',
    text: 'KingdomSol uses 5 suits based on ancient African trade currencies. Each card belongs to one suit:\n\n🟡 Manilla — iron rings\n🟢 Amole — salt bars\n🩷 Spearhead — iron spear tips\n🔵 Bead — trade beads\n🟣 Cowrie — cowrie shells',
    highlight: 'suits',
    action: null,
  },
  {
    id: 'goal',
    title: 'How to Win',
    text: 'Your goal is simple: be the FIRST player to play all the cards in your hand.\n\nEach turn, you must play a card that matches either the SUIT or the VALUE of the top card on the pile.\n\nIf you can\'t play, draw a card from the deck.',
    highlight: 'pile',
    action: null,
  },
  {
    id: 'match-suit',
    title: 'Matching by Suit',
    text: 'The top card shows a MANILLA 7. You can play ANY Manilla card on top of it — even if the number is different.\n\nTap the Manilla card in your hand to play it!',
    highlight: 'hand',
    action: 'play-suit',
    correctCardSuit: 'manilla',
  },
  {
    id: 'match-value',
    title: 'Matching by Value',
    text: 'Now the top card is a BEAD 5. You can also match by VALUE — play any card with a 5 on it, no matter the suit!\n\nTap the card with the same number.',
    highlight: 'hand',
    action: 'play-value',
    correctCardValue: '5',
  },
  {
    id: 'special-pick2',
    title: '⚡ Special Card: Pick Two',
    text: 'The 2 card (AMOLE 2) is special — when you play it, the next player must DRAW 2 cards!\n\nThis is a powerful attack card. Use it wisely.',
    highlight: 'special',
    action: null,
    demoCard: { suit: 'amole', value: '2', special: 'pick2' },
  },
  {
    id: 'special-pick3',
    title: '⚡ Special Card: Pick Three',
    text: 'The 5 card (SPEARHEAD 5) forces the next player to draw 3 cards!\n\nIf someone plays Pick Two at you, you can counter with Pick Two or Pick Three of your own — playing the same card cancels the penalty!',
    highlight: 'special',
    action: null,
    demoCard: { suit: 'spearhead', value: '5', special: 'pick3' },
  },
  {
    id: 'special-market',
    title: '⚡ Special Card: General Market',
    text: 'The 14 card (BEAD 14) triggers General Market — EVERYONE at the table draws a card except you!\n\nBest played when you\'re winning and want to slow everyone down.',
    highlight: 'special',
    action: null,
    demoCard: { suit: 'bead', value: '14', special: 'general_market' },
  },
  {
    id: 'special-holdon',
    title: '⚡ Special Card: Hold On',
    text: 'The Ace card (MANILLA 1) says "Hold On" — the next player loses their turn entirely!\n\nPerfect for disrupting an opponent who is about to win.',
    highlight: 'special',
    action: null,
    demoCard: { suit: 'manilla', value: '1', special: 'hold_on' },
  },
  {
    id: 'special-suspension',
    title: '⚡ Special Card: Suspension',
    text: 'COWRIE 8 suspends the next player — they skip their turn.\n\nSimilar to Hold On but can be chained differently in a multi-player game.',
    highlight: 'special',
    action: null,
    demoCard: { suit: 'cowrie', value: '8', special: 'suspension' },
  },
  {
    id: 'sol-card',
    title: '✨ The SOL CARD (Wild)',
    text: 'The SOL CARD is the most powerful card in the deck — it\'s a WILD card.\n\nYou can play it at ANY time, on ANY card. After playing it, you choose what suit the next player must match.\n\nUse it when you\'re stuck or to control the game!',
    highlight: 'sol-card',
    action: null,
    demoCard: { suit: 'cowrie', value: 'WHOT' },
  },
  {
    id: 'draw',
    title: 'Drawing a Card',
    text: 'If you have NO cards that match the top card, tap the DECK to draw a card.\n\nYou must draw — you cannot pass your turn without drawing or playing.\n\nIf you draw a penalty (Pick 2/4), you must draw all the cards.',
    highlight: 'deck',
    action: 'draw',
  },
  {
    id: 'characters',
    title: '🦸 Choose Your Character',
    text: 'Each character has a unique ABILITY you can use ONCE per game:\n\n👑 Okonkwo — play 2 same-value cards at once\n🔮 Amara — peek at the top 3 deck cards\n🦊 Zara — cancel a Pick 2 or Pick 3 aimed at you\n✨ Kofi — double KSL reward when winning with SOL CARD\n🌟 Nefertari — change the suit without playing SOL CARD',
    highlight: 'character',
    action: null,
  },
  {
    id: 'staking',
    title: '💰 Staking & Earning',
    text: 'You can stake KSL tokens, SOL, or USDC on each game.\n\nIf you WIN, you get the entire pot (minus 0.5% treasury fee).\nIf you LOSE, you forfeit your stake.\n\nNew players get 100 KSL free to start. Play for free by staking 0.',
    highlight: null,
    action: null,
  },
  {
    id: 'multiplayer',
    title: '⚔️ Multiplayer Mode',
    text: 'In Multiplayer War (2-6 players):\n\n• Create a room and share your 6-character code\n• Each player joins with the code\n• Set your stake when 2+ players are present\n• Take turns in join order — no skipping!\n• First to empty their hand wins the pot',
    highlight: null,
    action: null,
  },
  {
    id: 'ready',
    title: 'You\'re Ready to Play! 🎴',
    text: 'You now know everything you need to play KingdomSol!\n\nStart with EASY MODE to practice against a slow bot.\nWhen you\'re confident, try CLASSIC MODE (3 bots) or go online in MULTIPLAYER.\n\nGood luck, time traveller. Reclaim your wealth!',
    highlight: null,
    action: 'finish',
  },
];

const DEMO_SUITS: { suit: CardSuit; label: string; icon: string }[] = [
  { suit: 'manilla', label: 'Manilla', icon: '🟡' },
  { suit: 'amole', label: 'Amole', icon: '🟢' },
  { suit: 'spearhead', label: 'Spearhead', icon: '🩷' },
  { suit: 'bead', label: 'Bead', icon: '🔵' },
  { suit: 'cowrie', label: 'Cowrie', icon: '🟣' },
];

export function TutorialScreen() {
  const { setScreen, createProfile, profile } = useGameStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [tapped, setTapped] = useState(false);
  const [showCharDetail, setShowCharDetail] = useState(0);

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const next = () => {
    setTapped(false);
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else setScreen('menu');
  };
  const prev = () => { setTapped(false); if (stepIdx > 0) setStepIdx(stepIdx - 1); };

  const char = CHARACTERS[showCharDetail];

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 30% 10%, #2C1A08 0%, #1A1410 40%, #0D0A08 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', position:'relative', overflow:'hidden' }}>
      <div className="pattern-kente" style={{ position:'absolute', inset:0, opacity:0.2, pointerEvents:'none' }} />

      {/* Progress bar */}
      <div style={{ position:'fixed', top:0, left:0, right:0, height:4, background:'rgba(255,255,255,0.05)', zIndex:100 }}>
        <div style={{ height:'100%', background:`linear-gradient(90deg, #E8B84B, #9945FF)`, width:`${progress}%`, transition:'width 0.4s ease' }} />
      </div>

      {/* Step counter */}
      <div style={{ position:'fixed', top:12, right:16, fontFamily:'var(--font-display)', fontSize:11, fontWeight:900, color:'rgba(245,230,200,0.4)', letterSpacing:'0.1em', zIndex:100 }}>
        {stepIdx + 1} / {STEPS.length}
      </div>

      {/* Skip */}
      <div style={{ position:'fixed', top:12, left:16, zIndex:100 }}>
        <button onClick={() => setScreen('menu')} style={{ background:'transparent', border:'1px solid rgba(232,184,75,0.2)', color:'rgba(245,230,200,0.4)', padding:'5px 12px', borderRadius:6, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, letterSpacing:'0.08em' }}>SKIP TUTORIAL</button>
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:520, width:'100%' }}>

        {/* ── VISUAL DEMO AREA ── */}
        <div style={{ marginBottom:24, minHeight:180, display:'flex', alignItems:'center', justifyContent:'center' }}>

          {/* Suits display */}
          {step.highlight === 'suits' && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              {DEMO_SUITS.map(({ suit, label, icon }) => (
                <div key={suit} style={{ padding:'12px 16px', borderRadius:12, background:`${SUIT_COLORS[suit]}15`, border:`2px solid ${SUIT_COLORS[suit]}55`, textAlign:'center', minWidth:90 }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:900, color:SUIT_COLORS[suit], letterSpacing:'0.06em' }}>{label}</div>
                  <GameCard card={{ id:`demo-${suit}`, suit, value:'7' }} size="sm" />
                </div>
              ))}
            </div>
          )}

          {/* Pile demo */}
          {step.highlight === 'pile' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.5)', letterSpacing:'0.15em', marginBottom:4 }}>TOP CARD (PILE)</div>
              <GameCard card={{ id:'demo-top', suit:'manilla', value:'7' }} size="lg" />
              <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.5)', textAlign:'center' }}>
                Play any <strong style={{ color:SUIT_COLORS.manilla }}>Manilla</strong> card<br/>OR any <strong style={{ color:'#E8B84B' }}>7</strong> of any suit
              </div>
            </div>
          )}

          {/* Hand demo - match suit */}
          {step.action === 'play-suit' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em' }}>TOP CARD:</div>
                <GameCard card={{ id:'top', suit:'manilla', value:'7' }} size="sm" />
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em', marginBottom:4 }}>YOUR HAND — tap the matching card:</div>
              <div style={{ display:'flex', gap:8 }}>
                {([
                  { id:'c1', suit:'bead' as CardSuit, value:'3' as const },
                  { id:'c2', suit:'manilla' as CardSuit, value:'9' as const },
                  { id:'c3', suit:'cowrie' as CardSuit, value:'11' as const },
                ] as any[]).map((card: any) => (
                  <div key={card.id} onClick={() => { if(card.suit==='manilla') setTapped(true); }}
                    style={{ cursor:'pointer', transform: tapped && card.suit==='manilla' ? 'translateY(-12px) scale(1.05)' : '', transition:'transform 0.2s' }}>
                    <GameCard card={card} size="md" isPlayable={card.suit==='manilla'} isSelected={tapped && card.suit==='manilla'} />
                  </div>
                ))}
              </div>
              {tapped && <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#14F195', letterSpacing:'0.08em', animation:'toast-in 0.3s ease-out' }}>✓ Correct! Same suit matches!</div>}
            </div>
          )}

          {/* Hand demo - match value */}
          {step.action === 'play-value' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em' }}>TOP CARD:</div>
                <GameCard card={{ id:'top2', suit:'bead', value:'5', special:'pick3' }} size="sm" />
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em', marginBottom:4 }}>YOUR HAND — tap the matching card:</div>
              <div style={{ display:'flex', gap:8 }}>
                {([
                  { id:'d1', suit:'amole' as CardSuit, value:'5' as const, special:'pick3' as const },
                  { id:'d2', suit:'manilla' as CardSuit, value:'9' as const },
                  { id:'d3', suit:'cowrie' as CardSuit, value:'3' as const },
                ] as any[]).map((card: any) => (
                  <div key={card.id} onClick={() => { if(card.value==='5') setTapped(true); }}
                    style={{ cursor:'pointer', transform: tapped && card.value==='5' ? 'translateY(-12px) scale(1.05)' : '', transition:'transform 0.2s' }}>
                    <GameCard card={card} size="md" isPlayable={card.value==='5'} isSelected={tapped && card.value==='5'} />
                  </div>
                ))}
              </div>
              {tapped && <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:'#14F195', letterSpacing:'0.08em', animation:'toast-in 0.3s ease-out' }}>✓ Correct! Same value matches!</div>}
            </div>
          )}

          {/* Special card demo */}
          {step.highlight === 'special' && step.demoCard && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              <GameCard card={{ id:'special-demo', ...step.demoCard } as any} size="lg" />
              <div style={{ padding:'10px 20px', borderRadius:10, background:'rgba(232,184,75,0.1)', border:'1px solid rgba(232,184,75,0.25)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'#E8B84B', letterSpacing:'0.06em', textAlign:'center' }}>
                {step.demoCard.special === 'pick2' && '⚠ Next player draws 2 cards'}
                {step.demoCard.special === 'pick3' && '⚠ Next player draws 3 cards'}
                {step.demoCard.special === 'general_market' && '⚠ Everyone else draws 1 card'}
                {step.demoCard.special === 'hold_on' && '⚠ Next player loses their turn'}
                {step.demoCard.special === 'suspension' && '⚠ Next player skips their turn'}
              </div>
            </div>
          )}

          {/* SOL CARD demo */}
          {step.highlight === 'sol-card' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              <div style={{ position:'relative' }}>
                <GameCard card={{ id:'sol-demo', suit:'cowrie', value:'WHOT' }} size="lg" />
                <div style={{ position:'absolute', top:-12, right:-12, background:'#FFD700', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, boxShadow:'0 0 16px rgba(255,215,0,0.8)', animation:'float 2s ease-in-out infinite' }}>✨</div>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'#FFD700', letterSpacing:'0.06em', textAlign:'center' }}>
                Play on ANY card → Choose ANY suit
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {(['manilla','amole','spearhead','bead','cowrie'] as CardSuit[]).map(s => (
                  <div key={s} style={{ width:32, height:32, borderRadius:'50%', background:`${SUIT_COLORS[s]}33`, border:`2px solid ${SUIT_COLORS[s]}88`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:SUIT_COLORS[s] }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deck draw demo */}
          {step.action === 'draw' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:10, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em', marginBottom:6, textAlign:'center' }}>TOP CARD</div>
                  <GameCard card={{ id:'tp', suit:'spearhead', value:'11' }} size="md" />
                </div>
                <div style={{ fontSize:28 }}>≠</div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:10, color:'rgba(245,230,200,0.4)', letterSpacing:'0.12em', marginBottom:6, textAlign:'center' }}>YOUR CARDS</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <GameCard card={{ id:'nc1', suit:'manilla', value:'4' }} size="sm" />
                    <GameCard card={{ id:'nc2', suit:'bead', value:'8', special:'suspension' }} size="sm" />
                  </div>
                </div>
              </div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'rgba(245,230,200,0.5)', textAlign:'center' }}>
                No match → tap the <strong style={{ color:'#E8B84B' }}>DECK</strong> to draw
              </div>
              <div onClick={() => setTapped(true)} style={{ padding:'10px 24px', borderRadius:10, background:tapped?'rgba(20,241,149,0.15)':'rgba(232,184,75,0.1)', border:`2px solid ${tapped?'rgba(20,241,149,0.5)':'rgba(232,184,75,0.3)'}`, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:tapped?'#14F195':'#E8B84B', transition:'all 0.2s' }}>
                {tapped ? '✓ Drew a card!' : '🃏 TAP TO DRAW'}
              </div>
            </div>
          )}

          {/* Characters display */}
          {step.highlight === 'character' && (
            <div style={{ width:'100%' }}>
              <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12, flexWrap:'wrap' }}>
                {CHARACTERS.map((c, i) => (
                  <div key={c.key} onClick={() => setShowCharDetail(i)} style={{ padding:'8px 10px', borderRadius:10, background:`${c.accentColor}${showCharDetail===i?'25':'0d'}`, border:`1.5px solid ${c.accentColor}${showCharDetail===i?'66':'22'}`, cursor:'pointer', textAlign:'center', minWidth:72, transition:'all 0.2s' }}>
                    <div style={{ fontSize:24, marginBottom:4 }}>{c.icon}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:900, color:c.accentColor, letterSpacing:'0.04em' }}>{c.name}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'12px 16px', borderRadius:12, background:`${char.accentColor}12`, border:`1.5px solid ${char.accentColor}33`, textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:900, color:char.accentColor, marginBottom:4 }}>{char.name} — {char.ability}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(245,230,200,0.6)', lineHeight:1.5 }}>{char.abilityDesc}</div>
              </div>
            </div>
          )}

          {/* Default illustration for non-interactive steps */}
          {!step.highlight && !step.action && step.id !== 'ready' && (
            <div style={{ fontSize:80, animation:'float 3s ease-in-out infinite', filter:'drop-shadow(0 0 20px rgba(232,184,75,0.4))' }}>
              {step.id === 'welcome' ? '⏳' : step.id === 'staking' ? '💰' : step.id === 'multiplayer' ? '⚔️' : '🎴'}
            </div>
          )}

          {step.id === 'ready' && (
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
              {CHARACTERS.map(c => (
                <div key={c.key} style={{ fontSize:40, filter:`drop-shadow(0 0 10px ${c.accentColor}66)`, animation:`float ${2+Math.random()}s ease-in-out infinite` }}>{c.icon}</div>
              ))}
            </div>
          )}
        </div>

        {/* ── TEXT CARD ── */}
        <div style={{ padding:'28px 28px 24px', borderRadius:20, background:'linear-gradient(135deg, rgba(44,26,8,0.96), rgba(26,20,16,0.99))', border:'1.5px solid rgba(232,184,75,0.2)', backdropFilter:'blur(12px)', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#E8B84B', letterSpacing:'0.06em', marginBottom:12 }}>{step.title}</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(245,230,200,0.75)', lineHeight:1.8, whiteSpace:'pre-line' as const }}>{step.text}</div>

          {/* Interactive hint */}
          {step.action && !tapped && (
            <div style={{ marginTop:12, padding:'8px 12px', borderRadius:8, background:'rgba(153,69,255,0.12)', border:'1px solid rgba(153,69,255,0.3)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'#9945FF', letterSpacing:'0.06em', animation:'pulse-gold 2s ease-in-out infinite' }}>
              👆 INTERACTIVE — tap above to try it!
            </div>
          )}
          {step.action && tapped && (
            <div style={{ marginTop:12, padding:'8px 12px', borderRadius:8, background:'rgba(20,241,149,0.1)', border:'1px solid rgba(20,241,149,0.3)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, color:'#14F195', letterSpacing:'0.06em' }}>
              ✓ Well done! Tap NEXT to continue.
            </div>
          )}
        </div>

        {/* ── NAV BUTTONS ── */}
        <div style={{ display:'flex', gap:10 }}>
          {!isFirst && (
            <button className="btn-secondary" style={{ flex:1, fontSize:13, padding:'13px', fontWeight:900, letterSpacing:'0.08em' }} onClick={prev}>← BACK</button>
          )}
          <button className="btn-primary" style={{ flex:2, fontSize:14, padding:'13px', fontWeight:900, letterSpacing:'0.08em', background: isLast ? 'linear-gradient(135deg,#14F195,#0D7A4A)' : undefined }}
            onClick={next}
            disabled={step.action !== null && step.action !== 'finish' && !tapped}>
            {isLast ? 'START PLAYING! ▶' : 'NEXT →'}
          </button>
        </div>

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:16 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStepIdx(i)} style={{ width: i === stepIdx ? 20 : 6, height:6, borderRadius:3, background: i === stepIdx ? '#E8B84B' : i < stepIdx ? 'rgba(232,184,75,0.4)' : 'rgba(255,255,255,0.1)', transition:'all 0.3s', cursor:'pointer' }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

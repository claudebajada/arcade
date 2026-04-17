import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../Gallery';

/*
  Per-game SEO content for the semantic HTML section below the game canvas.
  Replace placeholder text with final copy when ready.
*/
const GAME_SEO_CONTENT = {
  '/fish-for-fruit': {
    name: 'Fish for Fruit',
    tagline: 'Free Underwater Arcade Game',
    about: 'Fish for Fruit is a surreal underwater arcade game where you switch between being a fish and a piece of fruit. Navigate a bizarre ocean full of hungry divers and falling produce, collecting power-ups and racking up points as you master the art of aquatic transformation.',
    howToPlay: 'Start each round as either a fish or a fruit and use your transformation ability to survive. Avoid divers who want to catch you as a fish, and eat falling fruit when you\'re in fish form. Each level introduces new hazards and faster-falling items. Reach the target score before time runs out to advance.',
    controls: 'Arrow Keys / WASD — Move | Space Bar — Transform between fish and fruit | Z — Activate power-up | Mobile: on-screen directional pad and action buttons',
    whatYoullLearn: 'Fish for Fruit builds quick decision-making and hand-eye coordination. Players practise pattern recognition as they learn which form survives each situation, and develop reaction speed as the game pace increases across levels.',
  },
  '/number-nomad': {
    name: 'Number Nomad',
    tagline: 'Free Math Platformer Game',
    about: 'Number Nomad is an educational platformer drawn entirely on graph paper. You play as a small figure jumping through hand-crafted worlds where every platform, enemy, and collectible is tied to a maths equation. Solve equations to progress, collect the right number pieces, and reach the exit portal.',
    howToPlay: 'Run and jump through each level, collecting number tokens that complete the displayed equation. Dodge eraser enemies that roam the platforms and use wall-slides to reach higher areas. Each world introduces a new maths concept — collect all the correct tokens before touching the wrong ones.',
    controls: 'Arrow Keys / WASD — Move and jump | Up Arrow / W — Jump (hold for higher jump) | Down Arrow / S — Crouch | Wall-slide: hold toward wall while falling | Mobile: on-screen joystick and jump button',
    whatYoullLearn: 'Number Nomad reinforces core maths fluency including addition, subtraction, and early multiplication. Players develop mental arithmetic speed by completing equations under movement pressure, making number bonds feel natural and intuitive.',
  },
  '/embassy-of-oddballs': {
    name: 'Embassy of Oddballs',
    tagline: 'Free Geography Strategy Game',
    about: 'Embassy of Oddballs is a geography strategy game featuring all 193 UN member states. Each round presents a ridiculous diplomatic crisis — a lost flamingo, a disputed noodle recipe, a rogue weather balloon — and you must match it to the correct country to resolve the situation. Learn the world\'s nations through pure absurdity.',
    howToPlay: 'Read the crisis brief and the list of candidate countries, then click the flag or name of the country you believe is responsible. Correct matches earn diplomatic points and unlock further crises. Incorrect guesses deduct points and advance the crisis timer. Solve as many crises as possible before the session ends.',
    controls: 'Mouse / Tap — Select a country to resolve the crisis | Keyboard 1–4 — Quick-select numbered options | Escape — Pause and review country facts',
    whatYoullLearn: 'Players build genuine geographical knowledge — capitals, regions, flags, and cultural facts — through repeated exposure in a low-stakes, humour-driven context. Embassy of Oddballs is particularly effective for expanding world geography awareness across all continents.',
  },
  '/gravity-lab': {
    name: 'Gravity Lab',
    tagline: 'Free Space Physics Puzzle Game',
    about: 'Gravity Lab is a physics puzzle game set in outer space. Your goal is simple: guide a comet to its target by placing planets on the screen. Each planet you place warps the fabric of space around it, bending the comet\'s trajectory through gravitational attraction. Eight increasingly tricky puzzles await.',
    howToPlay: 'Drag planets from your inventory onto the play field to create gravitational wells. Watch the comet\'s projected path update in real time as you position each planet. Once you\'re happy with your arrangement, launch the comet and see if it reaches the target star. Fewer planets used means a higher score.',
    controls: 'Mouse / Touch — Drag planets onto the play field | Click planet — Rotate or remove a placed planet | Space Bar / Launch button — Fire the comet | R — Reset the current puzzle',
    whatYoullLearn: 'Gravity Lab introduces the concept of gravitational attraction in an interactive way. Players develop spatial reasoning and basic physics intuition, understanding how mass influences the paths of moving objects — a foundation for Newtonian mechanics.',
  },
  '/debug-dynasty': {
    name: 'Debug Dynasty',
    tagline: 'Free Arcade Coding Game',
    about: 'Debug Dynasty is a fast-paced arcade game that puts you in the shoes of a programmer fighting rogue glitches. Bugs and errors invade your codebase in waves, and only your quick eyes and clicking fingers stand between order and total system chaos. Squash enough bugs to earn the title of Debug Dynasty ruler.',
    howToPlay: 'Bugs appear across the screen in varying speeds and patterns. Click or tap a bug before it reaches the core system to squash it. Different bug types require different numbers of hits. Combos and multipliers reward accurate, rapid bug-squashing. Survive all waves to complete the level.',
    controls: 'Mouse Click / Tap — Squash a bug | Keyboard shortcut keys flash briefly on special bugs for bonus points | Mobile: full touch support with haptic feedback on supported devices',
    whatYoullLearn: 'Debug Dynasty introduces programming vocabulary in a fun context — players encounter terms like syntax error, null pointer, and infinite loop as named enemy types. The game builds familiarity with the idea that code needs testing and debugging, and rewards careful attention to detail.',
  },
  '/math-practice-room': {
    name: 'Math Practice Room',
    tagline: 'Free Kids Maths Practice',
    about: 'Math Practice Room is a cosy, low-pressure classroom where kids can build genuine maths fluency. Choose your name, pick a category, and answer questions at your own pace. The game tracks your streaks and personal bests, encouraging steady improvement without stress or time pressure on early settings.',
    howToPlay: 'Select a student name from the roster (or create one) and choose a maths category: Doubles, Friends of 10, or Bridging. A question appears on the board and you type or select your answer. Correct answers build your streak and unlock harder questions. Review your session stats at the end.',
    controls: 'Number Keys / On-screen Number Pad — Enter your answer | Enter / Return — Submit answer | Backspace — Correct a digit | Mouse / Touch — Select multiple-choice options in beginner mode',
    whatYoullLearn: 'Math Practice Room targets key early numeracy strategies: doubling and halving, number bonds to 10, and the bridging-through-10 technique for mental addition and subtraction. Regular short sessions build the automatic recall that underpins confident mental arithmetic.',
  },
  '/relativistic-racer_arcade': {
    name: 'Relativistic Racer',
    tagline: 'Free Space Racing Science Game',
    about: "Relativistic Racer is a science arcade game where the speed of light has been slowed to 100 mph. Race your spaceship to rescue your stranded sister, dodging asteroids on the way. The twist: as you approach the speed of light, time dilation kicks in — your onboard clock slows while the universe ages around you. Einstein's special relativity, made playable.",
    howToPlay: 'Steer your ship through asteroid fields, collecting speed boosts to push closer to light speed. Watch your velocity gauge and the twin clocks — one for ship time, one for outside time — diverge as you accelerate. Reach the rescue point before your fuel runs out, balancing speed against collision risk.',
    controls: 'Arrow Keys / WASD — Steer the ship | Space Bar — Boost (uses fuel) | Shift — Brake | Mouse / Gamepad supported | Mobile: tilt-to-steer or on-screen controls',
    whatYoullLearn: 'Relativistic Racer makes special relativity tangible. Players directly observe time dilation and length contraction as gameplay mechanics, building intuition for why fast-moving objects experience time differently — concepts from Einstein\'s 1905 paper, no equations required.',
  },
  '/enigma': {
    name: 'Enigma',
    tagline: 'Free Cipher & Code Machine Game',
    about: 'Enigma is an interactive replica of the famous WWII Enigma cipher machine. Set your rotor positions, wire up the plugboard, and watch each keystroke travel through the machine\'s electrical path in real time. Encode top-secret messages or decode intercepted ciphertext — just like the codebreakers of Bletchley Park.',
    howToPlay: 'Choose a mode: Encode a message of your own, or Decode one of three historical-style challenges. Configure the three rotors and optional plugboard pairs, then type your message letter by letter to see it encrypted. In decode mode, use the provided starting settings and type the ciphertext to reveal the hidden message.',
    controls: 'Keyboard — Type letters to encrypt them | Mouse / Tap — Click the on-screen keyboard | Rotor controls — Click rotor labels to step positions | Plugboard — Type letter pairs into the input field',
    whatYoullLearn: 'Enigma teaches the fundamentals of substitution ciphers, symmetric encryption, and the history of WWII cryptography. Players gain intuition for why cipher complexity matters and how the same machine settings are needed to both encrypt and decrypt — a core concept in cryptography and computer security.',
  },
  '/note-quest': {
    name: 'Note Quest',
    tagline: 'Free Music Theory Game for Kids',
    about: 'Note Quest is a music theory quiz adventure packed with ear training, note reading, chord building, rhythm, and instrument knowledge. Choose your learning path — Notes, Chords, Rhythm, Scales, Ear Training, or Guitar & Ukulele — and level up through beginner to advanced questions. Collect stars, badges, and unlock new themes as you go.',
    howToPlay: 'Pick a mode (Learn, Quiz, or timed Challenge), choose a learning stream, then select a level. Answer multiple-choice questions to earn up to three stars per level. Correct answers build your streak and score; hints are available in Learn mode. Finish a level to see your results and unlock rewards.',
    controls: 'Mouse / Tap — Select an answer | Keyboard 1–4 — Quick-select options | H — Show hint (Learn mode) | P — Replay audio question | Enter — Continue after answering',
    whatYoullLearn: 'Note Quest builds well-rounded music literacy: note names on the treble clef, interval recognition, chord construction, key signatures, time signatures, mode names, and basic guitar and ukulele chord shapes. Regular play develops the musical ear alongside theoretical understanding.',
  },
  '/ukulele-quest': {
    name: 'Ukulele Quest',
    tagline: 'Free Classroom Ukulele Learning Game',
    about: "Ukulele Quest is a classroom fretboard teaching game designed for shared tablets. A big, friendly ukulele neck fills the screen and kids take turns finding notes and building chord shapes. Three play modes suit different classroom styles — Pass & Play for individual turns, The Council for team discussion, and GamesMaster for teacher-led sessions with real ukuleles in students' hands.",
    howToPlay: 'Pick a mode, a level (Note Hunter or Chord Builder), and a scoring style (team or leaderboard). On each round the screen shows a target note or chord name. Tap the fretboard to place a finger — one tap to find a note, or multiple taps to form a chord — then submit. Correct answers earn points and a confetti burst; wrong answers reveal the right shape so the whole class learns.',
    controls: 'Tap / Mouse — Place a finger on the fretboard | Submit / Clear buttons — Confirm or reset your chord | Flip — Rotate the screen for the opposite side of the table | Menu — Return to setup',
    whatYoullLearn: 'Ukulele Quest builds real fretboard fluency: open-string notes (G C E A), how frets map to pitch, and the finger shapes for common chords like C, Am, F, and G7. The turn-taking modes also develop musical vocabulary and collaborative learning habits that transfer to group lessons.',
  },
};

// Colour tokens consistent with the site's dark theme
const STYLES = {
  section: {
    background: 'linear-gradient(180deg, #0b0020 0%, #080018 100%)',
    color: '#d4c8f0',
    fontFamily: "'Nunito', 'Baloo 2', sans-serif",
    padding: '56px 24px 48px',
  },
  container: {
    maxWidth: 820,
    margin: '0 auto',
  },
  h2: {
    fontFamily: "'Boogaloo', 'Comic Sans MS', cursive",
    fontSize: 'clamp(26px, 4vw, 38px)',
    fontWeight: 400,
    color: '#ffe066',
    textShadow: '0 0 16px #ff9f4366',
    marginBottom: 24,
    lineHeight: 1.2,
  },
  h3: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 'clamp(15px, 2.5vw, 19px)',
    fontWeight: 900,
    color: '#b09fd4',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 32,
  },
  p: {
    fontSize: 'clamp(14px, 2vw, 16px)',
    lineHeight: 1.75,
    color: '#c0b0e0',
    maxWidth: 680,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, #3a1a6e, transparent)',
    margin: '48px 0',
  },
  relatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
    gap: 16,
    marginTop: 24,
  },
  relatedHeading: {
    fontFamily: "'Righteous', 'Arial Black', sans-serif",
    fontSize: 'clamp(16px, 3vw, 22px)',
    fontWeight: 900,
    color: '#48dbfb',
    textShadow: '0 0 12px #48dbfb55',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  relatedSubheading: {
    fontSize: 13,
    color: '#7a6aa0',
    marginBottom: 24,
  },
};

// A single Related Game card
function RelatedGameCard({ game }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  // Descriptive alt text combining title and primary tag (genre)
  const altText = `${game.title} — ${game.tags.map(t =>
    t.charAt(0).toUpperCase() + t.slice(1)
  ).join(' ')} Game`;

  return (
    <a
      href={game.path}
      onClick={(e) => { e.preventDefault(); navigate(game.path); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={`Play ${game.title} — ${game.subtitle}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: 16,
        overflow: 'hidden',
        border: `2px solid ${hovered ? game.colors[0] + 'cc' : '#2a1a5e'}`,
        background: '#0d0b2b',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px) scale(1.03)' : 'none',
        boxShadow: hovered
          ? `0 12px 36px ${game.colors[0]}28, 0 0 60px ${game.colors[1]}12`
          : '0 4px 16px rgba(0,0,0,0.4)',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail area — gradient + emoji as the visual representation */}
      <div
        role="img"
        aria-label={altText}
        style={{
          height: 96,
          background: `linear-gradient(135deg, ${game.colors[0]}22, ${game.colors[1]}44)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          borderBottom: `2px solid ${game.colors[0]}33`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top colour stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${game.colors[0]}, ${game.colors[1]})`,
        }} />
        {game.emoji}
      </div>

      {/* Card text */}
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 13,
          fontWeight: 900,
          color: hovered ? game.colors[0] : '#d4c8f0',
          transition: 'color 0.25s',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {game.title}
        </div>
        <div style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}>
          {game.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize: 9,
              fontWeight: 700,
              color: game.colors[0],
              border: `1px solid ${game.colors[0]}55`,
              borderRadius: 20,
              padding: '2px 7px',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

/*
  GamePageWrapper
  ───────────────
  Wraps a game component and appends:
    1. Semantic SEO content section (h2 About, h3 How to Play / Controls / What You'll Learn)
    2. Related Games grid (3 games from the catalog, excluding the current game)

  Usage in App.js:
    <GamePageWrapper path="/fish-for-fruit">
      <FishForFruit />
    </GamePageWrapper>
*/
export default function GamePageWrapper({ path, children }) {
  const content = GAME_SEO_CONTENT[path];

  // Pick up to 3 related games (excluding the current game)
  const relatedGames = GAMES.filter(g => g.path !== path).slice(0, 3);

  return (
    <>
      {/* The game itself — renders at full viewport height */}
      {children}

      {/* ── SEO Content Section ───────────────────────────────────── */}
      {content && (
        <section
          aria-label={`About ${content.name}`}
          style={STYLES.section}
        >
          <div style={STYLES.container}>

            {/* About the game */}
            <h2 style={STYLES.h2}>About {content.name}</h2>
            <p style={STYLES.p}>{content.about}</p>

            {/* How to Play */}
            <h3 style={STYLES.h3}>How to Play</h3>
            <p style={STYLES.p}>{content.howToPlay}</p>

            {/* Controls */}
            <h3 style={STYLES.h3}>Controls</h3>
            <p style={{ ...STYLES.p, fontFamily: "'Courier New', monospace", fontSize: 14 }}>
              {content.controls}
            </p>

            {/* What You'll Learn */}
            <h3 style={STYLES.h3}>What You'll Learn</h3>
            <p style={STYLES.p}>{content.whatYoullLearn}</p>

            {/* Divider */}
            <div style={STYLES.divider} aria-hidden="true" />

            {/* ── Related Games ───────────────────────────────────── */}
            <nav aria-label="More games you might enjoy">
              <div style={STYLES.relatedHeading}>More Games</div>
              <p style={STYLES.relatedSubheading}>
                More free games from Odd Noodle Games — no download needed
              </p>

              <div style={STYLES.relatedGrid}>
                {relatedGames.map(game => (
                  <RelatedGameCard key={game.id} game={game} />
                ))}
              </div>
            </nav>

          </div>
        </section>
      )}
    </>
  );
}

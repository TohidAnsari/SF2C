# Shadow Fight 2 — Web Edition (SF2C)

A high-fidelity HTML5 Canvas martial-arts fighting game recreating the mechanics, aesthetic, and physics of Nekki's **Shadow Fight 2**.

---

## 🌟 Key Features

1. **Authentic Shadow Fight 2 Dojo Lobby Hub**:
   - **Interactive Training Dojo Scene**: Tatami mats, shoji sliding doors, weapon rack, and wall calligraphy scrolls ("影" & "武道").
   - **Interactive Hanging Punching Sandbag with Pendulum Physics**: Strike the sandbag directly in the lobby to test weapon range, swing angles, and impact sounds.
   - **Full SF2 Resource Header**: Dan Level & EXP Bar, Lightning Energy (⚡ 5/5), Rubies (💎 15), and Gold Coins (💰 200).
   - **Circular SF2 Navigation Dock**: Equipment, Martial Perks Tree, Daily Quests, and the iconic giant pulsing red **FIGHT** button with crossed golden swords.
   - **Atmospheric Dojo Music**: Serene procedural Japanese Shakuhachi and Koto melodies in the lobby transitioning to intense Taiko battle drums during combat.

2. **Authentic Silhouette Aesthetic**:
   - Jet-black high-contrast ninja silhouettes with glowing eyes and cloth bandana physics.
   - 4-layer parallax atmospheric scenery: watercolor sunset gradient, distant mountain ridges, Japanese Pagoda, bamboo grove, and Torii gates.
   - Wind-simulated drifting Sakura (cherry blossom) petals.

2. **Cascadeur-Inspired Combat Mechanics**:
   - **8-Way Directional Attack Matrix**: Direction vector combined with Punch or Kick unleashes 18 distinct martial arts techniques.
   - **Frame-Data State Machine**: Moves engineered with startup, active hitbox, and recovery phases.
   - **Hit Zones & Critical Hits**: Headshots deal $1.7\times$ damage with camera trauma, screen shake, and blood sparks; low sweeps trip and knock opponents down.
   - **Auto-Guard**: Moving backward or standing neutral without attacking blocks incoming strikes (clang sound + spark deflection + chip damage).
   - **Close-Range Throw**: Step inside distance ($<45\text{px}$) and press Forward + Punch to perform an unblockable shoulder slam!
   - **Evasive Rolls & Backflips**: Double-tap Forward or Back to roll under high strikes or create distance.
   - **Ranged Weapon (Shuriken)**: Throw ninja stars horizontally.

3. **Act 1: Hero Reborn Tournament Ladder**:
   - **Stage 1**: Shin (The Young Disciple — Bare Fists)
   - **Stage 2**: Ken (Shaolin Monk — Steel Knives)
   - **Stage 3**: Brick (Underground Enforcer — Heavy Armor)
   - **Stage 4**: Needle (Silent Assassin — Katana)
   - **Stage 5**: Ghost (Cursed Ronin — Kusarigama Blood Reaper)
   - **Stage 6 (Demon Boss)**: **Lynx** (Equipped with Demonic Claws and Smoke Bomb Invisibility!)

4. **Dojo Armory & Economy**:
   - Earn gold from tournament matches.
   - Purchase and equip weapons: Fists, Steel Knives, Ninja Katana, Kusarigama, Lynx's Claws.
   - Purchase and equip armor vests and kabuto helmets for damage mitigation.

5. **Procedural Web Audio Synthesizer**:
   - Zero external audio files required! Synthesizes blade slashes, flesh impacts, metallic parries, whooshes, taiko drums, and Japanese Hirajoshi pentatonic battle music in real-time using the Web Audio API.

6. **Input Flexibility**:
   - Desktop Keyboard & Gamepad support.
   - On-Screen Mobile Virtual Joystick and Action Buttons.

---

## 🎮 Controls & Move List

### Movement & Defense
* **Move Left / Right**: `A` / `D` or `Left` / `Right` Arrow
* **Jump**: `W` or `Up` Arrow
* **Crouch**: `S` or `Down` Arrow
* **Auto-Guard**: Hold `Back` (Away from opponent)
* **Manual Guard**: `Shift` Key or On-Screen `GUARD` Button
* **Ground Roll / Dodge**: `Spacebar`, On-Screen `ROLL` Button, or Double-tap `Forward`
* **Backflip**: Double-tap `Back`
* **Pause Battle**: `Esc` or `P` key, or Top Nav `⏸️` button
* **Move List Scroll**: Top Nav `📜 MOVES` button

### Attack Matrix
| Input | Move Name | Target Zone | Property |
|---|---|---|---|
| **Neutral + Punch** (`J`) | Quick Jab Combo | Torso | Fast 2-hit punch |
| **Forward + Punch** (`D + J`) | Double Strike | Torso | Lunging forward thrust |
| **Back + Punch** (`A + J`) | Spinning Backfist | Head | High damage + knockback |
| **Up + Punch** (`W + J`) | Dragon Uppercut | Head | Vertical anti-air launcher |
| **Down + Punch** (`S + J`) | Low Strike | Legs | Quick knee/shin hit |
| **Close + Fwd + Punch** | Shoulder Slam | Torso | Unblockable judo takedown |
| **Neutral + Kick** (`K`) | Front Snap Kick | Torso | Mid-range spacing |
| **Forward + Kick** (`D + K`) | Side Step Thrust | Torso | Long-range lunging kick |
| **Back + Kick** (`A + K`) | Spinning Heel Kick | Head | Heavy rotational kick |
| **Up + Kick** (`W + K`) | Axe Kick | Head | Downward heel drop |
| **Down + Kick** (`S + K`) | Sweeping Low Kick | Legs | Ground trip / knockdown |
| **Ranged Weapon** (`L`) | Shuriken Star | Mid | Horizontal throwing star |

---

## 🚀 Running the Project

Because the project is completely self-contained with procedural audio and graphics:

### Option 1: Direct File
Simply double-click `index.html` to open it in Google Chrome, Edge, Brave, or Firefox.

### Option 2: Local Python Server
```powershell
python -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

### Option 3: Node / NPX Serve
```powershell
npx -y serve . -p 8080
```

---

## 🏗️ Architecture & Code Organization

```
SF2C/
├── index.html              # Main application markup & screens
├── package.json            # Project metadata & launch scripts
├── README.md               # Game design, move lists, and docs
├── css/
│   └── style.css           # Authentic ink/blood-orange theme
└── js/
    ├── config.js           # Frame data, moves, weapons, opponents
    ├── audio.js            # Procedural Web Audio API sound & music engine
    ├── input.js            # Keyboard, gamepad, & touch virtual joystick
    ├── skeleton.js         # Joint kinematics & silhouette renderer
    ├── renderer.js         # Parallax arenas, sakura petals, dynamic camera
    ├── fighter.js          # Combat state machine, hitboxes, and collision
    ├── ai.js               # Tactical AI (spacing, auto-block, boss abilities)
    ├── armory.js           # Shop, equipment, and gold storage
    ├── tournament.js       # Act 1 ladder progression and dialogue
    ├── dojo.js             # Interactive lobby dojo scene & sandbag physics
    └── game.js             # Match lifecycle & loop orchestrator
```


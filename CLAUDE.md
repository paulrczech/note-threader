# Eddy — Claude Context

## What this app is

A minimal music utility for voice leading guided by oblique strategies. Users move individual voices by small intervals — the chord emerges as a byproduct. Inspired by Brian Eno's Oblique Strategies. Target: songwriters/composers. Tagline: "follow the current".

## Stack

- Vue 3 `<script setup>`, Ionic, Pinia, Tone.js (Salamander Grand Piano samples via CDN), @tonejs/midi
- Capacitor deferred to V2
- No backend — all client-side

## Key constraints

- MIDI range: G3(55)–C6(84). Spread ≤14 semitones. Seed zone C4(60)–C5(72).
- No voice crossing (sorted ascending always). No chord names — purely voice movement.
- Always sharps (C#, F#, etc.)
- 3 or 4 voices only (5 = V2)

## Architecture

- `src/data/notes.ts` — MIDI constants, NOTE_NAMES, midiToName(), dissonanceRank()
- `src/data/strategies.ts` — 20 Strategy objects {id, text, hint, voicesAllowedToMove, movementType, direction, requiresKeyLock}
- `src/data/scales.ts` — 12 scale/mode definitions
- `src/utils/noteUtils.ts` — Cluster type, sortCluster(), isValidCluster(), reachableNotes(), deduplicateClusters()
- `src/utils/sessionStorage.ts` — SavedSession, listSessions(), saveSession(), deleteSession(), renameSession()
- `src/utils/midiUtils.ts` — exportSequenceAsMidi() (direction-aware), exportSequenceAsText()
- `src/composables/useVoiceLeading.ts` — generateCandidates(cluster, strategy, options), MAX_CANDIDATES=6
- `src/composables/useStrategyDeck.ts` — useStrategyDeck(keyLockActive), draw() returns Strategy | null
- `src/composables/useAudioEngine.ts` — singleton pattern, Tone.js sampler + PolySynth support, humanized velocity, RAF-based playingIndex tracking
- `src/stores/settingsStore.ts` — voiceCount, movementSize, keyLockMode, keyRoot, scaleId, loopMode, maxMoves, arpeggioDirection, instrument, tempo
- `src/stores/sequenceStore.ts` — sequence, redoStack, undo/redo, transposeOctave(), canTransposeOctave(), editClusterAt()
- `src/views/HomeView.vue` — settings, manual entry, saved sessions, single start button (toggles between "let it begin" / "begin here")
- `src/views/SessionView.vue` — main session screen, activeStrategy ref (NOT from composable), advance(), watchers for direction/tempo/instrument changes
- `src/components/cluster/ClusterDisplay.vue`
- `src/components/strategy/StrategyCard.vue` — IonPopover hint, "another" button
- `src/components/sequence/SequenceHistory.vue` — swipe-to-delete, inline note editing, playing row highlight
- `src/components/playback/PlaybackControls.vue` — loop/stop/play-once + octave +12/−12 buttons
- `src/components/ui/SavedSessions.vue` — inline name editing (tap name), load via metadata area
- `src/components/ui/AboutModal.vue`
- `src/router/index.ts` — /home, /session
- `src/theme/variables.css` — design tokens

## Design tokens (key ones)

```css
--font-serif:
  'Cormorant Garamond', Georgia,
  serif /* poetry, headings, strategy text */ --font-mono: 'SF Mono',
  'Fira Code',
  monospace /* note names, data */ --font-sans: system-ui sans
    /* controls, body */ --color-bg: #0d0d12 --color-surface: #161620
    --color-accent: #e0a87c /* amber */ --color-text: #e4e4dc
    --color-text-dim: #8888a8 /* labels, secondary UI */ --color-border: #2a2a38
    --voice-1: #7eb8d4 --voice-2: #8ecfb0 --voice-3: #e0a87c --voice-4: #b8a0d4;
```

## Critical patterns

- **Strategy card bug fix**: `activeStrategy` is a local ref in SessionView, set atomically in `advance()` — never use `currentStrategy` from the composable directly in the template
- **Loop playback**: Use Transport.loop (not Part.loop). Set all loop params BEFORE `loopPart.start(0)`. Start transport with `'+0.05'` offset.
- **randomStart()**: Uses retry loop (30 attempts) + guaranteed fallback cluster — never passes invalid cluster to start()
- **start()**: Always clears state first before validating — prevents stale session data leaking
- **Single start button**: HomeView shows "let it begin" OR "begin here" (v-if/v-else on showManual) — never both at once
- **Direction/tempo/instrument changes during playback**: watchers in SessionView call playLoop() (restarts cleanly)
- **Instrument**: Piano only in UI for now. Strings/synth engine code intact in useAudioEngine.ts — re-enable by adding toggle to HomeView.

## Copy/labels

- "let it flow" (random start), "flow from here" (manual start)
- "choose your starting notes" (toggle to show manual entry)
- "keep this" / "keep these N" (confirm button)
- "another" (strategy redraw button)
- "the drift" (strategy card section label)
- "streams — tap to hear" (candidates section label)
- "current" (current cluster section label)
- "the flow" (sequence history section label)
- "a loop has formed — N moves" (loop resolved banner)
- "+12" / "−12" (octave transpose)
- "✎" (edit icon on sequence rows)
- Tagline: "let the music move itself"

## V2 / deferred

- Note editing within sequence entries — discussed, scope needs clarification before implementing
- Instrument selector UI (strings/synth engine already built)
- Capacitor native build
- 5-voice support

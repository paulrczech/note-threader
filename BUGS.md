# Eddy — Bug Tracker

## Open

- **First row in The Flow is shorter than subsequent rows** — the seed entry (index 0) has no `IonReorder` handle; a spacer was added but doesn't fully compensate for the height difference. Needs investigation into how `IonReorder` affects row height.

## Fixed
- **Loop button doesn't loop on first press** — single click on "▶ loop" was firing both `play` and `playOnce` events due to Vue v-if/v-else compiled template handler cache collision. Fixed with 100ms debounce guard in `playSequence`. (Session 4)
- **Tone.Part not replaying on Transport loop** — `Part.loop` and `Part.loopEnd` must be set before `loopPart.start(0)`. Fixed in `useAudioEngine.ts`. (Session 4)

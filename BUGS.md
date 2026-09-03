# Eddy — Bug Tracker

## Open

- **Navigating "← new" resets session immediately with no confirmation** — one accidental tap destroys the entire flow with no recovery. Needs a confirmation dialog before resetting. Also: returning to Home from an active session should offer "continue" or "start fresh" if an unsaved session exists.

## Fixed

- **Loop button doesn't loop on first press** — single click on "▶ loop" was firing both `play` and `playOnce` events due to Vue v-if/v-else compiled template handler cache collision. Fixed with 100ms debounce guard in `playSequence`. (Session 4)
- **Tone.Part not replaying on Transport loop** — `Part.loop` and `Part.loopEnd` must be set before `loopPart.start(0)`. Fixed in `useAudioEngine.ts`. (Session 4)
- **Exported midi file doesn't line up in DAW Grid correctly** — `noteDuration`/`clusterGap` in `exportSequenceAsMidi` were fixed-second values independent of tempo, so cluster downbeats drifted off the beat grid. Rebuilt around one-bar-per-cluster timing: arpeggio steps at a subdivision grid within the bar, last note held to the next downbeat. All timing now derives from `bpm`, so downbeats always land on the grid. (`src/utils/midiUtils.ts`)
- **Playback/export subdivision mismatch** — in-app stream playback arpeggiated at 16th notes while MIDI export used 8th notes, so exported files didn't match what you heard. Unified into `settingsStore.subdivision` (shared by `useAudioEngine.ts` and `midiUtils.ts`), with an 8th/16th toggle in the SessionView tray ("grid" row). Default is 16th, matching prior playback feel.

## Added by Paul

- **Does or should saving a previously saved flow overwrite the existing flow or create a new version? Currently saving it seems to write a new version**

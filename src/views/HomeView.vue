<template>
  <ion-page>
    <ion-content class="ion-padding" fullscreen>
      <button class="about-btn" @click="showAbout = true">?</button>
      <AboutModal :is-open="showAbout" @close="showAbout = false" />
      <div class="home-layout">
        <!-- Title -->
        <div class="title-block">
          <h1 class="app-title">eddy</h1>
          <p class="app-tagline">let the music move itself</p>
        </div>

        <!-- Voice count -->
        <div class="param-group">
          <p class="param-label">voices</p>
          <div class="toggle-row">
            <button
              v-for="n in [3, 4]"
              :key="n"
              class="toggle-btn"
              :class="{ active: voiceCount === n }"
              @click="settingsStore.setVoiceCount(n as 3 | 4)">
              {{ n }}
            </button>
          </div>
        </div>

        <!-- Movement size -->
        <div class="param-group">
          <p class="param-label">movement</p>
          <div class="toggle-row">
            <button
              v-for="m in movementOptions"
              :key="m.value"
              class="toggle-btn"
              :class="{ active: movementSize === m.value }"
              @click="settingsStore.setMovementSize(m.value as any)">
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- Instrument -->
        <div class="param-group">
          <p class="param-label">instrument</p>
          <select
            class="instrument-select"
            :value="settingsStore.instrument"
            @change="settingsStore.setInstrument(($event.target as HTMLSelectElement).value as any)">
            <option value="piano">piano</option>
            <option value="harp">harp</option>
            <option value="guitar-acoustic">guitar (acoustic)</option>
            <option value="guitar-nylon">guitar (nylon)</option>
            <option value="cello">cello</option>
            <option value="violin">violin</option>
          </select>
        </div>

        <!-- Manual cluster entry (collapsible) -->
        <div class="param-group">
          <button class="ghost-btn" @click="showManual = !showManual">
            {{ showManual ? '▾' : '▸' }} choose your starting notes
          </button>

          <div v-if="showManual" class="manual-entry">
            <div
              v-for="(_, i) in Array(voiceCount)"
              :key="i"
              class="voice-picker">
              <span class="voice-label" :style="{ color: voiceColors[i] }"
                >V{{ i + 1 }}</span
              >
              <select v-model="manualMidi[i]" class="note-select">
                <option
                  v-for="midi in validMidiRange"
                  :key="midi"
                  :value="midi">
                  {{ midiToName(midi) }}
                </option>
              </select>
            </div>
            <p v-if="manualError" class="error-msg">{{ manualError }}</p>
          </div>
        </div>

        <!-- Saved sessions -->
        <SavedSessions @load="loadSession" />

        <!-- Start buttons -->
        <div class="start-block">
          <button
            v-if="!showManual"
            class="start-btn primary"
            @click="startRandom">
            let it flow
          </button>
          <button v-else class="start-btn primary" @click="startManual">
            flow from here
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { IonPage, IonContent } from '@ionic/vue'
  import AboutModal from '../components/ui/AboutModal.vue'
  import SavedSessions from '../components/ui/SavedSessions.vue'
  import type { SavedSession } from '../utils/sessionStorage'
  import { useSettingsStore } from '../stores/settingsStore'
  import { useSequenceStore } from '../stores/sequenceStore'
  import { useAudioEngine } from '../composables/useAudioEngine'
  import { midiToName, MIDI_MIN, MIDI_MAX, MAX_CLUSTER_SPREAD } from '../data/notes'
  import { isValidCluster, sortCluster } from '../utils/noteUtils'

  const VOICE_COLORS = [
    'var(--voice-1)',
    'var(--voice-2)',
    'var(--voice-3)',
    'var(--voice-4)',
  ]

  const movementOptions = [
    { label: '½', value: 'half' },
    { label: '½–1', value: 'step' },
    { label: '1', value: 'whole' },
    { label: '≤3rd', value: 'third' },
    { label: 'free', value: 'free' },
  ]

  const router = useRouter()
  const settingsStore = useSettingsStore()
  const sequenceStore = useSequenceStore()
  const { init } = useAudioEngine()

  const voiceCount = computed(() => settingsStore.voiceCount)
  const movementSize = computed(() => settingsStore.movementSize)
  const voiceColors = VOICE_COLORS

  const showAbout = ref(false)
  const showManual = ref(false)
  const manualError = ref('')

  // Default manual notes: a simple C major triad around C4
  const manualMidi = ref<number[]>([60, 64, 67, 71])

  // All valid MIDI notes for the picker (G3–C6)
  const validMidiRange = Array.from({ length: MIDI_MAX - MIDI_MIN + 1 }, (_, i) => MIDI_MIN + i)

  async function startRandom() {
    await init(settingsStore.instrument)
    sequenceStore.randomStart(settingsStore.voiceCount)
    router.push('/session')
  }

  async function loadSession(session: SavedSession) {
    if (session.instrument) settingsStore.setInstrument(session.instrument)
    await init(settingsStore.instrument)
    settingsStore.setVoiceCount(session.voiceCount as 3 | 4)
    sequenceStore.start(session.sequence[0])
    for (let i = 1; i < session.sequence.length; i++) {
      sequenceStore.confirm(session.sequence[i])
    }
    router.push('/session')
  }

  async function startManual() {
    manualError.value = ''
    const selected = manualMidi.value.slice(0, settingsStore.voiceCount)
    const sorted = sortCluster(selected)

    if (!isValidCluster(sorted)) {
      manualError.value =
        `Invalid cluster — check range and spread (max ${MAX_CLUSTER_SPREAD} semitones)`
      return
    }

    await init(settingsStore.instrument)
    sequenceStore.start(sorted)
    router.push('/session')
  }
</script>

<style scoped>
  .about-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    color: var(--color-text-dim);
    width: 1.8rem;
    height: 1.8rem;
    font-size: 0.85rem;
    cursor: pointer;
    font-family: inherit;
    transition:
      border-color 0.15s,
      color 0.15s;
    z-index: 10;
  }
  .about-btn:hover {
    border-color: var(--color-text-dim);
    color: var(--color-text);
  }

  .home-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 420px;
    margin: 0 auto;
    padding-top: 3rem;
  }

  .title-block {
    text-align: center;
  }

  .app-title {
    font-family: var(--font-serif);
    font-size: 2.8rem;
    font-weight: 300;
    letter-spacing: 0.08em;
    color: var(--color-text);
    margin: 0 0 0.4rem;
  }

  .app-tagline {
    font-family: var(--font-serif);
    font-size: 0.95rem;
    font-style: italic;
    font-weight: 300;
    letter-spacing: 0.06em;
    color: var(--color-text-dim);
    margin: 0;
  }

  .param-label {
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-text-dim);
    margin: 0 0 0.5rem;
  }

  .toggle-row {
    display: flex;
    gap: 0.4rem;
  }

  .toggle-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text-dim);
    font-size: 0.8rem;
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .toggle-btn.active {
    border-color: var(--color-text-dim);
    color: var(--color-text-dim);
    background: rgba(83, 105, 72, 0.25);
  }

  .ghost-btn {
    background: none;
    border: none;
    color: var(--color-text-dim);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.15s;
  }

  .ghost-btn:hover {
    color: var(--color-text);
  }

  .manual-entry {
    margin-top: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .voice-picker {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .voice-label {
    font-size: 0.7rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    letter-spacing: 0.06em;
    width: 2rem;
  }

  .instrument-select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text);
    font-size: 0.8rem;
    padding: 0.4rem 0.7rem;
    font-family: inherit;
    cursor: pointer;
    width: 100%;
    max-width: 220px;
  }

  .note-select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text);
    font-size: 0.85rem;
    padding: 0.3rem 0.6rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    cursor: pointer;
  }

  .error-msg {
    font-size: 0.75rem;
    color: #e07878;
    margin: 0;
  }

  .start-block {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .start-btn {
    width: 100%;
    border-radius: 10px;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    padding: 0.85rem;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .start-btn.primary {
    background: var(--color-accent);
    border: none;
    color: #f2eee3;
    font-weight: 500;
  }

  .start-btn.primary:hover {
    background: #e8b88c;
  }

  .start-btn.secondary {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .start-btn.secondary:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
</style>

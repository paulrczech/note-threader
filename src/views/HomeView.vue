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

        <!-- Trigger rows -->
        <div class="secondary-block">

          <!-- The current (settings) -->
          <button class="trigger-row" @click="settingsOpen = true">
            <span class="trigger-label">the current</span>
            <span class="trigger-value">{{ voiceCount }}v · {{ movementLabel }} · {{ instrumentLabel }}</span>
            <span class="trigger-arrow">›</span>
          </button>

          <!-- Past flows (saved sessions) -->
          <button class="trigger-row" @click="openSessions">
            <span class="trigger-label">past flows</span>
            <span class="trigger-value">{{ sessionCount > 0 ? sessionCount : 'none' }}</span>
            <span class="trigger-arrow">›</span>
          </button>

          <!-- The source (starting notes) -->
          <button class="trigger-row" @click="openPicker">
            <span class="trigger-label">the source</span>
            <span class="trigger-value">
              <template v-if="showManual">
                <span
                  v-for="(midi, i) in manualMidi.slice(0, voiceCount)"
                  :key="i"
                  class="preview-note"
                  :style="{ color: voiceColors[i] }">
                  {{ midiToName(midi) }}
                </span>
              </template>
              <template v-else>
                <span class="trigger-hint-main">random</span>
                <span class="trigger-hint-sub">tap to choose</span>
              </template>
            </span>
            <span class="trigger-arrow">›</span>
          </button>

        </div>

        <!-- Primary action -->
        <div class="start-block">
          <button class="start-btn" @click="showManual ? startManual() : startRandom()">
            {{ showManual ? 'flow from here' : 'let it flow' }}
          </button>
        </div>

        <p v-if="manualError" class="error-msg">{{ manualError }}</p>
      </div>

      <!-- Settings sheet -->
      <IonModal
        :is-open="settingsOpen"
        :breakpoints="[0, 1]"
        :initial-breakpoint="1"
        :handle="true"
        @did-dismiss="settingsOpen = false">
        <ion-content>
        <div class="sheet-content">
          <p class="sheet-title">the current</p>

          <div class="sheet-group">
            <p class="sheet-label">voices</p>
            <div class="option-list">
              <button
                v-for="n in [3, 4]"
                :key="n"
                class="option-btn"
                :class="{ active: voiceCount === n }"
                @click="settingsStore.setVoiceCount(n as 3 | 4)">
                {{ n }}
              </button>
            </div>
          </div>

          <div class="sheet-group">
            <p class="sheet-label">drift</p>
            <div class="option-list">
              <button
                v-for="m in movementOptions"
                :key="m.value"
                class="option-btn"
                :class="{ active: movementSize === m.value }"
                @click="settingsStore.setMovementSize(m.value as any)">
                {{ m.label }}
              </button>
            </div>
          </div>

          <div class="sheet-group">
            <p class="sheet-label">sound</p>
            <div class="option-list">
              <button
                v-for="inst in instrumentOptions"
                :key="inst.value"
                class="option-btn"
                :class="{ active: settingsStore.instrument === inst.value }"
                @click="settingsStore.setInstrument(inst.value as any)">
                {{ inst.label }}
              </button>
            </div>
          </div>
        </div>
        </ion-content>
      </IonModal>

      <!-- Past flows sheet -->
      <IonModal
        :is-open="sessionsOpen"
        :breakpoints="[0, 0.6, 1]"
        :initial-breakpoint="1"
        :handle="true"
        @did-dismiss="sessionsOpen = false">
        <ion-content class="ion-padding">
          <SavedSessions @load="loadSession" />
        </ion-content>
      </IonModal>

    </ion-content>

    <!-- Note picker — outside ion-content to overlay correctly -->
    <IonPicker
      v-if="pickerOpen"
      :is-open="pickerOpen"
      :buttons="pickerButtons"
      @did-dismiss="pickerOpen = false">
      <IonPickerColumn
        v-for="(_, i) in Array(voiceCount)"
        :key="i"
        :value="manualMidi[i]"
        @ion-change="onColumnChange(i, $event)">
        <IonPickerColumnOption
          v-for="midi in validMidiRange"
          :key="midi"
          :value="midi"
          :style="{ color: voiceColors[i] }">
          {{ midiToName(midi) }}
        </IonPickerColumnOption>
      </IonPickerColumn>
    </IonPicker>

  </ion-page>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    IonPage,
    IonContent,
    IonModal,
    IonPicker,
    IonPickerColumn,
    IonPickerColumnOption,
  } from '@ionic/vue'
  import AboutModal from '../components/ui/AboutModal.vue'
  import SavedSessions from '../components/ui/SavedSessions.vue'
  import type { SavedSession } from '../utils/sessionStorage'
  import { listSessions } from '../utils/sessionStorage'
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
    { label: '½ step', value: 'half' },
    { label: '½–1 step', value: 'step' },
    { label: '1 step', value: 'whole' },
    { label: '≤ 3rd', value: 'third' },
    { label: 'free', value: 'free' },
  ]

  const instrumentOptions = [
    { label: 'piano', value: 'piano' },
    { label: 'harp', value: 'harp' },
    { label: 'guitar (acoustic)', value: 'guitar-acoustic' },
    { label: 'guitar (nylon)', value: 'guitar-nylon' },
    { label: 'cello', value: 'cello' },
    { label: 'violin', value: 'violin' },
  ]

  const router = useRouter()
  const settingsStore = useSettingsStore()
  const sequenceStore = useSequenceStore()
  const { init } = useAudioEngine()

  const voiceCount = computed(() => settingsStore.voiceCount)
  const movementSize = computed(() => settingsStore.movementSize)
  const voiceColors = VOICE_COLORS

  const movementLabel = computed(() =>
    movementOptions.find(m => m.value === movementSize.value)?.label ?? movementSize.value
  )

  const instrumentLabel = computed(() =>
    instrumentOptions.find(i => i.value === settingsStore.instrument)?.label ?? settingsStore.instrument
  )

  const showAbout = ref(false)
  const showManual = ref(false)
  const settingsOpen = ref(false)
  const sessionsOpen = ref(false)
  const pickerOpen = ref(false)
  const manualError = ref('')
  const sessionCount = ref(0)

  const manualMidi = ref<number[]>([60, 64, 67, 71])
  const validMidiRange = Array.from({ length: MIDI_MAX - MIDI_MIN + 1 }, (_, i) => MIDI_MIN + i)

  const pickerButtons = [
    {
      text: 'done',
      role: 'confirm',
      handler: () => {
        pickerOpen.value = false
        return true
      },
    },
  ]

  onMounted(() => {
    sessionCount.value = listSessions().length
  })

  function openPicker() {
    pickerOpen.value = true
    showManual.value = true
  }

  function openSessions() {
    sessionCount.value = listSessions().length
    sessionsOpen.value = true
  }

  function onColumnChange(voiceIndex: number, event: CustomEvent) {
    manualMidi.value[voiceIndex] = event.detail.value
  }

  async function startRandom() {
    await init(settingsStore.instrument)
    sequenceStore.randomStart(settingsStore.voiceCount)
    router.push('/session')
  }

  async function loadSession(session: SavedSession) {
    sessionsOpen.value = false
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
      manualError.value = `invalid cluster — spread too wide (max ${MAX_CLUSTER_SPREAD} semitones)`
      return
    }

    await init(settingsStore.instrument)
    sequenceStore.start(sorted)
    router.push('/session')
  }
</script>

<style>
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
    transition: border-color 0.15s, color 0.15s;
    z-index: 10;
  }
  .about-btn:hover {
    border-color: var(--color-text-dim);
    color: var(--color-text);
  }

  .home-layout {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    max-width: 420px;
    margin: 0 auto;
    padding-top: 4rem;
  }

  /* Title */
  .title-block { text-align: center; }

  .app-title {
    font-family: var(--font-serif);
    font-size: 3.2rem;
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

  /* Trigger rows */
  .secondary-block {
    display: flex;
    flex-direction: column;
    gap: 1px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
  }

  .trigger-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.95rem 1rem;
    background: var(--color-surface);
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    width: 100%;
    text-align: left;
    min-height: 52px;
  }
  .trigger-row:hover { background: rgba(255,255,255,0.03); }
  .trigger-row + .trigger-row { border-top: 1px solid var(--color-border); }

  .trigger-label {
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-text-dim);
    flex-shrink: 0;
    white-space: nowrap;
    width: 5.5rem;
  }

  .trigger-value {
    font-size: 0.85rem;
    color: var(--color-text);
    font-family: 'SF Mono', 'Fira Code', monospace;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .trigger-hint-main {
    font-size: 0.85rem;
    color: var(--color-text);
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .trigger-hint-sub {
    font-size: 0.62rem;
    color: var(--color-text-dim);
    letter-spacing: 0.08em;
    font-family: inherit;
    flex-shrink: 0;
  }

  .trigger-arrow {
    font-size: 0.9rem;
    color: var(--color-text-dim);
    flex-shrink: 0;
  }

  .preview-note {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.85rem;
  }

  /* Primary button */
  .start-block { width: 100%; }

  .start-btn {
    width: 100%;
    border-radius: 12px;
    font-size: 1rem;
    letter-spacing: 0.1em;
    padding: 1rem;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    background: var(--color-accent);
    border: none;
    color: #f2eee3;
    font-weight: 500;
  }
  .start-btn:hover { opacity: 0.88; }

  .error-msg {
    font-size: 0.75rem;
    color: #e07878;
    margin: 0;
    text-align: center;
  }

  /* Settings sheet */
  .sheet-content {
    padding: 1.5rem 1.5rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .sheet-title {
    font-family: var(--font-serif);
    font-size: 1.1rem;
    font-weight: 300;
    font-style: italic;
    color: var(--color-text-dim);
    margin: 0;
    letter-spacing: 0.06em;
  }

  .sheet-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sheet-label {
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-text-dim);
    margin: 0 0 0.25rem;
  }

  /* Stacked full-width option buttons */
  .option-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .option-btn {
    width: 100%;
    background: var(--color-surface);
    border: none;
    border-radius: 0;
    color: var(--color-text-dim);
    font-size: 0.95rem;
    padding: 0.85rem 1rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
    text-align: left;
    min-height: 48px;
  }
  .option-btn + .option-btn { border-top: 1px solid var(--color-border); }
  .option-btn:hover { background: rgba(255,255,255,0.03); }
  .option-btn.active {
    color: var(--voice-1);
    background: rgba(126, 184, 212, 0.1);
    border-left: 2px solid var(--voice-1);
  }
</style>

<!-- Global picker overrides — scoped styles can't reach shadow DOM -->
<style>
  ion-picker {
    --background: var(--color-bg);
  }
  ion-picker::part(backdrop) {
    opacity: 0.5;
  }
  .picker-before,
  .picker-after {
    opacity: 0.6 !important;
        background: linear-gradient(to bottom, rgba(var(--fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb))), 1) 20%, rgba(var(--fade-background-rgb, var(--background-rgb, var(--ion-background-color-rgb))), 0.6) 100%) !important;

  }
  ion-picker ion-picker-column-option.option-selected {
    font-weight: 500;
  }
</style>

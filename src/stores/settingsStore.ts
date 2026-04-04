import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type VoiceCount = 3 | 4
export type MovementSize = 'half' | 'step' | 'whole' | 'third' | 'free'
export type KeyLockMode = 'free' | 'diatonic' | 'modal'
export type LoopMode = 'auto' | 'manual' | 'capped'
export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'random' | 'chord'
export type InstrumentType = 'piano' | 'harp' | 'guitar-acoustic' | 'guitar-nylon' | 'cello' | 'violin'

export const useSettingsStore = defineStore('settings', () => {
  const voiceCount = ref<VoiceCount>(3)
  const movementSize = ref<MovementSize>('step')
  const keyLockMode = ref<KeyLockMode>('free')
  const keyRoot = ref<number>(60)    // MIDI C4
  const scaleId = ref<string>('major')
  const loopMode = ref<LoopMode>('auto')
  const maxMoves = ref<number>(32)   // cap for 'capped' loop mode
  const arpeggioDirection = ref<ArpeggioDirection>('up')
  const instrument = ref<InstrumentType>('harp')
  const tempo = ref<number>(80)      // BPM

  const keyLockActive = computed(() => keyLockMode.value !== 'free')

  function setVoiceCount(n: VoiceCount) { voiceCount.value = n }
  function setMovementSize(m: MovementSize) { movementSize.value = m }
  function setKeyLockMode(mode: KeyLockMode) { keyLockMode.value = mode }
  function setKeyRoot(midi: number) { keyRoot.value = midi }
  function setScaleId(id: string) { scaleId.value = id }
  function setLoopMode(mode: LoopMode) { loopMode.value = mode }
  function setMaxMoves(n: number) { maxMoves.value = n }
  function setTempo(bpm: number) { tempo.value = Math.min(200, Math.max(40, bpm)) }
  function setArpeggioDirection(d: ArpeggioDirection) { arpeggioDirection.value = d }
  function setInstrument(i: InstrumentType) { instrument.value = i }

  return {
    voiceCount,
    movementSize,
    keyLockMode,
    keyRoot,
    scaleId,
    loopMode,
    maxMoves,
    arpeggioDirection,
    instrument,
    tempo,
    keyLockActive,
    setVoiceCount,
    setMovementSize,
    setKeyLockMode,
    setKeyRoot,
    setScaleId,
    setLoopMode,
    setMaxMoves,
    setTempo,
    setArpeggioDirection,
    setInstrument,
  }
})

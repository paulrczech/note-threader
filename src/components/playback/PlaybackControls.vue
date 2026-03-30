<template>
  <div class="playback-controls">
    <button
      v-if="!isPlaying"
      class="ctrl-btn play"
      :disabled="sequenceLength < 2"
      @click="$emit('play')"
    >
      ▶ loop
    </button>
    <button
      v-else
      class="ctrl-btn stop"
      @click="$emit('stop')"
    >
      ■ stop
    </button>

    <button
      class="ctrl-btn secondary"
      :disabled="sequenceLength < 1"
      @click="$emit('playOnce')"
    >
      play once
    </button>

    <div class="octave-btns">
      <button
        class="ctrl-btn octave"
        :disabled="!canOctaveUp"
        @click="$emit('octaveUp')"
        title="octave up"
      >+12</button>
      <button
        class="ctrl-btn octave"
        :disabled="!canOctaveDown"
        @click="$emit('octaveDown')"
        title="octave down"
      >−12</button>
    </div>
  </div>

</template>

<script setup lang="ts">
defineProps<{
  isPlaying: boolean
  sequenceLength: number
  canOctaveUp: boolean
  canOctaveDown: boolean
}>()

defineEmits<{
  play: []
  stop: []
  playOnce: []
  octaveUp: []
  octaveDown: []
}>()
</script>

<style scoped>
.playback-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
}

.ctrl-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  font-family: inherit;
}

.ctrl-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.ctrl-btn.play:not(:disabled):hover,
.ctrl-btn.stop:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.ctrl-btn.stop {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.ctrl-btn.secondary {
  color: var(--color-text-dim);
  font-size: 0.7rem;
}

.ctrl-btn.secondary:not(:disabled):hover {
  color: var(--color-text);
  border-color: var(--color-text-dim);
}

.octave-btns {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
  padding-left: 0.5rem;
  border-left: 1px solid var(--color-border);
}

.ctrl-btn.octave {
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  padding: 0.45rem 0.55rem;
  color: var(--color-text-dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.ctrl-btn.octave:not(:disabled):hover {
  border-color: var(--color-text-dim);
  color: var(--color-text);
}
</style>

<template>
  <ion-modal :is-open="isOpen" @did-dismiss="$emit('close')" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 1]">
    <ion-content class="ion-padding">
      <div class="about-layout">

        <div class="about-header">
          <h2 class="about-title">note threader</h2>
          <p class="about-sub">a voice leading instrument</p>
        </div>

        <div class="about-body">
          <p>
            Note Threader is built around a simple idea: instead of choosing chords,
            you move individual voices. Each note in your cluster is an independent
            line. The app suggests where those lines can go next — you decide which
            path to take.
          </p>
          <p>
            The moves are guided by <em>oblique strategies</em> — poetic constraints
            that push you away from your habits. Hold the dissonant note. Let the
            bass contradict the top. Move everything by a half step. The constraint
            is the instrument.
          </p>
          <p>
            This approach comes from how Chopin moved through harmony — not by
            naming chords but by sliding single voices in small intervals, letting
            the chord quality emerge as a byproduct. The result is movement that
            feels inevitable without being predictable.
          </p>
          <p>
            There are no wrong answers here. Export what you find to a DAW and
            decide what it means later.
          </p>
        </div>

        <button class="close-btn" @click="$emit('close')">close</button>

      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonContent } from '@ionic/vue'

defineProps<{ isOpen: boolean }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.about-layout {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 1rem 0 2rem;
  max-width: 480px;
  margin: 0 auto;
}

.about-header { text-align: center; }

.about-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--color-text);
  margin: 0 0 0.3rem;
}

.about-sub {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
  font-style: italic;
  margin: 0;
}

.about-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.about-body p {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--color-text);
  margin: 0;
}

.about-body em {
  font-style: italic;
  color: var(--color-accent);
}

.close-btn {
  align-self: center;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-dim);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  padding: 0.45rem 1.2rem;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, color 0.15s;
}
.close-btn:hover {
  border-color: var(--color-text-dim);
  color: var(--color-text);
}
</style>

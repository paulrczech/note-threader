<template>
  <ion-modal
    :is-open="isOpen"
    @did-dismiss="$emit('close')"
    :initial-breakpoint="0.6"
    :breakpoints="[0, 0.6, 1]">
    <ion-content class="ion-padding">
      <div class="about-layout">
        <div class="about-header">
          <h2 class="about-title">eddy</h2>
          <p class="about-sub">let the music move itself</p>
        </div>

        <div class="about-body">
          <p>
            Set your notes in motion. With every turn, a strategy guides the
            voices. Sometimes shifting one, sometimes drifting all.
          </p>
          <p>
            Forget the names of chords. Here, harmony emerges as a byproduct of
            small, organic movements - feeling inevitable without being
            predictable.
          </p>
          <p>
            No wrong answers. Just a natural course to follow. Find your flow,
            then export the discovery.
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

  .about-header {
    text-align: center;
  }

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
    transition:
      border-color 0.15s,
      color 0.15s;
  }
  .close-btn:hover {
    border-color: var(--color-text-dim);
    color: var(--color-text);
  }
</style>

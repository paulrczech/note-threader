<template>
  <svg
    class="note-glyph"
    :class="{ active }"
    :viewBox="type === 'triplet' ? '0 0 28 22' : '0 0 14 20'"
    xmlns="http://www.w3.org/2000/svg">
    <template v-if="type === 'half'">
      <ellipse cx="4" cy="16" rx="3.2" ry="2.3" transform="rotate(-20 4 16)"
        fill="none" stroke="currentColor" stroke-width="1.3" />
      <line x1="7" y1="15" x2="7" y2="2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
    </template>

    <template v-else-if="type === 'quarter'">
      <ellipse cx="4" cy="16" rx="3.2" ry="2.3" transform="rotate(-20 4 16)" fill="currentColor" />
      <line x1="7" y1="15" x2="7" y2="2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
    </template>

    <template v-else-if="type === 'eighth'">
      <ellipse cx="4" cy="16" rx="3.2" ry="2.3" transform="rotate(-20 4 16)" fill="currentColor" />
      <line x1="7" y1="15" x2="7" y2="2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      <path d="M7,2 Q11,3.5 8.3,8.5 Q9.2,4.5 7,4 Z" fill="currentColor" />
    </template>

    <template v-else-if="type === 'sixteenth'">
      <ellipse cx="4" cy="16" rx="3.2" ry="2.3" transform="rotate(-20 4 16)" fill="currentColor" />
      <line x1="7" y1="15" x2="7" y2="2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      <path d="M7,2 Q11,3.5 8.3,8.5 Q9.2,4.5 7,4 Z" fill="currentColor" />
      <path d="M7,6.5 Q11,8 8.3,13 Q9.2,9 7,8.5 Z" fill="currentColor" />
    </template>

    <template v-else-if="type === 'triplet'">
      <ellipse cx="4" cy="18" rx="2.6" ry="2" fill="currentColor" />
      <ellipse cx="13" cy="18" rx="2.6" ry="2" fill="currentColor" />
      <ellipse cx="22" cy="18" rx="2.6" ry="2" fill="currentColor" />
      <line x1="6.6" y1="17.3" x2="6.6" y2="6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      <line x1="15.6" y1="17.3" x2="15.6" y2="6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      <line x1="24.6" y1="17.3" x2="24.6" y2="6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
      <line x1="6.6" y1="6" x2="24.6" y2="6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <text x="15.6" y="4.5" text-anchor="middle" font-size="4.5" fill="currentColor">3</text>
    </template>
  </svg>
</template>

<script setup lang="ts">
  defineProps<{
    type: 'half' | 'quarter' | 'eighth' | 'triplet' | 'sixteenth'
    active?: boolean
  }>()
</script>

<style scoped>
  .note-glyph {
    display: block;
    height: 20px;
    width: auto;
    color: var(--color-text-dim);
    transition: color 0.15s;
  }
  .note-glyph.active {
    color: var(--color-accent);
  }
</style>

<template>
  <div v-if="sessions.length > 0" class="saved-sessions">
    <p class="section-label">saved sessions</p>
    <div class="session-list">
      <div v-for="s in sessions" :key="s.id" class="session-row">
        <div class="session-load" :class="{ editing: editingId === s.id }">
          <!-- Name edit input -->
          <input
            v-if="editingId === s.id"
            :ref="el => { if (el) editInputs[s.id] = el as HTMLInputElement }"
            class="session-name-input"
            v-model="editName"
            @keydown.enter="commitRename(s.id)"
            @keydown.escape="cancelRename"
            @blur="commitRename(s.id)"
          />

          <!-- Normal row — click name to edit, click elsewhere to load -->
          <template v-else>
            <span
              class="session-name"
              @click.stop="startRename(s)"
              title="tap to rename"
            >{{ s.name }}</span>
            <button class="session-load-btn" @click="$emit('load', s)">
              <span class="session-meta">{{ s.sequence.length }} clusters · {{ s.voiceCount }}v ›</span>
            </button>
          </template>
        </div>

        <button class="session-delete" @click="remove(s.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { listSessions, deleteSession, renameSession, type SavedSession } from '../../utils/sessionStorage'

const emit = defineEmits<{ load: [session: SavedSession] }>()

const sessions = ref<SavedSession[]>([])
const editingId = ref<string | null>(null)
const editName = ref('')
const editInputs: Record<string, HTMLInputElement> = {}

onMounted(() => { sessions.value = listSessions() })

function remove(id: string) {
  deleteSession(id)
  sessions.value = listSessions()
}

function startRename(s: SavedSession) {
  editingId.value = s.id
  editName.value = s.name
  nextTick(() => {
    editInputs[s.id]?.select()
  })
}

function commitRename(id: string) {
  if (editingId.value !== id) return
  const trimmed = editName.value.trim()
  if (trimmed) {
    renameSession(id, trimmed)
    sessions.value = listSessions()
  }
  editingId.value = null
}

function cancelRename() {
  editingId.value = null
}
</script>

<style scoped>
.saved-sessions { width: 100%; }

.section-label {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 0.5rem;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.session-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.session-load {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  min-width: 0;
  transition: border-color 0.15s;
  gap: 0.4rem;
}
.session-load.editing {
  border-color: var(--color-accent);
}

.session-name {
  font-size: 0.8rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
  flex: 1;
  min-width: 0;
}
.session-name:hover {
  color: var(--color-accent);
}

.session-name-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: inherit;
  padding: 0;
  min-width: 0;
  width: 100%;
}

.session-load-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
}
.session-load-btn:hover .session-meta {
  color: var(--color-accent);
}

.session-meta {
  font-size: 0.65rem;
  color: var(--color-text-dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  transition: color 0.15s;
}

.session-delete {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-dim);
  width: 1.6rem;
  height: 1.6rem;
  font-size: 0.9rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
  font-family: inherit;
}
.session-delete:hover { border-color: #8b3030; color: #e07878; }
</style>

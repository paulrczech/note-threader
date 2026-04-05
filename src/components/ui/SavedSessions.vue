<template>
  <div class="saved-sessions">
    <p class="sheet-title">past flows</p>
    <p class="sheet-label">saved sessions</p>
    <div v-if="sessions.length === 0" class="empty-msg">no saved flows yet</div>
    <div v-else class="session-list">
      <div v-for="s in sessions" :key="s.id" class="session-row">
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

        <!-- Normal row -->
        <template v-else>
          <button class="session-load-btn" @click="$emit('load', s)">
            <span class="session-name" @click.stop="startRename(s)">{{ s.name }}</span>
            <span class="session-meta">{{ s.sequence.length }} clusters · {{ s.voiceCount }}v ›</span>
          </button>
          <button class="session-delete" @click="remove(s.id)">×</button>
        </template>
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
  nextTick(() => { editInputs[s.id]?.select() })
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
.saved-sessions { width: 100%; padding: .5rem; }

.section-label {
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 0.6rem;
}

.empty-msg {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  font-style: italic;
  padding: 1rem 0;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.session-row {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: none;
  min-height: 52px;
}
.session-row + .session-row { border-top: 1px solid var(--color-border); }

.session-load-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 0.85rem 1rem;
  cursor: pointer;
  font-family: inherit;
  min-width: 0;
  gap: 0.5rem;
  text-align: left;
}
.session-load-btn:hover .session-name { color: var(--voice-1); }

.session-name {
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  cursor: text;
  transition: color 0.15s;
}

.session-name-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 0.9rem;
  font-family: inherit;
  padding: 0.85rem 1rem;
  min-width: 0;
  width: 100%;
}

.sheet-title {
  margin-bottom: 1.5rem;
}
.sheet-label {
  margin-bottom: .75rem;
}

.session-meta {
  font-size: 0.72rem;
  color: var(--color-text-dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  flex-shrink: 0;
  transition: color 0.15s;
}
.session-load-btn:hover .session-meta { color: var(--voice-1); }

.session-delete {
  background: none;
  border: none;
  border-left: 1px solid var(--color-border);
  color: var(--color-text-dim);
  width: 2.8rem;
  align-self: stretch;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
  font-family: inherit;
}
.session-delete:hover { color: #e07878; background: rgba(224, 120, 120, 0.08); }
</style>

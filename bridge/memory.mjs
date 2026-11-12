import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Persistent memory, tasks and notes for JARVIS.
 *
 * Everything lives in one JSON file inside the agent's workspace
 * (`<workspace>/jarvis-memory.json`). No network, no database, no account.
 * Delete the file and JARVIS forgets everything.
 *
 * The file is read fresh on every call, so edits made by hand are honoured and
 * two browser tabs cannot overwrite each other with stale copies. Writes go
 * through a temp file and a rename, so a crash cannot leave half a file.
 */

const MAX_FACTS = 200
const MAX_TEXT = 500

const EMPTY = () => ({ facts: [], tasks: [], notes: [] })

let file = null

export function initMemory(workspace) {
  mkdirSync(workspace, { recursive: true })
  file = join(workspace, 'jarvis-memory.json')
}

function load() {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    return { ...EMPTY(), ...data }
  } catch {
    return EMPTY()
  }
}

function save(data) {
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, file)
}

const clip = (s) => String(s).trim().slice(0, MAX_TEXT)
const id = () => Math.random().toString(36).slice(2, 8)
const today = () => new Date().toISOString().slice(0, 10)
const ok = (text) => ({ content: [{ type: 'text', text }] })

/**
 * A short digest appended to the system prompt at the start of each session,
 * so JARVIS "remembers" without having to spend a tool call first.
 */
export function memoryDigest() {
  if (!file) return ''
  const m = load()
  const open = m.tasks.filter((t) => !t.done)
  const lines = []
  if (m.facts.length) {
    lines.push('O que você sabe sobre o usuário (memória persistente):')
    for (const f of m.facts.slice(-60)) lines.push(`- ${f.text}`)
  }
  if (open.length) {
    lines.push('Tarefas em aberto:')
    for (const t of open.slice(0, 30)) {
      lines.push(`- [${t.id}] ${t.text}${t.due ? ` (para ${t.due})` : ''}`)
    }
  }
  if (!lines.length) return ''
  return `\n\nMEMÓRIA\n${lines.join('\n')}\nUse as ferramentas memory_* e task_* para atualizar isso.`
}

export function memoryServer() {
  return createSdkMcpServer({
    name: 'jarvis_memory',
    version: '1.0.0',
    instructions:
      'Memória persistente, tarefas e notas do usuário, guardadas em arquivo local. ' +
      'Guarde fatos duradouros (preferências, nomes, rotinas) com memory_remember. ' +
      'Nunca guarde senhas, chaves ou dados financeiros.',
    alwaysLoad: true,
    tools: [
      tool(
        'memory_remember',
        'Guarda um fato duradouro sobre o usuário (preferência, nome, rotina). Uma frase curta. Nunca senhas ou chaves.',
        { fact: z.string().min(1) },
        async ({ fact }) => {
          const m = load()
          const text = clip(fact)
          if (!m.facts.some((f) => f.text.toLowerCase() === text.toLowerCase())) {
            m.facts.push({ id: id(), text, at: today() })
            m.facts = m.facts.slice(-MAX_FACTS)
            save(m)
          }
          return ok('Anotado.')
        },
      ),
      tool(
        'memory_recall',
        'Lista os fatos guardados, opcionalmente filtrando por uma palavra.',
        { query: z.string().optional() },
        async ({ query }) => {
          const q = query?.toLowerCase()
          const facts = load().facts.filter((f) => !q || f.text.toLowerCase().includes(q))
          return ok(facts.length ? facts.map((f) => `[${f.id}] ${f.text}`).join('\n') : 'Nada guardado.')
        },
      ),
      tool(
        'memory_forget',
        'Apaga um fato da memória pelo id (veja memory_recall).',
        { fact_id: z.string() },
        async ({ fact_id }) => {
          const m = load()
          const before = m.facts.length
          m.facts = m.facts.filter((f) => f.id !== fact_id)
          if (m.facts.length === before) return ok('Não encontrei esse id.')
          save(m)
          return ok('Esquecido.')
        },
      ),
      tool(
        'task_add',
        'Adiciona uma tarefa. due é opcional, formato livre (ex.: 2026-11-20 ou "sexta").',
        { text: z.string().min(1), due: z.string().optional() },
        async ({ text, due }) => {
          const m = load()
          const t = { id: id(), text: clip(text), due: due ? clip(due) : undefined, done: false, at: today() }
          m.tasks.push(t)
          save(m)
          return ok(`Tarefa ${t.id} adicionada.`)
        },
      ),
      tool(
        'task_list',
        'Lista as tarefas. Por padrão só as abertas; all=true inclui as concluídas.',
        { all: z.boolean().optional() },
        async ({ all }) => {
          const tasks = load().tasks.filter((t) => all || !t.done)
          return ok(
            tasks.length
              ? tasks.map((t) => `[${t.id}] ${t.done ? '✔ ' : ''}${t.text}${t.due ? ` (para ${t.due})` : ''}`).join('\n')
              : 'Nenhuma tarefa.',
          )
        },
      ),
      tool(
        'task_done',
        'Marca uma tarefa como concluída pelo id.',
        { task_id: z.string() },
        async ({ task_id }) => {
          const m = load()
          const t = m.tasks.find((x) => x.id === task_id)
          if (!t) return ok('Não encontrei esse id.')
          t.done = true
          t.doneAt = today()
          save(m)
          return ok('Concluída.')
        },
      ),
      tool(
        'note_add',
        'Guarda uma nota ou documento curto (ideia, resumo, lista). title + body.',
        { title: z.string().min(1), body: z.string().min(1) },
        async ({ title, body }) => {
          const m = load()
          m.notes.push({ id: id(), title: clip(title), body: String(body).slice(0, 5000), at: today() })
          save(m)
          return ok('Nota guardada.')
        },
      ),
      tool(
        'note_list',
        'Lista as notas (título e id), ou lê uma nota inteira se note_id for dado.',
        { note_id: z.string().optional() },
        async ({ note_id }) => {
          const notes = load().notes
          if (note_id) {
            const n = notes.find((x) => x.id === note_id)
            return ok(n ? `${n.title}\n\n${n.body}` : 'Não encontrei esse id.')
          }
          return ok(notes.length ? notes.map((n) => `[${n.id}] ${n.title} (${n.at})`).join('\n') : 'Nenhuma nota.')
        },
      ),
    ],
  })
}

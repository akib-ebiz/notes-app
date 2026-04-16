import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

type Theme = 'light' | 'dark'

function requireEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Create notes-app/.env.local (recommended) with ${name}="..."`,
    )
  }
  return value
}

function requireThemeEnv(name: string): Theme {
  const value = requireEnv(name)
  if (value !== 'light' && value !== 'dark') {
    throw new Error(`Invalid ${name}="${value}". Must be "light" or "dark".`)
  }
  return value
}

const NOTES_KEY = requireEnv('VITE_NOTES_STORAGE_KEY')
const THEME_KEY = requireEnv('VITE_THEME_STORAGE_KEY')
const DEFAULT_THEME = requireThemeEnv('VITE_DEFAULT_THEME')

function generateId() {
  if ('randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((n) => {
        const note = n as Partial<Note>
        if (!note.id || typeof note.id !== 'string') return null
        return {
          id: note.id,
          title: typeof note.title === 'string' ? note.title : '',
          content: typeof note.content === 'string' ? note.content : '',
          createdAt: typeof note.createdAt === 'number' ? note.createdAt : Date.now(),
          updatedAt: typeof note.updatedAt === 'number' ? note.updatedAt : Date.now(),
        } satisfies Note
      })
      .filter(Boolean) as Note[]
  } catch {
    return []
  }
}

function writeNotesToStorage(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

function readThemeFromStorage(): Theme | null {
  const t = localStorage.getItem(THEME_KEY)
  return t === 'light' || t === 'dark' ? t : null
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => readNotesFromStorage())
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readThemeFromStorage()
    if (saved) return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
      ? 'dark'
      : DEFAULT_THEME
  })

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState('')

  const titleRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    writeNotesToStorage(notes)
  }, [notes])

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!q) return list
    return list.filter((n) => {
      const hay = `${n.title}\n${n.content}`.toLowerCase()
      return hay.includes(q)
    })
  }, [notes, query])

  function resetComposer() {
    setTitle('')
    setContent('')
    titleRef.current?.focus()
  }

  function addNote() {
    const t = title.trim()
    const c = content.trim()
    if (!t && !c) return

    const now = Date.now()
    const note: Note = {
      id: generateId(),
      title: t,
      content: c,
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [note, ...prev])
    resetComposer()
  }

  function startEdit(note: Note) {
    setEditingId(note.id)
    setEditingTitle(note.title)
    setEditingContent(note.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingTitle('')
    setEditingContent('')
  }

  function saveEdit(id: string) {
    const t = editingTitle.trim()
    const c = editingContent.trim()
    if (!t && !c) {
      deleteNote(id)
      cancelEdit()
      return
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: t,
              content: c,
              updatedAt: Date.now(),
            }
          : n,
      ),
    )
    cancelEdit()
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  function clearAll() {
    setNotes([])
    cancelEdit()
  }

  const total = notes.length
  const showing = filteredNotes.length
  const appName = requireEnv('VITE_APP_NAME')

  return (
    <div className="app">
      <header className="header">
        <div className="header__title">
          <h1>{appName}</h1>
          <p className="muted">
            {showing} shown / {total} total
          </p>
        </div>

        <div className="header__actions">
          <label className="field field--search" aria-label="Search notes">
            <span className="field__label">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or content…"
              type="search"
              autoComplete="off"
            />
          </label>

          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? 'Light' : 'Dark'} mode
          </button>

          <button
            className="btn btn--danger"
            type="button"
            onClick={clearAll}
            disabled={notes.length === 0}
            title="Deletes all notes"
          >
            Clear all
          </button>
        </div>
      </header>

      <main className="main">
        <section className="composer" aria-label="Add a note">
          <div className="card">
            <div className="card__header">
              <h2>New note</h2>
              <p className="muted">Saved automatically in your browser.</p>
            </div>

            <div className="card__body">
              <label className="field">
                <span className="field__label">Title</span>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Meeting notes, shopping list…"
                  maxLength={120}
                />
              </label>

              <label className="field">
                <span className="field__label">Note</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something…"
                  rows={6}
                />
              </label>

              <div className="row">
                <button className="btn" type="button" onClick={addNote}>
                  Add note
                </button>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={resetComposer}
                  disabled={!title && !content}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="list" aria-label="Notes list">
          {filteredNotes.length === 0 ? (
            <div className="empty card">
              <div className="card__body">
                <h2>No notes</h2>
                <p className="muted">
                  {notes.length === 0
                    ? 'Add your first note on the left.'
                    : 'No notes match your search.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid">
              {filteredNotes.map((note) => {
                const isEditing = editingId === note.id
                const date = new Date(note.updatedAt).toLocaleString()

                return (
                  <article key={note.id} className="card note">
                    <div className="card__header">
                      <div>
                        <h2 className="note__title">
                          {isEditing ? 'Editing…' : note.title || 'Untitled'}
                        </h2>
                        <p className="muted">Updated: {date}</p>
                      </div>

                      <div className="row row--tight">
                        {isEditing ? (
                          <>
                            <button
                              className="btn"
                              type="button"
                              onClick={() => saveEdit(note.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn--ghost"
                              type="button"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn--ghost"
                              type="button"
                              onClick={() => startEdit(note)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn--danger"
                              type="button"
                              onClick={() => deleteNote(note.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card__body">
                      {isEditing ? (
                        <div className="stack">
                          <label className="field">
                            <span className="field__label">Title</span>
                            <input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              maxLength={120}
                            />
                          </label>
                          <label className="field">
                            <span className="field__label">Note</span>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={6}
                            />
                          </label>
                          <p className="muted">
                            Tip: If you save with both title and note empty, it will delete
                            the note.
                          </p>
                        </div>
                      ) : (
                        <p className="note__content">
                          {note.content ? note.content : <span className="muted">No content</span>}
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="muted">
          Built with React + Vite. Data lives in <code>localStorage</code> (no backend).
        </p>
      </footer>
    </div>
  )
}

export default App

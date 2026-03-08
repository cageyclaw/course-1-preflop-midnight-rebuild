import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import './App.css'

type Chapter = {
  id: string
  title: string
  file: string
}

const chapters: Chapter[] = [
  { id: 'A1', title: 'A1 — Introduction', file: 'A1.md' },
  { id: 'A2', title: 'A2 — Starting Hands', file: 'A2.md' },
  { id: 'A3', title: 'A3 — Position Basics', file: 'A3.md' },
  { id: 'A4', title: 'A4 — Open Sizes', file: 'A4.md' },
  { id: 'A5', title: 'A5 — 3-Bet Strategy', file: 'A5.md' },
  { id: 'A6', title: 'A6 — 4-Bet Concepts', file: 'A6.md' },
  { id: 'A7', title: 'A7 — Recap & Next Steps', file: 'A7.md' },
]

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [contentHtml, setContentHtml] = useState('<p>Loading…</p>')

  const current = useMemo(() => chapters[currentIndex], [currentIndex])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch(`/course-md/${current.file}`)
        const text = await res.text()
        const html = (await marked.parse(text)) as string
        if (isMounted) setContentHtml(html)
      } catch (err) {
        if (isMounted)
          setContentHtml(
            '<p>Failed to load chapter. Check the markdown path.</p>'
          )
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [current])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">Course 1 — Preflop</div>
          <div className="brand-sub">Chapters A1–A7</div>
        </div>
        <nav className="nav">
          {chapters.map((chapter, idx) => (
            <button
              key={chapter.id}
              className={`nav-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <span className="nav-id">{chapter.id}</span>
              <span className="nav-title">{chapter.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>{current.title}</h1>
          <div className="content-meta">{current.id}</div>
        </header>

        <article
          className="markdown"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <div className="pager">
          <button
            className="pager-btn"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>
          <button
            className="pager-btn"
            onClick={() =>
              setCurrentIndex((i) => Math.min(chapters.length - 1, i + 1))
            }
            disabled={currentIndex === chapters.length - 1}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  )
}

export default App

import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import './App.css'

type Chapter = {
  id: string
  title: string
  type: 'markdown' | 'drill'
  file?: string
  drillId?: string
}

type DrillQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

type DrillData = {
  title: string
  intro: string
  questions: DrillQuestion[]
}

const drillBank: Record<string, DrillData> = {
  d1: {
    title: 'Hand Selection Warmup',
    intro:
      'Pick the best starting hands for the spot. Focus on position and basic hand strength.',
    questions: [
      {
        id: 'd1-q1',
        prompt:
          'You are UTG in a 9-handed game. Which hand is the best standard open? ',
        choices: ['KJo', 'A9o', '77', 'Q9s'],
        correctIndex: 2,
        explanation:
          'UTG ranges are tight. Pocket pairs like 77 are in; offsuit broadways like KJo/A9o are too loose.',
      },
      {
        id: 'd1-q2',
        prompt:
          'You are on the Button. Which hand is a clear open-raise?',
        choices: ['T7o', 'A2s', '95o', 'K2o'],
        correctIndex: 1,
        explanation:
          'The Button opens much wider. A2s plays well with position and suitedness.',
      },
      {
        id: 'd1-q3',
        prompt:
          'You are in the Cutoff. What is the best open?',
        choices: ['A5s', 'J8o', '64s', 'Q6o'],
        correctIndex: 0,
        explanation:
          'A5s is a strong semi-bluff candidate with good playability in late position.',
      },
      {
        id: 'd1-q4',
        prompt:
          'You are in the Small Blind, folded to you. What is the best option?',
        choices: ['Complete with 86s', 'Open-raise with ATo', 'Fold K9s', 'Limp with QTs'],
        correctIndex: 1,
        explanation:
          'When folded to in the SB, you can open-raise a wide range. ATo is a clear raise.',
      },
    ],
  },
  d2: {
    title: 'Position & Action',
    intro:
      'Decide the best move based on position and prior action.',
    questions: [
      {
        id: 'd2-q1',
        prompt:
          'You are in the Hijack. UTG opens 2.5bb. You have AQs. What is the best default?',
        choices: ['Call', '3-bet', 'Fold', 'Jam'],
        correctIndex: 1,
        explanation:
          'AQs plays well as a 3-bet versus an UTG open in most games.',
      },
      {
        id: 'd2-q2',
        prompt:
          'You are in the Big Blind. Button opens 2.5bb. You hold JTs. Best option?',
        choices: ['Call', 'Fold', '3-bet', 'Jam'],
        correctIndex: 0,
        explanation:
          'JTs is a strong defend vs late-position opens; calling keeps dominated hands in.',
      },
      {
        id: 'd2-q3',
        prompt:
          'You are on the Button. Cutoff opens 2.5bb. You have KQo. Best default?',
        choices: ['Fold', 'Call', '3-bet', 'Jam'],
        correctIndex: 2,
        explanation:
          'KQo is strong enough to 3-bet in position versus a CO open.',
      },
      {
        id: 'd2-q4',
        prompt:
          'You are in the Small Blind. Button opens 2.5bb. You have 99. Best option?',
        choices: ['Call', '3-bet', 'Fold', 'Jam'],
        correctIndex: 1,
        explanation:
          'In the SB you are out of position. 99 is strong enough to 3-bet for value.',
      },
    ],
  },
  d3: {
    title: '3-Bet vs 4-Bet Decisions',
    intro:
      'Make fast calls on 3-bet and 4-bet spots.',
    questions: [
      {
        id: 'd3-q1',
        prompt:
          'You 3-bet from the Button with AJs. The Cutoff 4-bets small. Best default?',
        choices: ['Fold', 'Call', '5-bet jam', 'Min-raise'],
        correctIndex: 1,
        explanation:
          'AJs can call small 4-bets in position depending on sizing; it plays well postflop.',
      },
      {
        id: 'd3-q2',
        prompt:
          'You 3-bet from the SB with QQ vs Button open. Button 4-bets. Best action?',
        choices: ['Fold', 'Call', '5-bet jam', 'Min-raise'],
        correctIndex: 2,
        explanation:
          'QQ is a premium; out of position you usually go for the 5-bet jam/stack off.',
      },
      {
        id: 'd3-q3',
        prompt:
          'You open CO with 98s. Button 3-bets large. Best default?',
        choices: ['Fold', 'Call', '4-bet bluff', 'Jam'],
        correctIndex: 0,
        explanation:
          'Large 3-bets reduce implied odds. 98s is too weak to continue versus big sizing.',
      },
      {
        id: 'd3-q4',
        prompt:
          'You open UTG with AKs. Button 3-bets. Best default?',
        choices: ['Call', 'Fold', '4-bet for value', 'Jam only'],
        correctIndex: 2,
        explanation:
          'AKs is a clear 4-bet value hand.',
      },
    ],
  },
  d4: {
    title: 'Sizing & Frequencies',
    intro:
      'Confirm your grasp of standard open sizes and ranges.',
    questions: [
      {
        id: 'd4-q1',
        prompt:
          'Standard cash game open sizing in most positions is:',
        choices: ['2–2.5bb', '4–5bb', '6–7bb', '1bb'],
        correctIndex: 0,
        explanation:
          'Modern ranges favor 2–2.5bb opens for better risk/reward.',
      },
      {
        id: 'd4-q2',
        prompt:
          'Which hand is usually a 3-bet bluff candidate from the Button vs CO?',
        choices: ['A5s', 'K9o', 'J2o', '76o'],
        correctIndex: 0,
        explanation:
          'A5s blocks strong hands and has playability, making it a common bluff 3-bet.',
      },
      {
        id: 'd4-q3',
        prompt:
          'When in the Big Blind vs Button open, you should defend:',
        choices: ['Very tight', 'Very wide', 'Only premium hands', 'Only suited aces'],
        correctIndex: 1,
        explanation:
          'You have great pot odds; BB defense is typically wide versus Button opens.',
      },
      {
        id: 'd4-q4',
        prompt:
          'A solid 4-bet value range usually starts around:',
        choices: ['A2s', 'TT+', '22+', 'KTo'],
        correctIndex: 1,
        explanation:
          'Most 4-bet value ranges start around TT+/AQ+/AK depending on positions.',
      },
    ],
  },
}

const chapters: Chapter[] = [
  { id: 'A1', title: 'RFI (Raise First In)', type: 'markdown', file: 'A1.md' },
  { id: 'A2', title: '3-Bet Strategy', type: 'markdown', file: 'A2.md' },
  { id: 'A3', title: 'Facing a 3-Bet', type: 'markdown', file: 'A3.md' },
  { id: 'A4', title: 'Blind Defense (SB/BB)', type: 'markdown', file: 'A4.md' },
  { id: 'A5', title: 'Isolation (ISO) Raising & Sizing', type: 'markdown', file: 'A5.md' },
  { id: 'A6', title: 'Stack Depth (Shallow vs Deep)', type: 'markdown', file: 'A6.md' },
  { id: 'A7', title: '30-Day Preflop Plan', type: 'markdown', file: 'A7.md' },
  { id: 'D1', title: 'Hand Selection Drill', type: 'drill', drillId: 'd1' },
  { id: 'D2', title: 'Position Drill', type: 'drill', drillId: 'd2' },
  { id: 'D3', title: '3-Bet / 4-Bet Drill', type: 'drill', drillId: 'd3' },
  { id: 'D4', title: 'Sizing & Frequency Drill', type: 'drill', drillId: 'd4' },
]

const storageKey = 'course-1-preflop-drills'

type DrillProgress = {
  answers: Record<string, number>
  lastUpdated: string
}

type DrillStore = Record<string, DrillProgress>

function Drill({ drillId }: { drillId: string }) {
  const drill = drillBank[drillId]
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(false)
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      setAnswers({})
      setHydrated(true)
      return
    }
    try {
      const parsed = JSON.parse(stored) as DrillStore
      const entry = parsed[drillId]
      setAnswers(entry?.answers ?? {})
    } catch {
      setAnswers({})
    } finally {
      setHydrated(true)
    }
  }, [drillId])

  useEffect(() => {
    if (!hydrated) return
    const stored = localStorage.getItem(storageKey)
    let parsed: DrillStore = {}
    if (stored) {
      try {
        parsed = JSON.parse(stored) as DrillStore
      } catch {
        parsed = {}
      }
    }
    const next: DrillStore = {
      ...parsed,
      [drillId]: {
        answers,
        lastUpdated: new Date().toISOString(),
      },
    }
    localStorage.setItem(storageKey, JSON.stringify(next))
  }, [answers, drillId, hydrated])

  const score = drill.questions.reduce((total, q) => {
    if (answers[q.id] === q.correctIndex) return total + 1
    return total
  }, 0)

  const answeredCount = drill.questions.filter(
    (q) => answers[q.id] !== undefined
  ).length

  const completed = answeredCount === drill.questions.length

  const handleReset = () => {
    setAnswers({})
  }

  return (
    <section className="drill">
      <div className="drill-card">
        <h2>{drill.title}</h2>
        <p className="drill-intro">{drill.intro}</p>
        <div className="drill-meta">
          <div className="drill-score">
            Score: <strong>{score}</strong> / {drill.questions.length}
          </div>
          <div className="drill-score">
            Answered: <strong>{answeredCount}</strong> / {drill.questions.length}
          </div>
          <button className="drill-reset" onClick={handleReset}>
            Reset Drill
          </button>
        </div>
      </div>

      <div className="drill-questions">
        {drill.questions.map((q, idx) => {
          const selected = answers[q.id]
          const isCorrect = selected === q.correctIndex
          const isAnswered = selected !== undefined
          const status = isAnswered ? (isCorrect ? 'green' : 'red') : 'yellow'

          return (
            <div key={q.id} className="question-card">
              <div className="question-header">
                <span className={`stoplight ${status}`} />
                <div className="question-title">
                  Q{idx + 1}. {q.prompt}
                </div>
              </div>
              <div className="question-choices">
                {q.choices.map((choice, choiceIndex) => {
                  const isSelected = selected === choiceIndex
                  const isChoiceCorrect = choiceIndex === q.correctIndex
                  const choiceClass = isAnswered
                    ? isSelected
                      ? isChoiceCorrect
                        ? 'choice correct'
                        : 'choice incorrect'
                      : isChoiceCorrect
                        ? 'choice correct'
                        : 'choice'
                    : isSelected
                      ? 'choice selected'
                      : 'choice'

                  return (
                    <button
                      key={choice}
                      className={choiceClass}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: choiceIndex,
                        }))
                      }
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
              {isAnswered && (
                <div className={`feedback ${isCorrect ? 'good' : 'bad'}`}>
                  {isCorrect ? 'Correct.' : 'Not quite.'} {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {completed && (
        <div className="drill-summary">
          <h3>Drill Summary</h3>
          <p>
            You finished {drill.title}. Final score:{' '}
            <strong>
              {score} / {drill.questions.length}
            </strong>
            .
          </p>
          <p className="drill-summary-note">
            Green lights = nailed it. Red lights = review that spot. Yellow
            lights mean unanswered.
          </p>
        </div>
      )}
    </section>
  )
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [contentHtml, setContentHtml] = useState('<p>Loading…</p>')

  const current = useMemo(() => chapters[currentIndex], [currentIndex])

  useEffect(() => {
    if (current.type !== 'markdown') return
    let isMounted = true
    const load = async () => {
      try {
        const base = import.meta.env.BASE_URL ?? '/'
        // Avoid stale markdown after deploy (GitHub Pages can be aggressively cached)
        const v = import.meta.env.VITE_BUILD_ID
        const qs = v ? `?v=${encodeURIComponent(String(v))}` : ''
        const res = await fetch(`${base}course-md/${current.file}${qs}`, {
          cache: 'no-store',
        })
        let text = await res.text()
        // Safety: strip internal chapter codes from markdown headings if any slip through
        // Examples: "# A1 — Title" / "## D3 — Drill" etc.
        text = text.replace(/^(#{1,6})\s*[A-D]\d+\s*[—-]\s*/gim, '$1 ')
        const html = (await marked.parse(text)) as string
        if (isMounted) setContentHtml(html)
      } catch {
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
          <div className="brand-sub">Chapters + Drills</div>
        </div>
        <nav className="nav">
          {chapters.map((chapter, idx) => (
            <button
              key={chapter.id}
              className={`nav-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <span className="nav-title">{chapter.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>{current.title}</h1>
        </header>

        {current.type === 'markdown' ? (
          <article
            className="markdown"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <Drill drillId={current.drillId ?? 'd1'} />
        )}

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

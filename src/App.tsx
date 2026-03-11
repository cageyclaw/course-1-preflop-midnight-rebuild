import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import './App.css'
import './visuals/visuals.css'

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

const quizBank: Record<string, DrillData> = {
  A1: {
    title: 'Chapter Quiz: RFI Fundamentals',
    intro:
      'Lock in the RFI defaults: position, sizing, and bottom-of-range discipline.',
    questions: [
      {
        id: 'a1-q1',
        prompt: 'Default RFI open size in this course is:',
        choices: ['3.5x', '4x', '2.5x', 'Size by hand strength'],
        correctIndex: 2,
        explanation: 'The baseline RFI size is 2.5x unless a lesson says otherwise.',
      },
      {
        id: 'a1-q2',
        prompt: 'RFI sizing discipline means you:',
        choices: [
          'Go bigger with strong hands',
          'Use the same open size for your whole range',
          'Min-raise only on the Button',
          'Size by table vibe',
        ],
        correctIndex: 1,
        explanation: 'Consistent sizing keeps your range protected and avoids tells.',
      },
      {
        id: 'a1-q3',
        prompt: 'True or False: The Small Blind is a “discount Button.”',
        choices: ['False', 'True'],
        correctIndex: 0,
        explanation: 'False. The SB is out of position and should open tighter than the BTN.',
      },
      {
        id: 'a1-q4',
        prompt: 'A strong filter for choosing opens is whether the hand is:',
        choices: [
          'Pretty and suited',
          'Any two cards in position',
          'Only premiums',
          'Defendable vs a 3-bet and playable',
        ],
        correctIndex: 3,
        explanation: 'If a hand can’t comfortably continue versus pressure, it’s usually too thin to open.',
      },
    ],
  },
  A2: {
    title: 'Chapter Quiz: 3-Bet Strategy',
    intro:
      'Confirm your 3-bet logic: value vs pressure, range shape, and sizing discipline.',
    questions: [
      {
        id: 'a2-q1',
        prompt: 'You 3-bet for two main reasons:',
        choices: ['Curiosity + boredom', 'Pot odds + tilt', 'Value + pressure', 'To see a flop'],
        correctIndex: 2,
        explanation: '3-bets build value pots and apply pressure to force folds or deny equity.',
      },
      {
        id: 'a2-q2',
        prompt: 'Use a more linear 3-bet range when you expect:',
        choices: ['Folds', 'Only 4-bets', 'No action at all', 'Calls'],
        correctIndex: 3,
        explanation: 'Linear ranges work best when opponents call often, so you want more strong hands.',
      },
      {
        id: 'a2-q3',
        prompt: 'Default out-of-position 3-bet sizing in this course is:',
        choices: ['3x the open', '3.5x the open', '2x the open', 'Match the open'],
        correctIndex: 1,
        explanation: 'OOP you size up to deny equity and reduce positional disadvantage.',
      },
      {
        id: 'a2-q4',
        prompt: 'Why are sizing tells a leak?',
        choices: [
          'They reduce variance',
          'They save chips',
          'They reveal hand strength',
          'They guarantee folds',
        ],
        correctIndex: 2,
        explanation: 'Changing size by hand strength makes your range readable and exploitable.',
      },
    ],
  },
  A3: {
    title: 'Chapter Quiz: Facing a 3-Bet',
    intro:
      'Test your defense buckets, position rules, and what hands actually continue.',
    questions: [
      {
        id: 'a3-q1',
        prompt: 'Facing a 3-bet, your three default options are:',
        choices: ['Call only', 'Fold, call, 4-bet', 'Jam or fold', 'Check or raise'],
        correctIndex: 1,
        explanation: 'Defense breaks into fold, call, or 4-bet ranges.',
      },
      {
        id: 'a3-q2',
        prompt: 'Versus a very tight 3-bettor, your best adjustment is to:',
        choices: [
          'Call wider to see flops',
          '3-bet more',
          'Tighten continuing range and 4-bet less',
          'Jam any ace',
        ],
        correctIndex: 2,
        explanation: 'If their range is strong, you should defend less and avoid thin continues.',
      },
      {
        id: 'a3-q3',
        prompt: 'Why avoid calling 3-bets with offsuit broadways like KQo?',
        choices: [
          'They are too strong',
          'They block bluffs too often',
          'They are suited',
          'They get dominated and realize equity poorly',
        ],
        correctIndex: 3,
        explanation: 'Offsuit broadways make weak top pairs and get dominated in big pots.',
      },
      {
        id: 'a3-q4',
        prompt: 'How should your defense change by position?',
        choices: [
          'Tighter in position, wider out of position',
          'Wider in position, tighter out of position',
          'Same in all positions',
          'Only 4-bet out of position',
        ],
        correctIndex: 1,
        explanation: 'Position lets you realize equity; OOP calls bleed quickly.',
      },
    ],
  },
  A4: {
    title: 'Chapter Quiz: Blind Defense',
    intro:
      'Quick check on pot odds, MDF guardrails, and equity-realization filters.',
    questions: [
      {
        id: 'a4-q1',
        prompt: 'Facing a 2.5x open in the BB heads-up, you need about:',
        choices: ['~10% equity', '~50% equity', '~27% equity', '~80% equity'],
        correctIndex: 2,
        explanation: 'The pot-odds example in the lesson lands around 27% required equity.',
      },
      {
        id: 'a4-q2',
        prompt: 'MDF should be treated as:',
        choices: [
          'Mandatory in every spot',
          'A guardrail, not a religion',
          'Only for tournaments',
          'A sizing tell system',
        ],
        correctIndex: 1,
        explanation: 'If opponents under-bluff, you can overfold profitably.',
      },
      {
        id: 'a4-q3',
        prompt: 'In multiway BB defense, you should:',
        choices: [
          'Defend any two cards',
          'Ignore equity realization',
          'Tighten up and cut offsuit trash',
          'Only 3-bet',
        ],
        correctIndex: 2,
        explanation: 'Multiway pots punish weak one-pair hands that realize poorly.',
      },
      {
        id: 'a4-q4',
        prompt: 'Hands that realize equity better from the blinds are usually:',
        choices: ['Random offsuit junk', 'Gapped offsuit kings', 'Any ace', 'Suited/connected hands'],
        correctIndex: 3,
        explanation: 'Suited and connected hands make real draws and strong hands more often.',
      },
    ],
  },
  A5: {
    title: 'Chapter Quiz: ISO Raising & Sizing',
    intro:
      'Focus on isolation goals, sizing rules, and range discipline.',
    questions: [
      {
        id: 'a5-q1',
        prompt: 'The primary goal of an ISO raise is to:',
        choices: [
          'See a cheap flop',
          'Isolate the limper heads-up',
          'Balance your limps',
          'Slow-play premiums',
        ],
        correctIndex: 1,
        explanation: 'ISO raising targets the weakest player and reduces multiway pots.',
      },
      {
        id: 'a5-q2',
        prompt: 'Rule-of-thumb ISO sizing is:',
        choices: [
          '2bb flat',
          'Pot-sized always',
          '3bb + 1bb per limper (then adjust)',
          'Min-raise',
        ],
        correctIndex: 2,
        explanation: 'The baseline formula is 3bb + 1bb per limper, then tweak for table dynamics.',
      },
      {
        id: 'a5-q3',
        prompt: 'Before ISO-raising, you should account for:',
        choices: [
          'Only your own stack',
          'Nothing; always ISO',
          'Your image only',
          'Players behind who can squeeze',
        ],
        correctIndex: 3,
        explanation: 'More aggressive players behind increase squeeze risk and shrink your ISO range.',
      },
      {
        id: 'a5-q4',
        prompt: 'ISO ranges are usually:',
        choices: [
          'Much wider than RFI',
          'Slightly tighter than RFI',
          'Always identical to RFI',
          'Only premiums',
        ],
        correctIndex: 1,
        explanation: 'ISO is not a steal; you are building a pot vs a caller, often OOP.',
      },
    ],
  },
  A6: {
    title: 'Chapter Quiz: Stack Depth',
    intro:
      'Check how shallow vs deep stacks change hand class value and sizing discipline.',
    questions: [
      {
        id: 'a6-q1',
        prompt: 'Shallow stacks (under ~40bb) usually favor:',
        choices: [
          'Only suited connectors',
          'Any two suited cards',
          'High-card hands and pairs that make top pair',
          'Weak offsuit gappers',
        ],
        correctIndex: 2,
        explanation: 'Shallow stacks reward hands that make strong top pairs quickly.',
      },
      {
        id: 'a6-q2',
        prompt: 'Deep stacks increase the value of:',
        choices: [
          'Only offsuit aces',
          'Suited connectors and small pairs',
          'Random offsuit junk',
          'Weak top-pair hands',
        ],
        correctIndex: 1,
        explanation: 'Implied odds grow deep, so disguised hands gain value.',
      },
      {
        id: 'a6-q3',
        prompt: 'Default 3-bet sizing system is:',
        choices: ['2x IP, 2x OOP', '4x IP, 5x OOP', 'Same size always', '3x IP, 3.5x OOP'],
        correctIndex: 3,
        explanation: 'The course baseline is 3x in position and 3.5x out of position.',
      },
      {
        id: 'a6-q4',
        prompt: 'Reverse implied odds are most dangerous with:',
        choices: [
          'Strong suited connectors',
          'Dominated top-pair hands',
          'Pocket aces',
          'Nut flushes',
        ],
        correctIndex: 1,
        explanation: 'Deep stacks punish weak top pairs when you’re dominated.',
      },
    ],
  },
  A7: {
    title: 'Chapter Quiz: 30-Day Preflop Plan',
    intro:
      'Make sure the habit plan is clear: focus, structure, and tracking.',
    questions: [
      {
        id: 'a7-q1',
        prompt: 'The plan’s core habit is to:',
        choices: ['Study everything at once', 'Only watch videos', 'Train one spot at a time', 'Skip drills'],
        correctIndex: 2,
        explanation: 'Focused practice beats unfocused “study everything” sessions.',
      },
      {
        id: 'a7-q2',
        prompt: 'The 10-minute daily split is:',
        choices: [
          '5 min study / 5 min drill / 0 min review',
          '3 min study / 4 min drill / 3 min review',
          '2 min study / 8 min drill / 0 min review',
          '10 min drill only',
        ],
        correctIndex: 1,
        explanation: 'The template is 3/4/3 for study, reps, then review.',
      },
      {
        id: 'a7-q3',
        prompt: 'Your daily scorecard should track:',
        choices: [
          'Only hours studied',
          'Only money won',
          'Opponent names',
          'Accuracy plus a top mistake/rule',
        ],
        correctIndex: 3,
        explanation: 'Tracking accuracy and one rule keeps the plan measurable.',
      },
      {
        id: 'a7-q4',
        prompt: 'The plan emphasizes:',
        choices: [
          'Memorizing the entire 30-day calendar',
          'Volume over accuracy',
          'Habits + review, not memorizing a rigid schedule',
          'Skipping review',
        ],
        correctIndex: 2,
        explanation: 'Consistency and review matter more than perfectly memorizing the calendar.',
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

const drillStorageKey = 'course-1-preflop-drills'
const quizStorageKey = 'course-1-preflop-chapter-quizzes'

type QuestionProgress = {
  answers: Record<string, number>
  lastUpdated: string
}

type QuestionStore = Record<string, QuestionProgress>

type QuestionSetProps = {
  data: DrillData
  setId: string
  storageKey: string
  resetLabel: string
  summaryTitle: string | ((score: number, total: number) => string)
  summaryNote: string | ((score: number, total: number) => string)
}

function QuestionSet({
  data,
  setId,
  storageKey,
  resetLabel,
  summaryTitle,
  summaryNote,
}: QuestionSetProps) {
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
      const parsed = JSON.parse(stored) as QuestionStore
      const entry = parsed[setId]
      setAnswers(entry?.answers ?? {})
    } catch {
      setAnswers({})
    } finally {
      setHydrated(true)
    }
  }, [setId, storageKey])

  useEffect(() => {
    if (!hydrated) return
    const stored = localStorage.getItem(storageKey)
    let parsed: QuestionStore = {}
    if (stored) {
      try {
        parsed = JSON.parse(stored) as QuestionStore
      } catch {
        parsed = {}
      }
    }
    const next: QuestionStore = {
      ...parsed,
      [setId]: {
        answers,
        lastUpdated: new Date().toISOString(),
      },
    }
    localStorage.setItem(storageKey, JSON.stringify(next))
  }, [answers, setId, storageKey, hydrated])

  const score = data.questions.reduce((total, q) => {
    if (answers[q.id] === q.correctIndex) return total + 1
    return total
  }, 0)

  const answeredCount = data.questions.filter(
    (q) => answers[q.id] !== undefined
  ).length

  const completed = answeredCount === data.questions.length

  const resolvedSummaryTitle =
    typeof summaryTitle === 'function'
      ? summaryTitle(score, data.questions.length)
      : summaryTitle

  const resolvedSummaryNote =
    typeof summaryNote === 'function'
      ? summaryNote(score, data.questions.length)
      : summaryNote

  const handleReset = () => {
    setAnswers({})
  }

  return (
    <section className="drill">
      <div className="drill-card">
        <h2>{data.title}</h2>
        <p className="drill-intro">{data.intro}</p>
        <div className="drill-meta">
          <div className="drill-score">
            Score: <strong>{score}</strong> / {data.questions.length}
          </div>
          <div className="drill-score">
            Answered: <strong>{answeredCount}</strong> / {data.questions.length}
          </div>
          <button className="drill-reset" onClick={handleReset}>
            {resetLabel}
          </button>
        </div>
      </div>

      <div className="drill-questions">
        {data.questions.map((q, idx) => {
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
          <h3>{resolvedSummaryTitle}</h3>
          <p>
            You finished {data.title}. Final score:{' '}
            <strong>
              {score} / {data.questions.length}
            </strong>
            .
          </p>
          {resolvedSummaryNote ? (
            <p className="drill-summary-note">{resolvedSummaryNote}</p>
          ) : null}
        </div>
      )}
    </section>
  )
}

function Drill({ drillId }: { drillId: string }) {
  const drill = drillBank[drillId]
  return (
    <QuestionSet
      data={drill}
      setId={drillId}
      storageKey={drillStorageKey}
      resetLabel="Reset Drill"
      summaryTitle="Drill Summary"
      summaryNote={
        'Green lights = nailed it. Red lights = review that spot. Yellow lights mean unanswered.'
      }
    />
  )
}

function Quiz({ quizId }: { quizId: string }) {
  const quiz = quizBank[quizId]
  if (!quiz) return null
  const getQuizSummaryTitle = (score: number, total: number) => {
    if (score === total) {
      return "Perfect Score! You've mastered this chapter's fundamentals. Well done!"
    }
    if (score === total - 1) {
      return "Great work! You're almost there. Review the one you missed and you'll have it locked down."
    }
    if (score === Math.ceil(total / 2)) {
      return "Good effort! Time to review the chapter and try again. You've got this!"
    }
    if (score === 1) {
      return "Keep studying! Review the chapter content and try again. Every attempt makes you stronger."
    }
    return "Don't give up! This is how we learn. Go back to the chapter, review the basics, and come back refreshed."
  }

  return (
    <QuestionSet
      data={quiz}
      setId={quizId}
      storageKey={quizStorageKey}
      resetLabel="Reset Quiz"
      summaryTitle={getQuizSummaryTitle}
      summaryNote=""
    />
  )
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [contentHtml, setContentHtml] = useState('<p>Loading…</p>')

  const current = useMemo(() => chapters[currentIndex], [currentIndex])

  // UX: when switching sections, always start at the top.
  // Note: browsers may try to keep the focused "Next" button in view, which can
  // re-scroll you to the bottom. We blur focus and scroll after paint.
  useEffect(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()

    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    scrollTop()
    requestAnimationFrame(scrollTop)
    setTimeout(scrollTop, 0)
  }, [currentIndex])

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
        let html = (await marked.parse(text)) as string
        // GitHub Pages base-path fix: markdown often references /course-md/... (root),
        // but this site is hosted under /course-1-preflop-site/. Rewrite to include BASE_URL.
        html = html.replaceAll('src="/course-md/', `src="${base}course-md/`)
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
          <img
            className="brand-icon"
            src={`${import.meta.env.BASE_URL}course-assets/cards-icon.svg`}
            alt="Poker cards icon"
          />
          <div className="brand-copy">
            <div className="brand-kicker">PlayPokerWinMoney</div>
            <div className="brand-title">Course 1 — Preflop</div>
            <div className="brand-sub">Chapters + Drills</div>
          </div>
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
          <div className="content-hero">
            <div className="content-hero-copy">
              <span className="content-pill">
                {current.type === 'markdown' ? 'Lesson' : 'Drill'}
              </span>
              <h1>{current.title}</h1>
              <p className="content-summary">
                Tight ranges, clean pressure, fewer spews. Learn the spots that
                actually move your preflop win rate.
              </p>
            </div>
            <img
              className="content-hero-art"
              src={`${import.meta.env.BASE_URL}course-assets/poker-hero.svg`}
              alt="Stylized poker table with chips and cards"
            />
          </div>
        </header>

        {current.type === 'markdown' ? (
          <>
            <article
              className="markdown"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            <Quiz quizId={current.id} />
          </>
        ) : (
          <Drill drillId={current.drillId ?? 'd1'} />
        )}

        <div className="section-divider" aria-hidden="true">
          <img
            src={`${import.meta.env.BASE_URL}course-assets/table-divider.svg`}
            alt=""
          />
        </div>

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

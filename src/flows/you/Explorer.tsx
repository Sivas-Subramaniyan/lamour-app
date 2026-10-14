// you/explorer: the Signature with its six areas around it. Every area is sourced, and the user can edit, pause or forget it.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Chip, Tag, Eyebrow, AiBadge, Meter, Sheet, Section } from '../../design/ui'
import { Signature } from '../../design/signature'
import { useApp, CHAPTERS, type State, type Source, type HeardCard, type ChapterId } from '../../state/store'
import { useNav } from '../../shell/nav'
import { topValues } from '../../lib/compat'
import { useYou, useRecalc, Recalculating, SourceChip, myModes, SIG, type Area, type AreaState, type YouExtra } from './shared'

type Reading = {
  key: Area; label: string; chapter: ChapterId; angle: number
  words: string; value: number; ends: [string, string]; options: string[]
  asked: boolean; state: AreaState; source: Source; confidence: string
  quotes: HeardCard[]; inferred?: string; heardIds: string[]
}

const clamp = (n: number) => Math.min(1, Math.max(0, n))

function readings(s: State, x: YouExtra): Reading[] {
  const t = s.me.traits
  const avg = (...i: number[]) => i.reduce((a, k) => a + t.values[k], 0) / i.length
  const [v1, v2] = topValues(t, 2)
  const base: Omit<Reading, 'asked' | 'state' | 'source' | 'confidence' | 'quotes'>[] = [
    { key: 'values', label: 'Values', chapter: 'life', angle: -90, heardIds: ['h1'],
      words: `${v1} first, then ${v2.toLowerCase()}`, value: clamp(0.5 + (avg(8, 0) - avg(7, 5)) / 5), ends: ['Tradition, security', 'Kindness, freedom'],
      options: [`${v1} first, then ${v2.toLowerCase()}`, `${v2} first, then ${v1.toLowerCase()}`, 'Fairness above everything'] },
    { key: 'social', label: 'Social energy', chapter: 'people', angle: -30, heardIds: ['h2'],
      words: t.extraversion < 0.5 ? 'Small rooms, long talks' : t.extraversion < 0.65 ? 'Somewhere in between' : 'Lights up around people', value: t.extraversion, ends: ['Small rooms', 'Big rooms'],
      options: ['Small rooms, long talks', 'Somewhere in between', 'Lights up around people'] },
    { key: 'curiosity', label: 'Curiosity', chapter: 'story', angle: 30, heardIds: [],
      words: t.openness > 0.7 ? 'Restless for the new' : 'Loves the familiar', value: t.openness, ends: ['The familiar', 'The new'],
      options: ['Restless for the new', 'Curious, with favourites', 'Loves the familiar'],
      inferred: `From how often you bring up ${t.interests.slice(0, 3).join(', ')}. You never said it in so many words.` },
    { key: 'closeness', label: 'Closeness', chapter: 'love', angle: 90, heardIds: ['h3'],
      words: t.anxiety > 3.2 ? 'Likes to hear back soon' : 'Close, with room to breathe', value: clamp(1 - t.avoidance / 7), ends: ['Plenty of space', 'Plenty of closeness'],
      options: ['Likes to hear back soon', 'Close, with room to breathe', 'Needs plenty of space'] },
    { key: 'stress', label: 'Under stress', chapter: 'hard', angle: 150, heardIds: ['h4'],
      words: t.conflict === 'pursue' ? 'Moves toward' : t.conflict === 'withdraw' ? 'Steps back to think' : 'Talks it out, after a pause',
      value: t.conflict === 'pursue' ? 0.78 : t.conflict === 'withdraw' ? 0.25 : 0.5, ends: ['Steps back to think', 'Moves toward'],
      options: ['Moves toward', 'Talks it out, after a pause', 'Steps back to think'] },
    { key: 'care', label: 'Care styles', chapter: 'care', angle: 210, heardIds: [],
      words: 'Time and things made by hand', value: 0.6, ends: ['Words', 'Acts'], options: ['Time and things made by hand', 'Words, said out loud', 'Small acts, often'] },
  ]
  return base.map(b => {
    const asked = s.chapters[b.chapter] === 'done'
    const quotes = s.heard.filter(h => b.heardIds.includes(h.id))
    const live = quotes.filter(h => h.status !== 'struck')
    const edited = x.edits[b.key]
    const source: Source = edited ? 'You said' : live.some(h => h.source === 'You confirmed') ? 'You confirmed' : live[0]?.source ?? 'Aura inferred'
    const confidence = !asked ? 'Not asked yet'
      : edited || (live.length && live.every(h => h.status === 'confirmed')) ? 'Aura knows this well'
      : live.length ? 'Fairly sure · one thing for you to confirm' : 'Fairly sure · inferred, not said'
    return { ...b, words: edited ?? b.words, asked, state: x.areas[b.key] ?? 'on', source, confidence, quotes }
  })
}

const STATE_WORD = (r: Reading) => (!r.asked ? 'Not asked' : r.state === 'off' ? 'Paused' : r.state === 'forgotten' ? 'Forgotten' : 'In use')
const DONE: Record<'edit' | 'off' | 'on' | 'forget' | 'restore', string> = {
  edit: 'Updated in your words. Signature redrawn.',
  off: 'Paused for matching. Still yours to see.',
  on: 'Back in use for matching.',
  forget: 'Forgotten. I won’t use it again.',
  restore: 'I’ll ask you about this again.',
}

export function Explorer() {
  const { s, update } = useApp()
  const { x, set } = useYou()
  const nav = useNav()
  const { busy, run } = useRecalc()
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState<Area>('values')
  const [mode, setMode] = useState<'view' | 'edit' | 'forget'>('view')
  const all = readings(s, x)
  const r = all.find(a => a.key === key)!
  const ch = CHAPTERS.find(c => c.id === r.chapter)!
  const R = 138, RY = 146

  const show = (k: Area) => { setKey(k); setMode('view'); setOpen(true) }
  const heard = (ids: string[], status: HeardCard['status']) => update(s => ({ ...s, heard: s.heard.map(h => (ids.includes(h.id) ? { ...h, status } : h)) }))

  const act = (kind: keyof typeof DONE, phrase?: string) => {
    setOpen(false)
    const k = r.key
    if (kind === 'edit') set(x => ({ edits: { ...x.edits, [k]: phrase }, areas: { ...x.areas, [k]: 'on' } }))
    if (kind === 'off' || kind === 'on') set(x => ({ areas: { ...x.areas, [k]: kind } }))
    if (kind === 'forget') {
      set(x => { const edits = { ...x.edits }; delete edits[k]; return { edits, areas: { ...x.areas, [k]: 'forgotten' } } })
      heard(r.heardIds, 'struck')
    }
    if (kind === 'restore') { set(x => ({ areas: { ...x.areas, [k]: 'on' } })); heard(r.heardIds, 'pending') }
    run(DONE[kind])
  }

  const counts = { on: all.filter(a => a.asked && a.state === 'on').length, off: all.filter(a => a.state === 'off').length, gone: all.filter(a => a.state === 'forgotten').length }

  return (
    <Screen top={<TopBar title="Your Signature" right={<AiBadge text="Aura" />} />}>
      <div className="pad stack gap-20" style={{ paddingTop: 4 }}>
        <div className="stack gap-8 center" style={{ alignItems: 'center' }}>
          <Eyebrow>Signature explorer</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Six areas, <span className="i">each one yours to correct.</span></h1>
        </div>

        <div className="yu-orbit">
          <svg className="yu-orbit-lines" viewBox="0 0 340 340" aria-hidden="true">
            <ellipse cx="170" cy="170" rx={R - 34} ry={RY - 30} fill="none" stroke="currentColor" strokeDasharray="2 5" />
            {all.map(a => {
              const c = Math.cos((a.angle * Math.PI) / 180), sn = Math.sin((a.angle * Math.PI) / 180)
              return <line key={a.key} x1={170 + c * (R - 44)} y1={170 + sn * (RY - 40)} x2={170 + c * (R - 26)} y2={170 + sn * (RY - 22)} stroke="currentColor" />
            })}
          </svg>
          <div className="yu-orbit-sig">
            <Signature layers={[{ modes: myModes(s), color: SIG.night }]} size={196} agitation={busy ? 0.75 : 0} settle={!busy} grains={1500} />
          </div>
          {all.map((a, i) => (
            <motion.button key={a.key} className={`yu-area ${!a.asked ? 'todo' : a.state}`} onClick={() => show(a.key)}
              style={{ left: `${50 + (Math.cos((a.angle * Math.PI) / 180) * R) / 3.4}%`, top: `${50 + (Math.sin((a.angle * Math.PI) / 180) * RY) / 3.4}%`, x: '-50%', y: '-50%' }}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: a.state === 'forgotten' ? 0.6 : 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <span className="serif i yu-area-name">{a.label}</span>
              <span className="yu-area-state">{STATE_WORD(a)}</span>
            </motion.button>
          ))}
        </div>

        <Recalculating show={busy} />

        <p className="t-callout muted center pretty" style={{ margin: 0 }}>
          Tap an area to see what I based it on. Edit it in your words, pause it for matching, or ask me to forget it.
        </p>

        <div className="row gap-8 wrap" style={{ justifyContent: 'center' }}>
          <Tag tone="ember">{counts.on} in use</Tag>
          {counts.off > 0 && <Tag>{counts.off} paused</Tag>}
          {counts.gone > 0 && <Tag>{counts.gone} forgotten</Tag>}
          {all.some(a => !a.asked) && <Tag>{all.filter(a => !a.asked).length} not asked yet</Tag>}
        </div>

        <Button kind="ghost" block icon="refresh" onClick={() => nav.push('conv/signature')}>Watch it form again</Button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={r.label}>
        <div className="stack gap-20" style={{ paddingBottom: 8 }}>
          {!r.asked ? (
            <>
              <p className="t-quote" style={{ margin: 0 }}>We haven’t talked about this yet.</p>
              <p className="t-body muted pretty" style={{ margin: 0 }}>
                {ch.title} is a {ch.mins}-minute chapter. {ch.blurb} Until then, I leave this area out of your matches.
              </p>
              <Button kind="ember" block icon="sparkle" onClick={() => { setOpen(false); nav.push('conv/chapters') }}>Begin {ch.title}</Button>
            </>
          ) : (
            <>
              <div className="stack gap-12">
                <p className={`t-quote ${r.state === 'forgotten' ? 'faint' : ''}`} style={{ margin: 0, textDecoration: r.state === 'forgotten' ? 'line-through' : undefined }}>{r.words}</p>
                <Meter value={r.state === 'forgotten' ? 0 : r.value} color="var(--accent)" />
                <div className="row between t-small faint"><span>{r.ends[0]}</span><span>{r.ends[1]}</span></div>
              </div>
              <div className="row between gap-12 wrap">
                <span className="t-small muted">{r.state === 'forgotten' ? 'Forgotten at your request' : r.confidence}</span>
                <SourceChip source={r.source} />
              </div>

              {r.state === 'off' && <div className="card-flat t-small muted" style={{ padding: 14 }}>Paused for matching. You still see it here; your letter doesn’t use it.</div>}

              <Section label="What I heard">
                <div className="stack gap-12">
                  {r.quotes.map(h => (
                    <div key={h.id} className="yu-evidence">
                      <p className={`serif ${h.status === 'struck' ? 'faint' : ''}`} style={{ margin: 0, fontSize: 19, lineHeight: 1.3, textDecoration: h.status === 'struck' ? 'line-through' : undefined }}>{h.quote}</p>
                      <span className="t-small faint">{CHAPTERS.find(c => c.id === h.chapter)?.title} · {h.status === 'struck' ? 'struck' : h.status === 'pending' ? 'waiting for you to confirm' : h.source.toLowerCase()}</span>
                    </div>
                  ))}
                  {!r.quotes.length && <p className="t-callout muted" style={{ margin: 0 }}>{r.inferred ?? 'No direct quotes. This came from your answers in the chapter.'}</p>}
                </div>
              </Section>

              {mode === 'view' && (
                <div className="stack gap-8">
                  {r.state === 'forgotten' ? (
                    <Button kind="ember" block icon="undo" onClick={() => act('restore')}>Tell Aura again</Button>
                  ) : (
                    <>
                      <Button kind="soft" block icon="edit" onClick={() => setMode('edit')}>Edit in my words</Button>
                      {r.state === 'off'
                        ? <Button kind="ghost" block onClick={() => act('on')}>Use for matching again</Button>
                        : <Button kind="ghost" block onClick={() => act('off')}>Don’t use for matching</Button>}
                      <Button kind="quiet" block icon="trash" onClick={() => setMode('forget')}>Forget this</Button>
                    </>
                  )}
                </div>
              )}

              {mode === 'edit' && (
                <div className="stack gap-12">
                  <Eyebrow>Which is closer to you?</Eyebrow>
                  <div className="row gap-8 wrap">
                    {r.options.map(o => <Chip key={o} on={o === r.words} onClick={() => act('edit', o)}>{o}</Chip>)}
                  </div>
                  <Button kind="quiet" block onClick={() => setMode('view')}>Cancel</Button>
                </div>
              )}

              {mode === 'forget' && (
                <div className="card-flat stack gap-12" style={{ padding: 16 }}>
                  <span className="t-callout">I’ll strike what I heard about this and redraw your Signature without it. You can tell me again any time.</span>
                  <Button kind="commit" block onClick={() => act('forget')}>Forget {r.label.toLowerCase()}</Button>
                  <Button kind="quiet" block onClick={() => setMode('view')}>Keep it</Button>
                </div>
              )}
            </>
          )}
        </div>
      </Sheet>
    </Screen>
  )
}

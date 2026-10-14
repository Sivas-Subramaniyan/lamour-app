// you/preview: your spread exactly as a match sees it, then the Shared Lens: which traits a match's explanation may draw on.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, Portrait, Halo, Toggle, Sheet, Section, IconButton, Waveform, ListRow } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, myChart, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { PERSONAS, ageOf } from '../../data/personas'
import { ARCHETYPE } from '../../lib/numerology'
import { useFeedback } from '../../design/ui'
import { useYou, pro, type LensKey } from './shared'

const LENS: { key: LensKey; label: string }[] = [
  { key: 'social', label: 'Social energy' }, { key: 'curiosity', label: 'Curiosity' }, { key: 'stress', label: 'Under stress' },
  { key: 'care', label: 'Care styles' }, { key: 'life', label: 'Life design' }, { key: 'numbers', label: 'Numbers' },
]
const VOICE_SECS = [16, 12]

function drafts(s: State) {
  const n = s.me.name, p = pro(s.me.gender)
  return [
    `${n} makes things that take a long time, and ${p.s} ${p.be} patient with people the same way. ${p.S}’ll remember what you said last week.`,
    `${n} designs by day and throws pots by night. ${p.S} ${p.be} warmest in small rooms, and happiest at a long table with four friends.`,
    `${n} asks good questions and listens to the answers. ${p.S} ${p.be} looking for someone kind first, and ambitious about the right things.`,
  ]
}

function lensLine(s: State, on: Record<LensKey, boolean>) {
  const t = s.me.traits, p = pro(s.me.gender), lp = myChart(s).lifePath, l = t.lifestyle
  const f: Record<LensKey, string | null> = {
    social: t.extraversion < 0.5 ? `${p.S} ${p.be} happiest in small rooms, at a long table with a few friends.` : `${p.S} ${p.be} at ${p.pos} best in a full room.`,
    curiosity: t.openness > 0.7 ? `New ideas pull at ${p.obj}. Ask about ${t.interests[0]}.` : `${p.S} ${p.be} loyal to ${p.pos} favourite places and people.`,
    stress: t.conflict === 'pursue' ? `When something’s wrong, ${p.s} would rather talk it out tonight than sleep on it.`
      : t.conflict === 'withdraw' ? `When something’s wrong, ${p.s} takes an hour to think, then comes back.` : `When something’s wrong, ${p.s} talks it through after a pause.`,
    care: s.chapters.care === 'done' ? `Care, for ${p.obj}, looks like time and things made by hand.` : null,
    life: l.kids === 'want' ? `${p.S} would like a family one day, without a rush.` : l.kids === 'open' ? `${p.S} ${p.be} open about kids.` : `${p.S} ${p.be} clear about the life ${p.s} wants.`,
    numbers: `${p.Pos} Life Path is ${lp}, ${ARCHETYPE[lp].name}. A reflective note, not a reason.`,
  }
  const parts = LENS.filter(x => on[x.key] && f[x.key]).map(x => f[x.key]!)
  if (!parts.length) return `Only your pages and photos. Aura will explain your fit in general terms.`
  const line = parts.join(' ')
  return line.startsWith(`${p.S} `) ? `${s.me.name} ${line.slice(p.S.length + 1)}` : line
}

export function Preview() {
  const { s } = useApp()
  const { x, set } = useYou()
  const nav = useNav()
  const { toast } = useFeedback()
  const viewer = PERSONAS[s.tonight.ids[0]]?.first ?? 'Kabir'
  const [edit, setEdit] = useState(false)
  const [pick, setPick] = useState(x.foreword)
  const [playing, setPlaying] = useState<number | null>(null)
  const [prog, setProg] = useState(0)
  const all = drafts(s)
  const lp = myChart(s).lifePath

  useEffect(() => {
    if (playing === null) return
    const secs = VOICE_SECS[playing] ?? 14
    const t = setInterval(() => setProg(p => Math.min(1, p + 0.1 / secs)), 100)
    return () => clearInterval(t)
  }, [playing])
  useEffect(() => { if (prog >= 1) { setPlaying(null); setProg(0) } }, [prog])

  const toggleLens = (k: LensKey, v: boolean) => {
    if (k === 'care' && s.chapters.care !== 'done') { toast('Finish Care & rituals first. It takes five minutes.'); return }
    set(x => ({ lens: { ...x.lens, [k]: v } }))
  }
  const sub: Record<LensKey, string> = {
    social: s.me.traits.extraversion < 0.5 ? 'Small rooms, long talks' : 'Lights up around people',
    curiosity: s.me.traits.openness > 0.7 ? 'Restless for the new' : 'Loves the familiar',
    stress: s.me.traits.conflict === 'pursue' ? 'Moves toward' : 'Steps back to think',
    care: s.chapters.care === 'done' ? 'Time, and things made by hand' : 'Arrives after Care & rituals',
    life: 'Kids, faith, drinking, where to live',
    numbers: `Life Path ${lp} · never a reason on its own`,
  }
  const line = lensLine(s, x.lens)

  return (
    <Screen top={<TopBar title="As others see you" right={<Tag>Preview</Tag>} />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-8">
          <Eyebrow>Exactly as it appears in a letter</Eyebrow>
          <p className="t-callout muted" style={{ margin: 0 }}>This is your spread from {viewer}’s side. No scores, no numbers above your face.</p>
        </div>

        <article className="card yu-spread">
          <div style={{ position: 'relative' }}>
            <Portrait photo={s.me.photos[0]} name={s.me.name} shape="arch" w="100%" h={360} priority />
            <span className="yu-spread-verified"><Halo v={s.me.verified} size={32}><span className="yu-halo-ico" style={{ width: 32, height: 32 }}><Icon name="shieldCheck" size={15} /></span></Halo></span>
          </div>
          <div className="stack gap-8" style={{ padding: '20px 4px 0' }}>
            <h2 className="t-display" style={{ margin: 0 }}>{s.me.name}<span className="faint">, {ageOf(s.me.dob)}</span></h2>
            <span className="t-small muted">{s.me.you?.job ?? 'Product designer and potter'} · {s.me.you?.hood ?? 'Brooklyn'}</span>
            <p className="serif i" style={{ margin: '6px 0 0', fontSize: 21, lineHeight: 1.3 }}>Makes slow things on purpose: pots, dinners, friendships.</p>
          </div>

          <div className="stack gap-24" style={{ padding: '26px 4px 4px' }}>
            {s.me.prompts.map((p, i) => {
              const words = p.answer.split(' ')
              const on = playing === i
              return (
                <div key={p.label} className="yu-quote stack gap-12">
                  <span className="t-label faint">{p.label}</span>
                  <p className="serif" style={{ margin: 0, fontSize: 24, lineHeight: 1.25 }}>
                    {words.map((w, k) => <span key={k} style={{ opacity: on && k / words.length > prog ? 0.38 : 1, transition: 'opacity .25s' }}>{w} </span>)}
                  </p>
                  {i < VOICE_SECS.length && (
                    <div className="row gap-12">
                      <IconButton icon={on ? 'pause' : 'play'} label={on ? 'Pause voice page' : 'Play voice page'} variant="filled" onClick={() => { setProg(0); setPlaying(on ? null : i) }} />
                      <Waveform seed={i + 3} bars={30} height={26} progress={on ? prog : undefined} color="var(--ink-2)" />
                      <span className="t-num t-small faint">0:{String(VOICE_SECS[i]).padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
              )
            })}
            {s.me.photos[1] && <Portrait photo={s.me.photos[1]} name={s.me.name} shape="rect" w="100%" h={240} />}
          </div>
        </article>

        <div className="card card-aura card-pad stack gap-12">
          <div className="row between"><Eyebrow>Aura’s foreword</Eyebrow><Button kind="quiet" size="sm" icon="edit" onClick={() => { setPick(x.foreword); setEdit(true) }}>Edit</Button></div>
          <p className="t-quote pretty" style={{ margin: 0 }}>{all[x.foreword] ?? all[0]}</p>
          <span className="t-small faint">Aura wrote this about you · you approved it</span>
        </div>

        <Section label="Your Shared Lens">
          <p className="t-callout muted pretty" style={{ margin: 0 }}>Choose what a match’s explanation may draw on. Your band with them doesn’t change; only what they read about you.</p>
          <div>
            {LENS.map(l => (
              <ListRow key={l.key} title={l.label} sub={sub[l.key]} chevron={false}
                right={<Toggle on={x.lens[l.key] && !(l.key === 'care' && s.chapters.care !== 'done')} label={l.label} onChange={v => toggleLens(l.key, v)} />} />
            ))}
          </div>
          <div className="card card-pad stack gap-12">
            <Eyebrow>What {viewer} would read about you</Eyebrow>
            <AnimatePresence mode="wait">
              <motion.p key={line} className="serif i pretty" style={{ margin: 0, fontSize: 20, lineHeight: 1.35 }}
                initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }} transition={{ duration: 0.35 }}>
                {line}
              </motion.p>
            </AnimatePresence>
            <span className="t-small faint">Drafted by Aura from what you’ve shared. Updates as you choose.</span>
          </div>
        </Section>

        <Button kind="ghost" block icon="edit" onClick={() => nav.push('arrival/photos')}>Edit photos and pages</Button>
      </div>

      <Sheet open={edit} onClose={() => setEdit(false)} title="Aura’s foreword">
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          <p className="t-callout muted" style={{ margin: 0 }}>Aura writes about you, never as you. Pick the version that sounds most like how your friends would describe you.</p>
          {all.map((d, i) => (
            <button key={i} className={`yu-option ${pick === i ? 'on' : ''}`} onClick={() => setPick(i)} aria-pressed={pick === i}>
              <span className="serif i" style={{ fontSize: 18, lineHeight: 1.35 }}>{d}</span>
            </button>
          ))}
          <Button kind="commit" block onClick={() => { set({ foreword: pick }); setEdit(false); toast('Approved. Matches will read this version.') }}>Approve this foreword</Button>
        </div>
      </Sheet>
    </Screen>
  )
}

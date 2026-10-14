// you/discretion: tools for people who need to be careful, each with its honest limit stated beside it.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen, TopBar, Button, Tag, Eyebrow, Toggle, Section, Sheet, Portrait, Orb } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, type State } from '../../state/store'
import { useFeedback } from '../../design/ui'
import { CAST, PERSONAS } from '../../data/personas'
import { ConfirmSheet } from './shared'

type D = State['discreet']

export function Discretion() {
  const { s, update } = useApp()
  const { toast } = useFeedback()
  const d = s.discreet
  const [adding, setAdding] = useState(false)
  const [who, setWho] = useState('')
  const [pausing, setPausing] = useState(false)
  const setD = (patch: Partial<D>) => update(s => ({ ...s, discreet: { ...s.discreet, ...patch } }))
  const turn = PERSONAS[CAST[s.me.seeking].yourTurn]

  const flip = (k: 'veil' | 'screenshotShield' | 'hideNames', v: boolean, on: string, off: string) => { setD({ [k]: v } as Partial<D>); toast(v ? on : off) }

  return (
    <Screen top={<TopBar title="Discretion" />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <div className="stack gap-12">
          <Eyebrow>Discretion</Eyebrow>
          <h1 className="t-title balance" style={{ margin: 0 }}>Quiet, <span className="i">by design.</span></h1>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>For anyone who’d rather not be seen by a colleague, a cousin or an ex. Each tool says what it can’t do, too.</p>
        </div>

        <AnimatePresence>
          {d.sabbatical && (
            <motion.div className="card card-aura card-pad row gap-16" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <Orb size={36} />
              <div className="grow stack" style={{ gap: 2 }}>
                <span className="serif i" style={{ fontSize: 19 }}>Introductions paused.</span>
                <span className="t-small muted">No letters until you’re back. Your Table is as you left it.</span>
              </div>
              <Button kind="soft" size="sm" onClick={() => { setD({ sabbatical: false }); toast('Welcome back. Your next letter arrives at dusk.') }}>Resume</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card card-pad stack gap-16">
          <div className="row gap-16">
            <motion.span key={d.blocked} className="t-num yu-moved-n" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>{d.blocked}</motion.span>
            <div className="grow stack" style={{ gap: 2 }}>
              <span className="t-head">People hidden</span>
              <span className="t-small muted">{d.blocked} {d.blocked === 1 ? 'person' : 'people'} from your contacts will never see you, and you’ll never see them.</span>
            </div>
          </div>
          <span className="t-small faint pretty">We compare one-way codes, not numbers. Your contacts are never uploaded or stored.</span>
          <Button kind="ghost" size="md" icon="plus" onClick={() => { setWho(''); setAdding(true) }}>Hide someone</Button>
        </div>

        <Section label="Your photos">
          <div className="card card-pad stack gap-16">
            <div className="row gap-12">
              <div className="grow stack" style={{ gap: 2 }}>
                <span className="t-callout" style={{ fontWeight: 600 }}>Voice-first Veil</span>
                <span className="t-small muted pretty">Your photos stay soft until you’ve both sent a voice hello.</span>
              </div>
              <Toggle on={d.veil} label="Voice-first Veil" onChange={v => flip('veil', v, 'Veil on. Voice first, then faces.', 'Veil off. Your photos show as usual.')} />
            </div>
            <div className="row gap-12" style={{ alignItems: 'flex-end' }}>
              <motion.div animate={{ filter: d.veil ? 'blur(9px) saturate(.7)' : 'blur(0px) saturate(1)' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ borderRadius: '999px 999px 18px 18px', overflow: 'hidden' }}>
                <Portrait photo={s.me.photos[0]} name={s.me.name} shape="arch" w={86} h={114} />
              </motion.div>
              <span className="t-small faint pretty grow">{d.veil ? 'How a new introduction sees you, before your hellos.' : 'How a new introduction sees you today.'}</span>
            </div>
          </div>
        </Section>

        <Section label="On this phone">
          <div className="card card-pad stack gap-20">
            <div className="stack gap-8">
              <div className="row gap-12">
                <div className="grow stack" style={{ gap: 2 }}>
                  <span className="t-callout" style={{ fontWeight: 600 }}>Screenshot shield</span>
                  <span className="t-small muted pretty">Blocks screenshots of your profile and chats. It can’t stop someone photographing their screen with a second phone, so share what you’re comfortable with.</span>
                </div>
                <Toggle on={d.screenshotShield} label="Screenshot shield" onChange={v => flip('screenshotShield', v, 'Shield on.', 'Shield off. Screenshots are possible again.')} />
              </div>
            </div>
            <div className="hairline" />
            <div className="stack gap-12">
              <div className="row gap-12">
                <div className="grow stack" style={{ gap: 2 }}>
                  <span className="t-callout" style={{ fontWeight: 600 }}>Hide names in notifications</span>
                  <span className="t-small muted pretty">Your lock screen never shows who. Safety alerts still come through in full.</span>
                </div>
                <Toggle on={d.hideNames} label="Hide names in notifications" onChange={v => flip('hideNames', v, 'Names hidden on your lock screen.', 'Names will show on your lock screen.')} />
              </div>
              <div className="yu-lockprev">
                <span className="yu-lockprev-ico"><Orb size={18} /></span>
                <span className="grow stack" style={{ gap: 1 }}>
                  <span className="row between"><b style={{ fontSize: 13.5 }}>L’Amour</b><span style={{ fontSize: 12, opacity: 0.6 }}>now</span></span>
                  <AnimatePresence mode="wait">
                    <motion.span key={String(d.hideNames)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }} style={{ fontSize: 13.5, lineHeight: 1.35 }}>
                      {d.hideNames ? 'Someone replied. Open L’Amour to read it.' : `Your turn with ${turn?.first ?? 'Tomás'}. 31 hours left to reply.`}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </div>
          </div>
        </Section>

        <Section label="Time away">
          <div className="card card-pad stack gap-12">
            <div className="row gap-12">
              <div className="grow stack" style={{ gap: 2 }}>
                <span className="t-callout" style={{ fontWeight: 600 }}>Sabbatical</span>
                <span className="t-small muted pretty">Pause introductions. Nobody new sees you; the people at your Table still can.</span>
              </div>
              <Toggle on={d.sabbatical} label="Sabbatical" onChange={v => (v ? setPausing(true) : (setD({ sabbatical: false }), toast('Welcome back. Your next letter arrives at dusk.')))} />
            </div>
            {d.sabbatical && <Tag tone="sage" icon="moon">Paused since today</Tag>}
          </div>
        </Section>

        <p className="t-small faint center pretty" style={{ margin: 0 }}>Discretion protects you. It never hides you from a safety review.</p>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Hide someone">
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          <p className="t-callout muted pretty" style={{ margin: 0 }}>A name or a phone number. If they’re a member, neither of you will ever appear to the other. They aren’t told.</p>
          <label className="field">
            <span className="t-label faint">Name or number</span>
            <input className="input" value={who} onChange={e => setWho(e.target.value)} placeholder="e.g. a colleague’s number" aria-label="Name or number" />
          </label>
          <div className="row gap-8 t-small faint"><Icon name="lock" size={14} />Turned into a one-way code on this phone, then discarded.</div>
          <Button kind="commit" block disabled={!who.trim()} onClick={() => { setD({ blocked: d.blocked + 1 }); setAdding(false); toast('Hidden. Neither of you will see the other.') }}>Hide</Button>
        </div>
      </Sheet>

      <ConfirmSheet open={pausing} onClose={() => setPausing(false)} title="Take a sabbatical?" confirm="Pause introductions" kind="primary"
        body="No new letters while you’re away, and nobody new will see you. Your Table stays as it is, and you can come back with one tap."
        onConfirm={() => { setD({ sabbatical: true }); toast('Paused. Take the time you need.') }} />
    </Screen>
  )
}

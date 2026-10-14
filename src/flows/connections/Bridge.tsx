// conn/bridge: the Bridge Brief. Private threads to pull, a care note, their voice pages. Aura writes about you two, never as you.
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Eyebrow, Tag, PairAvatars, AiBadge } from '../../design/ui'
import { Icon } from '../../design/icons'
import { PERSONAS } from '../../data/personas'
import { useApp, leadId, fitWith } from '../../state/store'
import type { ScreenProps } from '../../shell/screens'
import { useNav } from '../../shell/nav'
import { usePlayback, VoiceNote, voiceOf } from './kit'
import { bridgeFor, pron, THREAD_WHY } from './copy'

const NUMERAL = ['I', 'II', 'III', 'IV', 'V']

export function Bridge({ params }: ScreenProps) {
  const { s } = useApp()
  const nav = useNav()
  const play = usePlayback()
  const id = leadId(s, params)
  const p = PERSONAS[id]
  const { poss } = pron(p)
  const threads = bridgeFor(p)
  const fit = fitWith(s, id)
  const care = p.aura.careNote || (fit.efforts[0] ? `${fit.efforts[0].line} ${fit.efforts[0].tip}` : 'Nothing stands out. Go in curious.')
  const voicePages = p.pages.filter(x => x.voiceSecs && x.text !== '…')
  const saidHello = (s.messages[id] ?? []).some(m => m.from === 'me')
  const source = (t: string) => (/\byour?\b|\bboth\b|\btwo of you\b/i.test(t) ? 'Something you both said' : `From ${poss} own pages`)

  return (
    <Screen top={<TopBar title="Bridge Brief" right={<AiBadge text="Aura" />} />}
      footer={
        <div className="stack gap-8">
          {saidHello
            ? <Button kind="primary" block icon="message" onClick={() => nav.push('conn/chat', { id })}>Open the conversation</Button>
            : <Button kind="commit" block icon="mic" onClick={() => nav.push('conn/hello', { id })}>Record your hello</Button>}
        </div>
      }>
      <div className="pad stack gap-32" style={{ paddingTop: 8 }}>
        <header className="stack gap-12">
          <PairAvatars a={{ photo: s.me.photos[0], name: s.me.name }} b={{ photo: p.photos.portrait, name: p.first }} size={52} />
          <span className="row gap-8 t-small faint"><Icon name="lock" size={14} />Only you can see this</span>
          <h1 className="t-title balance" style={{ margin: 0 }}>Threads to pull, <span className="i">for you and {p.first}.</span></h1>
        </header>

        <div className="stack gap-12">
          {threads.map((t, i) => (
            <motion.article key={t} className="card card-pad stack gap-12" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <div className="row between">
                <span className="serif i faint" style={{ fontSize: 20 }}>{NUMERAL[i] ?? i + 1}</span>
                <Tag>{source(t)}</Tag>
              </div>
              <span className="serif" style={{ fontSize: 22, lineHeight: 1.25 }}>{t}</span>
              <span className="t-small muted">{THREAD_WHY[i % THREAD_WHY.length]}</span>
              <div><Button kind="soft" size="sm" iconRight="chevron" onClick={() => nav.push('conn/chat', { id, tip: t })}>Use as a starting point</Button></div>
            </motion.article>
          ))}
        </div>

        <section className="cn-gentle stack gap-8">
          <Eyebrow>Go gently on</Eyebrow>
          <p className="t-quote" style={{ margin: 0 }}>{care}</p>
          <span className="t-small faint">About the two of you, not a verdict on either.</span>
        </section>

        {voicePages.length > 0 && (
          <section className="stack gap-12">
            <Eyebrow>{p.first}’s voice pages</Eyebrow>
            {voicePages.map(v => (
              <div key={v.label} className="card-flat card-pad stack gap-8" style={{ padding: 16 }}>
                <span className="t-callout" style={{ fontWeight: 550 }}>{v.label}</span>
                <VoiceNote k={`page-${v.label}`} text={v.text} secs={v.voiceSecs!} voice={voiceOf(p.gender)} play={play} />
              </div>
            ))}
          </section>
        )}

        <p className="row gap-8 t-small faint" style={{ margin: 0, justifyContent: 'center' }}><Icon name="feather" size={15} />Aura writes about you two, never as you.</p>
      </div>
    </Screen>
  )
}

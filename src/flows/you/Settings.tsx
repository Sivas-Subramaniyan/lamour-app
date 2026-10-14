// you/settings: Aura's voice, speaking aloud, language, quiet hours, who you'd like to meet, sign out, about.
import { useEffect, useState } from 'react'
import { Screen, TopBar, Button, Tag, Eyebrow, Toggle, Section, ListRow, Sheet, Segmented, Waveform, Orb } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, type State } from '../../state/store'
import { useNav } from '../../shell/nav'
import { useFeedback } from '../../design/ui'
import { speak, stopSpeaking } from '../../lib/voice'
import { ConfirmSheet } from './shared'

type Voice = State['me']['voice']
type Seeking = State['me']['seeking']
const VOICES: { v: Voice; body: string }[] = [
  { v: 'Warm', body: 'Unhurried, a little low. Like a friend across a table.' },
  { v: 'Bright', body: 'Quicker and lighter. Good for mornings.' },
  { v: 'Low', body: 'Deep and calm. Good for late evenings.' },
]
const SEEKING: { value: Seeking; label: string }[] = [{ value: 'men', label: 'Men' }, { value: 'women', label: 'Women' }, { value: 'everyone', label: 'Everyone' }]
const QUIET = ['10 PM–9 AM', '11 PM–8 AM', '9 PM–7 AM', 'Off']
const LANGS = [{ l: 'English', ready: true }, { l: 'Español', ready: false }, { l: 'Français', ready: false }, { l: 'हिन्दी', ready: false }]

export function Settings() {
  const { s, update, reset } = useApp()
  const nav = useNav()
  const { toast } = useFeedback()
  const [playing, setPlaying] = useState<Voice | null>(null)
  const [sheet, setSheet] = useState<null | 'lang' | 'quiet' | 'about'>(null)
  const [last, setLast] = useState<'lang' | 'quiet' | 'about'>('lang')
  const [recast, setRecast] = useState<Seeking | null>(null)
  const [lastRecast, setLastRecast] = useState<Seeking>('women')
  const [signout, setSignout] = useState(false)
  const quiet = s.settings.quietHours ?? '10 PM–9 AM'
  useEffect(() => () => stopSpeaking(), [])

  const sample = (v: Voice) =>
    v === 'Warm' ? `Good evening, ${s.me.name}. Your letter arrives at dusk.`
    : v === 'Bright' ? `Morning, ${s.me.name}. Three people are being considered for tonight.`
    : `${s.me.name}, it’s quiet tonight. Take your time.`

  const play = (v: Voice) => {
    update(s => ({ ...s, me: { ...s.me, voice: v } }))
    if (s.settings.auraMuted) { toast('Aura is muted. Turn on “Aura speaks aloud” to hear her.'); return }
    setPlaying(v)
    const started = Date.now()
    speak(sample(v), { voice: v }).then(() => setTimeout(() => setPlaying(p => (p === v ? null : p)), Math.max(0, 1400 - (Date.now() - started))))
  }
  const open = (k: 'lang' | 'quiet' | 'about') => { setLast(k); setSheet(k) }
  const TITLE = { lang: 'Language', quiet: 'Quiet hours', about: 'About this prototype' }

  return (
    <Screen top={<TopBar title="Settings" />}>
      <div className="pad stack gap-24" style={{ paddingTop: 4 }}>
        <Section label="Aura’s voice">
          <div className="stack gap-8">
            {VOICES.map(({ v, body }) => {
              const on = s.me.voice === v
              return (
                <button key={v} className={`yu-option ${on ? 'on' : ''}`} onClick={() => play(v)} aria-pressed={on}>
                  <span className="row gap-12">
                    <Orb size={30} level={playing === v ? 0.5 : 0} />
                    <span className="grow stack" style={{ gap: 2 }}>
                      <span className="row gap-8"><span className="serif" style={{ fontSize: 21 }}>{v}</span>{on && <Tag tone="ember">Aura’s voice</Tag>}</span>
                      <span className="t-small muted">{body}</span>
                    </span>
                    {playing === v ? <Waveform level={0.6} bars={10} height={22} color="var(--ember)" /> : <Icon name="play" size={18} style={{ color: 'var(--ink-3)' }} />}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section label="Listening and speaking">
          <div>
            <ListRow icon={s.settings.auraMuted ? 'speakerOff' : 'speaker'} title="Aura speaks aloud" sub={s.settings.auraMuted ? 'Off. Aura’s words appear as text only.' : 'On. You can still read along.'} chevron={false}
              right={<Toggle on={!s.settings.auraMuted} label="Aura speaks aloud" onChange={v => { if (!v) stopSpeaking(); update(s => ({ ...s, settings: { ...s.settings, auraMuted: !v } })) }} />} />
            <ListRow icon="globe" title="Language" sub="English · more coming" onClick={() => open('lang')} />
          </div>
        </Section>

        <Section label="Notifications">
          <div>
            <ListRow icon="moon" title="Quiet hours" sub={quiet === 'Off' ? 'Off · everything comes through' : `${quiet} · safety messages always come through`} onClick={() => open('quiet')} />
            <ListRow icon="bell" title="Your notifications" sub={`${s.notifications.filter(n => !n.read).length} unread`} onClick={() => nav.push('sys/notifications')} />
          </div>
        </Section>

        <Section label="Who you’d like to meet">
          <Segmented value={s.me.seeking} options={SEEKING} onChange={v => { if (v !== s.me.seeking) { setLastRecast(v); setRecast(v) } }} />
          <span className="t-small muted">Changing this re-casts your whole story: tonight’s letter, your Table and your plans.</span>
        </Section>

        <div className="stack gap-8">
          <Button kind="ghost" block onClick={() => setSignout(true)}>Sign out</Button>
          <Button kind="quiet" block icon="info" onClick={() => open('about')}>About this prototype</Button>
        </div>
        <div className="t-num t-small faint center">L’Amour 0.9 · build 2026.10.14</div>
      </div>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={TITLE[last]}>
        <div className="stack gap-16" style={{ paddingBottom: 8 }}>
          {last === 'lang' && <>
            <div>
              {LANGS.map(l => (
                <ListRow key={l.l} title={l.l} chevron={false} onClick={() => (l.ready ? setSheet(null) : toast(`${l.l} is coming. We’ll tell you when it arrives.`))}
                  right={l.ready ? <Icon name="check" size={18} style={{ color: 'var(--sage)' }} /> : <Tag>Coming</Tag>} />
              ))}
            </div>
            <span className="t-small faint">Aura speaks and writes in English for now. The languages you speak are on your profile.</span>
          </>}
          {last === 'quiet' && <>
            <div className="stack gap-8">
              {QUIET.map(q => (
                <button key={q} className={`yu-option ${quiet === q ? 'on' : ''}`} aria-pressed={quiet === q}
                  onClick={() => { update(s => ({ ...s, settings: { ...s.settings, quietHours: q } })); setSheet(null); toast(q === 'Off' ? 'Quiet hours off.' : `Quiet from ${q.replace('–', ' to ')}.`) }}>
                  <span className="row between"><span className="t-num" style={{ fontSize: 15 }}>{q}</span>{quiet === q && <Icon name="check" size={18} style={{ color: 'var(--ember)' }} />}</span>
                </button>
              ))}
            </div>
            <span className="t-small muted pretty">Your letter waits until morning. “All well?” check-ins and anything from your Guardian Circle always come through.</span>
          </>}
          {last === 'about' && <>
            <p className="t-body pretty" style={{ margin: 0 }}>A clickable vision of L’Amour: a dating app with no feed and no swiping, where Aura gets to know you, writes you one letter at dusk, and plans the evening.</p>
            <ul className="yu-rules">
              <li>The people are fictional. Photos are licensed stand-ins.</li>
              <li>Aura’s voice uses your browser’s built-in speech. Your microphone is only used when you speak to her.</li>
              <li>Everything you do here stays on this device.</li>
              <li>Numbers and compatibility are computed live from each person’s details.</li>
            </ul>
            <Button kind="soft" block icon="refresh" onClick={() => { reset(s.me.seeking); setSheet(null); nav.reset('you/home'); toast('The story starts again from this afternoon.') }}>Start the story again</Button>
          </>}
        </div>
      </Sheet>

      <ConfirmSheet open={!!recast} onClose={() => setRecast(null)} kind="primary" title="Re-cast your story?" confirm={`Meet ${SEEKING.find(x => x.value === lastRecast)?.label.toLowerCase()}`}
        body="Tonight’s letter, your Table and your plans start again with new people. Your settings return to how they began."
        onConfirm={() => { reset(lastRecast); nav.reset('you/home'); toast('Re-cast. Your next letter has new people in it.') }} />

      <ConfirmSheet open={signout} onClose={() => setSignout(false)} kind="primary" title="Sign out?" confirm="Sign out"
        body="Your letter will wait for you. Nothing about you is kept on this phone once you’re out."
        onConfirm={() => { nav.reset('arrival/splash'); toast('Signed out. See you at dusk.') }} />
    </Screen>
  )
}

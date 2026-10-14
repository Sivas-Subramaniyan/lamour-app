// premium/membership: your tier, Date Pass credits and how the deposit works, Salons, the Monograph of Two, and honest, quick management.
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen, TopBar, Button, Segmented, Tag, Eyebrow, Section, ListRow, Sheet, PairAvatars, WaxSeal, useFeedback } from '../../design/ui'
import { Icon } from '../../design/icons'
import { useApp, useNow, fmtDay } from '../../state/store'
import { PERSONAS } from '../../data/personas'
import { venue } from '../../data/venues'
import { useNav } from '../../shell/nav'
import { BILLING, DEPOSIT, TIER_NAME, MONOGRAPH_CHAPTERS, pmOf, withPm, partnerId, renewOn, memberNo, type Billing } from './kit'

const ease = [0.22, 1, 0.36, 1] as const
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']
const TIER_LINE = {
  invitation: 'One introduction each evening, and everything that keeps you safe.',
  soiree: 'Your whole letter, every care note, and Aura holding tables while you decide.',
  maison: 'A matchmaker alongside Aura, Salons, and a concierge on call.',
} as const

export function Membership() {
  const { s, update } = useApp()
  const nav = useNav()
  const now = useNow(30000)
  const { toast } = useFeedback()
  const pm = pmOf(s)
  const billing = pm.billing ?? 'week'
  const b = BILLING[billing]
  const tier = s.me.tier
  const paid = tier !== 'invitation'
  const [sheet, setSheet] = useState<null | 'change' | 'cancel' | 'monograph'>(null)
  const [asking, setAsking] = useState(false)
  const [next, setNext] = useState<Billing>(billing)
  const closeSheet = () => { setSheet(null); setAsking(false) }
  const them = PERSONAS[partnerId(s)]
  const allot = tier === 'maison' ? 4 : tier === 'soiree' ? 2 : 0
  const n = s.me.datePasses
  const renew = fmtDay(renewOn(now, tier === 'maison' ? 'month' : billing))
  const price = tier === 'maison' ? '$399 / month' : `${b.price} / ${b.per}`
  const salon = venue('marrow')

  return (
    <Screen top={<TopBar back onBack={nav.canGoBack ? nav.pop : () => nav.goTab('you')} />}>
      <div className="pad stack gap-32" style={{ paddingTop: 4 }}>
        <div className="stack gap-20">
          <h1 className="t-title" style={{ margin: 0 }}>Your <span className="i">membership</span></h1>
          <motion.div className={`pm-card ${tier}`} style={{ transformPerspective: 900 }} initial={{ opacity: 0, y: 16, rotateX: 10 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.9, ease }}>
            <div className="row between" style={{ minHeight: 44 }}>
              <span className="t-label faint">L’Amour · {s.me.city}</span>
              {paid && <WaxSeal text={tier === 'maison' ? 'M' : 'S'} size={44} pressed={false} />}
            </div>
            <div className="pm-card-name">{TIER_NAME[tier]}</div>
            <div className="t-callout muted pretty">{TIER_LINE[tier]}</div>
            <hr className="hairline" />
            <div className="row between t-small">
              <span className="faint">Member No. <span className="t-num">{memberNo(s)}</span></span>
              <span className="muted">{paid ? <>Renews {renew} · <span className="t-num">{price}</span></> : 'Free, always'}</span>
            </div>
          </motion.div>
          {!paid && <Button block onClick={() => nav.push('premium/paywall', { reason: 'letter' })}>See Soirée</Button>}
        </div>

        <Section label="Date Passes">
          <div className="card card-pad stack gap-16">
            <div className="stack gap-4">
              <span className="serif" style={{ fontSize: 25, lineHeight: 1.15 }}>{WORDS[n] ?? n} Date Pass{n === 1 ? '' : 'es'} left</span>
              <span className="t-small muted">{allot ? `${WORDS[allot]} arrive on the 1st of each month.` : `Soirée adds two a month. Until then, the deposit is ${DEPOSIT}.`}</span>
            </div>
            <div className="row gap-8">
              {Array.from({ length: Math.max(allot, n, 1) }, (_, i) => (
                <motion.span key={i} className={`pm-pass ${i < n ? 'on' : ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                  <Icon name="ticket" size={18} />
                </motion.span>
              ))}
            </div>
            <hr className="hairline" />
            <Eyebrow>How the deposit works</Eyebrow>
            <ol className="pm-steps">
              <li><b>When you seal an evening,</b> each of you puts down {DEPOSIT}. A Date Pass covers yours.</li>
              <li><b>When you both check in,</b> it comes back to you as credit at the venue.</li>
              <li><b>If one of you doesn’t come,</b> their deposit goes to the person who did.</li>
            </ol>
          </div>
          <div className="card-flat card-pad row between gap-16">
            <div className="stack gap-4"><Eyebrow>Venue credit earned</Eyebrow><span className="t-small muted">Two evenings where you both showed up. Spend it at any partner venue.</span></div>
            <span className="pm-credit t-num">$30</span>
          </div>
        </Section>

        <Section label="Salons">
          <div className="theme-night pm-salon stack gap-12">
            <div className="row between"><span className="t-label faint">Salon No. 4 · by invitation</span>{pm.salon && <Tag tone="sage" icon="check">Seat requested</Tag>}</div>
            <div className="t-head">Dinner <span className="i">for six</span></div>
            <div className="t-small muted">Thursday 29 October · <span className="t-num">7:30 PM</span> · {salon.name}, {salon.hood}</div>
            <p className="t-callout pretty" style={{ margin: 0 }}>Six members, one long table, and a host who makes the introductions. Nobody is matched; everyone is met.</p>
            {pm.salon
              ? <Button kind="quiet" onClick={() => { update(st => withPm(st, { salon: false })); toast('Request withdrawn. Your seat goes to the next person.') }}>Withdraw my request</Button>
              : <Button kind="commit" block onClick={() => { update(st => withPm(st, { salon: true })); toast('Requested. The host replies by Monday.') }}>Request a seat</Button>}
          </div>
        </Section>

        <Section label="Monograph of Two">
          <div className="card card-pad stack gap-16">
            <div className="row between">
              <PairAvatars a={{ photo: s.me.photos[0], name: s.me.name }} b={{ photo: them.photos.portrait, name: them.first }} size={42} />
              {pm.monograph && <Tag tone="ember">Waiting for {them.first}</Tag>}
            </div>
            <div className="stack gap-8">
              <div className="t-head i">A Monograph of Two</div>
              <p className="t-callout muted pretty" style={{ margin: 0 }}>A long-form report for a couple, written from what you’ve both shared. Both of you must approve before a page is written.</p>
            </div>
            <Button kind="ghost" size="md" block onClick={() => setSheet('monograph')}>Preview the chapters</Button>
          </div>
        </Section>

        <Section label="Manage">
          <div className="card" style={{ padding: '4px 18px' }}>
            {paid ? (
              <>
                <ListRow icon="refresh" title="Change plan" sub={tier === 'maison' ? '$399 / month' : `${b.adj} · ${b.price}`} onClick={() => { setNext(billing); setSheet('change') }} />
                <ListRow icon="close" title="Cancel membership" sub="Two taps. Nothing you rely on changes." onClick={() => setSheet('cancel')} />
              </>
            ) : (
              <>
                <ListRow icon="star" title="Begin Soirée" sub="From $12.99 a week" onClick={() => nav.push('premium/paywall', { reason: 'letter' })} />
                <ListRow icon="feather" title="Maison" sub="By application · $399 a month" onClick={() => nav.push('premium/paywall', { reason: 'depth' })} />
              </>
            )}
          </div>
          <p className="t-small faint pretty" style={{ margin: 0 }}>Safety, verification, your data rights, the debrief, closing kindly and any active date are never behind a paywall.</p>
        </Section>
      </div>

      <Sheet open={sheet === 'monograph'} onClose={closeSheet} title="Monograph of Two">
        {!asking ? (
          <div className="stack gap-20">
            <ol className="pm-chapters big">{MONOGRAPH_CHAPTERS.map(c => <li key={c}>{c}</li>)}</ol>
            <p className="t-small faint" style={{ margin: 0 }}>The numbers sit in their own chapter and never change what the rest says. Either of you can withdraw it at any time.</p>
            {pm.monograph
              ? <div className="row gap-8 t-callout muted"><Icon name="hourglass" size={18} /> Waiting for {them.first}. Nothing is written until you both say yes.</div>
              : paid
                ? <Button kind="commit" block onClick={() => setAsking(true)}>Ask {them.first} to approve</Button>
                : <Button kind="ember" block onClick={() => { closeSheet(); nav.push('premium/paywall', { reason: 'depth' }) }}>Included with Soirée</Button>}
          </div>
        ) : (
          <div className="stack gap-16">
            <p className="t-body pretty" style={{ margin: 0 }}>Aura will ask {them.first} whether you two would like a Monograph. If the answer is no, it stays unwritten, and that’s all either of you will see.</p>
            <Button kind="commit" block onClick={() => { update(st => withPm(st, { monograph: true })); closeSheet(); toast('Asked. Nothing is written until you both say yes.') }}>Send the request</Button>
            <Button kind="quiet" block onClick={() => setAsking(false)}>Not yet</Button>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'change'} onClose={closeSheet} title="Change plan">
        <div className="stack gap-20">
          {tier === 'maison' && <p className="t-callout muted" style={{ margin: 0 }}>Maison is billed monthly. Moving to Soirée keeps your letter and care notes, without the matchmaker.</p>}
          <Segmented value={next} onChange={setNext} options={(Object.keys(BILLING) as Billing[]).map(k => ({ value: k, label: BILLING[k].label }))} />
          <div className="row between">
            <span><span className="pm-price t-num">{BILLING[next].price}</span><span className="muted"> / {BILLING[next].per}</span></span>
            <span className="t-small faint">{BILLING[next].note}</span>
          </div>
          <p className="t-small faint" style={{ margin: 0 }}>The change starts at your next renewal, {renew}. Nothing is charged today.</p>
          <Button kind="commit" block disabled={tier === 'soiree' && next === billing}
            onClick={() => { update(st => withPm({ ...st, me: { ...st.me, tier: 'soiree' } }, { billing: next })); closeSheet(); toast(`Changed. From ${renew}, ${BILLING[next].price} a ${BILLING[next].per}.`) }}>
            {tier === 'maison' ? 'Move to Soirée' : 'Save'}
          </Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'cancel'} onClose={closeSheet} title="Cancel membership">
        <div className="stack gap-20">
          <p className="t-body pretty" style={{ margin: 0 }}>{TIER_NAME[tier]} ends today and we refund the days you haven’t used. From tomorrow, your letter opens one introduction a night.</p>
          <div className="card-flat card-pad stack gap-8">
            <Eyebrow>Stays exactly as it is</Eyebrow>
            {['Safety and your Guardian Circle', 'Your data, and your rights to it', 'Any evening already sealed', 'Your chairs and conversations'].map(x => (
              <div key={x} className="row gap-8 t-callout"><Icon name="check" size={16} stroke={2} style={{ color: 'var(--sage)' }} />{x}</div>
            ))}
          </div>
          <Button block onClick={() => { update(st => ({ ...st, me: { ...st.me, tier: 'invitation' } })); closeSheet(); toast('Cancelled. Unused days are on their way back to you.') }}>Cancel membership</Button>
          <Button kind="quiet" block onClick={closeSheet}>Keep {TIER_NAME[tier]}</Button>
        </div>
      </Sheet>
    </Screen>
  )
}

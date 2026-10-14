import type { ScreenDef } from '../../shell/screens'
import { Paywall } from './Paywall'
import { Membership } from './Membership'
import { Success } from './Success'
import './premium.css'

export const screens: ScreenDef[] = [
  {
    id: 'premium/paywall', title: 'Soirée offer', component: Paywall, theme: 'night', presentation: 'modal', pillars: ['Business', 'Trust'],
    note: 'Contextual: the top shows exactly what you just tapped, veiled. Membership sells depth and time; safety, verification, data rights and any active date are never behind it.',
    real: 'params.reason (letter, care, autonomy, depth) sets the hero from live data; billing toggle; a wallet-style confirm sets your tier to Soirée.',
  },
  {
    id: 'premium/membership', title: 'Your membership', component: Membership, theme: 'day', pillars: ['Business', 'Trust'],
    note: 'Date Pass deposits make no-shows costly and showing up rewarding. Cancelling takes two taps and says plainly what stays.',
    real: 'Tier, Date Pass credits, Salon request, Monograph approval and plan changes all write to app state.',
  },
  {
    id: 'premium/success', title: 'Welcome to Soirée', component: Success, theme: 'night', presentation: 'fade', pillars: ['Business'],
    note: 'A quiet ceremony instead of confetti: the seal presses in and tonight’s veiled introductions come into focus.',
    real: 'Chime and haptic; tonight’s introductions read from the letter.',
  },
]

import type { ScreenDef } from '../../shell/screens'
import { SignatureReveal } from './Signature'

export const screens: ScreenDef[] = [
  {
    id: 'conv/signature', title: 'Signature reveal', component: SignatureReveal, theme: 'night', presentation: 'fade',
    pillars: ['Personality'],
    note: 'The knowledge graph made visible. The figure is deterministic from the user’s traits, so two people never share a Signature.',
    real: 'Chladni figure computed from trait bands; grains settle on nodal lines in real time.',
  },
]

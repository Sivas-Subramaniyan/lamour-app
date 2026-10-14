// Fictional partner venues for the prototype (names invented; photos are stand-ins).
// x/y place them on the stylised map (0–100). Homes are never placed on the map.
import { VENUE_PHOTOS } from './photos'

export type Venue = {
  id: string
  name: string
  kind: string
  hood: string
  price: 1 | 2 | 3
  noise: 'hushed' | 'conversational' | 'lively'
  why: string // why Aura picked it, in plain words
  perk?: string // partner perk
  details: string[] // practical, safety-minded facts
  x: number
  y: number
  photo: number // index into VENUE_PHOTOS
}

export const VENUES: Venue[] = [
  { id: 'lantern', name: 'The Lantern Room', kind: 'Natural-wine bar', hood: 'West Village', price: 2, noise: 'conversational',
    why: 'Candlelit, small plates you can share, and quiet enough to hear each other. You both said loud rooms make first dates harder.',
    perk: 'A glass of something orange on the house', details: ['Well-lit corner, 2 min from the subway', 'Vegetarian-friendly menu', 'Table held under first names only'], x: 38, y: 46, photo: 0 },
  { id: 'kiln', name: 'Kiln Street Café', kind: 'Ceramic studio café', hood: 'Dumbo', price: 1, noise: 'conversational',
    why: 'A café inside a working studio. If you both like making things with your hands, it gives you something to do besides talk.',
    perk: 'Paint-a-cup for two', details: ['Daylight hours, big windows', 'Step-free entrance', 'Open until 9 PM on weekends'], x: 58, y: 62, photo: 6 },
  { id: 'oriole', name: 'Oriole Listening Bar', kind: 'Vinyl listening bar', hood: 'Lower East Side', price: 2, noise: 'hushed',
    why: 'Records over chatter. A good fit if you’d both rather listen than shout, and it gives you an easy first topic.',
    details: ['Hosts walk you to your seat', 'Non-alcoholic pairings on request', 'Coat check'], x: 52, y: 44, photo: 7 },
  { id: 'sable', name: 'Sable', kind: 'Eight-seat omakase counter', hood: 'Nolita', price: 3, noise: 'hushed',
    why: 'Side-by-side seating takes the pressure off eye contact, and the chef gives you something to talk about between courses.',
    perk: 'Welcome sake for L’Amour members', details: ['Fixed 90-minute seating', 'Dietary notes shared in advance, not your names', 'Deposit refundable to 24h'], x: 47, y: 40, photo: 3 },
  { id: 'glasshouse', name: 'The Glasshouse', kind: 'Garden café', hood: 'Brooklyn Heights', price: 2, noise: 'conversational',
    why: 'A greenhouse café for a daytime first meeting. Easy to leave, easy to stay.',
    details: ['Daytime only', 'Outdoor seating with heaters', 'Busy, public, well staffed'], x: 55, y: 70, photo: 4 },
  { id: 'paperback', name: 'Paperback Garden', kind: 'Bookshop & wine', hood: 'Carroll Gardens', price: 1, noise: 'conversational',
    why: 'Browse first, sit after. Bookshops give you a hundred conversation starters on the shelves.',
    details: ['Quiet weekday evenings', 'Small plates', 'On a busy, lit street'], x: 49, y: 77, photo: 5 },
  { id: 'halcyon', name: 'Halcyon Counter', kind: 'Jazz supper club', hood: 'Harlem', price: 2, noise: 'lively',
    why: 'Live trio, early set at 7. Good for people who like music more than small talk.',
    perk: 'Reserved two-top near the stage', details: ['Early set ends 8:30', 'Booths with good sightlines', 'Five minutes from the A train'], x: 44, y: 12, photo: 2 },
  { id: 'marrow', name: 'Marrow & Fig', kind: 'Neighbourhood bistro', hood: 'Fort Greene', price: 2, noise: 'conversational',
    why: 'Seasonal menu, warm room, and a chef who changes the bread daily. You both rate food as a love language.',
    details: ['Corner tables by request', 'Open kitchen', 'Late cancellations: 24h'], x: 63, y: 66, photo: 1 },
]

export const venue = (id: string) => VENUES.find(v => v.id === id)!
export const venuePhoto = (v: Venue) => VENUE_PHOTOS[v.photo]

import type { ScreenDef } from '../../shell/screens'
import { Notifications } from './Notifications'
import { Lockscreen } from './Lockscreen'
import { States } from './States'
import './system.css'

export const screens: ScreenDef[] = [
  {
    id: 'sys/notifications', title: 'Notifications', component: Notifications, theme: 'day', pillars: ['Trust', 'Actions'],
    note: 'Aura writes only when something needs you, never overnight. Quiet hours and Discreet Mode are stated where you read your notifications.',
    real: 'Lists live notifications from app state, grouped by the demo clock; tapping opens the screen and marks it read.',
  },
  {
    id: 'sys/lockscreen', title: 'Lock screen', component: Lockscreen, theme: 'night', presentation: 'fade', pillars: ['Trust', 'Actions'],
    note: 'A week of L’Amour as it reaches your lock screen. Discreet Mode swaps every card for a nameless one, because a phone on a table is public.',
    real: 'Live clock; names, venues and times from data; Discreet writes your setting; each tap moves the demo story to that moment and opens the screen.',
  },
  {
    id: 'sys/states', title: 'Honest states', component: States, theme: 'day', pillars: ['Trust'],
    note: 'Every empty and broken moment says what happened and offers a real way forward. “Better none than nearly” shows what was ruled out, and why.',
    real: 'Loosening a rule or naming three evenings writes your preferences; the microphone retry asks the browser for real.',
  },
]

import type { ArenaDefinition } from '../types'

export const ARENAS: ArenaDefinition[] = [
  {
    id: 'rooftop',
    name: 'NEON ROOFTOP',
    subtitle: 'SKYLINE DISTRICT // 02:14 AM',
    description:
      'A rain-slick rooftop above a city that never sleeps. Neon signs buzz, the wind howls, and somebody definitely left the samosa box up here.',
    accent: '#a855f7',
    secondary: '#22d3ee',
    ambience: 'City hum, distant sirens, neon buzz',
  },
  {
    id: 'canteen',
    name: 'SCHOOL CANTEEN',
    subtitle: 'PERIOD 5 // LUNCH BREAK',
    description:
      'The sacred battlefield of every school: plastic chairs, suspicious curry, and a menu board that has not changed since 2014.',
    accent: '#fbbf24',
    secondary: '#f97316',
    ambience: 'Crowd chatter, trays clattering, bell',
  },
  {
    id: 'indore',
    name: 'INDORE SHOWDOWN',
    subtitle: 'SARRAFA BAZAAR // FESTIVAL NIGHT',
    description:
      'A fictionalised street festival full of colour, hanging lights, chai stalls and a crowd that will absolutely rate the fight out of ten.',
    accent: '#f472b6',
    secondary: '#fbbf24',
    ambience: 'Crowd cheers, dhol, street vendors',
  },
]

export const arenaById = (id: string) => ARENAS.find((a) => a.id === id) ?? ARENAS[0]

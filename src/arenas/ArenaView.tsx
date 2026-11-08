import type { ArenaId, GraphicsQuality } from '../types'
import { NeonRooftop } from './NeonRooftop'
import { SchoolCanteen } from './SchoolCanteen'
import { IndoreShowdown } from './IndoreShowdown'

export function ArenaView({ arenaId, quality }: { arenaId: ArenaId; quality: GraphicsQuality }) {
  if (arenaId === 'canteen') return <SchoolCanteen quality={quality} />
  if (arenaId === 'indore') return <IndoreShowdown quality={quality} />
  return <NeonRooftop quality={quality} />
}

import type { CharacterDefinition } from '../types'

type Mood = 'neutral' | 'happy' | 'angry' | 'hurt'

export function FighterPortrait({
  character,
  className = '',
  mood = 'neutral',
}: {
  character: CharacterDefinition
  className?: string
  mood?: Mood
}) {
  const { appearance, accent } = character
  const { skin, hair, hairStyle, outfit, outfitSecondary, accessory } = appearance
  const uid = `portrait-${character.id}`
  const browTilt = mood === 'angry' ? 7 : mood === 'hurt' ? -5 : 0
  const mouthPath =
    mood === 'happy'
      ? 'M50 77 Q60 85 70 77'
      : mood === 'angry'
        ? 'M51 79 Q60 74 69 79'
        : mood === 'hurt'
          ? 'M51 80 Q60 74 69 80'
          : 'M52 78 Q60 82 68 78'

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`${character.name} portrait`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={character.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${uid}-outfit`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={outfit} />
          <stop offset="100%" stopColor={outfitSecondary} />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${uid}-bg)`} />
      <circle cx="60" cy="58" r="44" fill={accent} opacity="0.06" />

      {/* shoulders */}
      <path d="M14 120 Q18 93 60 92 Q102 93 106 120 Z" fill={`url(#${uid}-outfit)`} />
      <path d="M14 120 Q18 93 60 92 Q102 93 106 120 Z" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M46 96 L52 108 L60 100 L68 108 L74 96" fill="none" stroke={outfitSecondary} strokeWidth="2" opacity="0.8" />
      <circle cx="60" cy="108" r="4" fill={accent} opacity="0.9" />

      {/* neck + ears */}
      <rect x="52" y="78" width="16" height="17" rx="6" fill={skin} />
      <circle cx="32" cy="61" r="6" fill={skin} />
      <circle cx="88" cy="61" r="6" fill={skin} />

      {/* head */}
      <ellipse cx="60" cy="56" rx="27" ry="30" fill={skin} />
      <ellipse cx="60" cy="56" rx="27" ry="30" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="1.5" />

      {/* hair */}
      {hairStyle === 'quiff' && (
        <>
          <path d="M33 52 Q31 27 60 24 Q89 27 88 52 Q80 38 68 39 Q60 27 49 39 Q38 38 33 52Z" fill={hair} />
          <path d="M44 34 Q48 19 58 24 Q54 30 52 37Z" fill={hair} />
          <path d="M60 30 Q67 16 76 26 Q68 29 65 37Z" fill={hair} />
          <path d="M72 36 Q82 24 87 38 Q78 36 75 43Z" fill={hair} />
        </>
      )}
      {hairStyle === 'swoop' && (
        <>
          <path d="M32 53 Q28 25 61 23 Q91 25 90 50 Q82 32 66 36 Q56 27 45 41 Q38 44 32 53Z" fill={hair} />
          <path d="M62 31 Q78 30 88 46 Q84 38 74 38 Q66 35 62 31Z" fill={hair} opacity="0.9" />
        </>
      )}
      {hairStyle === 'fade' && (
        <>
          <path d="M34 49 Q34 27 60 25 Q86 27 86 49 Q78 35 60 35 Q42 35 34 49Z" fill={hair} />
          <path d="M35 45 Q33 53 36 60 L39 58 Q37 51 39 45Z" fill={hair} />
          <path d="M85 45 Q87 53 84 60 L81 58 Q83 51 81 45Z" fill={hair} />
        </>
      )}
      {hairStyle === 'ponytail' && (
        <>
          <path d="M31 55 Q29 25 60 23 Q91 25 89 55 Q82 36 60 35 Q38 36 31 55Z" fill={hair} />
          <ellipse cx="94" cy="59" rx="8" ry="17" fill={hair} transform="rotate(-16 94 59)" />
          <ellipse cx="98" cy="77" rx="6" ry="15" fill={hair} transform="rotate(-10 98 77)" />
          <circle cx="89" cy="48" r="3.5" fill={accent} />
          <path d="M93 60 Q98 66 96 76" stroke={accent} strokeWidth="2" fill="none" opacity="0.9" />
        </>
      )}
      {hairStyle === 'curls' && (
        <>
          <path d="M32 52 Q32 27 60 24 Q88 27 88 52 Q78 36 60 36 Q42 36 32 52Z" fill={hair} />
          {[
            [41, 31, 8],
            [53, 26, 9],
            [66, 26, 9],
            [78, 31, 8],
            [35, 42, 7],
            [85, 42, 7],
            [47, 33, 6],
            [73, 33, 6],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={hair} />
          ))}
        </>
      )}

      {/* eyes */}
      <ellipse cx="49" cy="57" rx="5.2" ry="6.2" fill="#f8fafc" />
      <ellipse cx="71" cy="57" rx="5.2" ry="6.2" fill="#f8fafc" />
      <circle cx={mood === 'hurt' ? 50 : 49.5} cy="58" r="2.5" fill="#101018" />
      <circle cx={mood === 'hurt' ? 72 : 71.5} cy="58" r="2.5" fill="#101018" />
      <circle cx="50.4" cy="56.8" r="0.8" fill="#fff" />
      <circle cx="72.4" cy="56.8" r="0.8" fill="#fff" />

      {/* brows */}
      <path
        d={`M43 ${47 + browTilt * 0.25} L55 ${46 - browTilt * 0.25}`}
        stroke={hair}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d={`M65 ${46 - browTilt * 0.25} L77 ${47 + browTilt * 0.25}`}
        stroke={hair}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* nose + mouth */}
      <path d="M60 60 L57 68 Q60 70 63 68" fill="none" stroke={skin} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d={mouthPath} fill="none" stroke="#3b1220" strokeWidth="2.6" strokeLinecap="round" />
      {mood === 'happy' && <path d="M52 78 Q60 82 68 78 Q60 88 52 78Z" fill="#3b1220" opacity="0.85" />}

      {/* accessory */}
      {accessory === 'headphones' && (
        <>
          <path d="M31 49 Q31 22 60 22 Q89 22 89 49" fill="none" stroke={outfitSecondary} strokeWidth="5" strokeLinecap="round" />
          <rect x="25" y="50" width="12" height="20" rx="5" fill={outfitSecondary} />
          <rect x="83" y="50" width="12" height="20" rx="5" fill={outfitSecondary} />
          <circle cx="31" cy="60" r="3" fill={accent} />
          <circle cx="89" cy="60" r="3" fill={accent} />
        </>
      )}
      {accessory === 'glasses' && (
        <>
          <rect x="40" y="50" width="17" height="13" rx="3" fill="#0b1220" fillOpacity="0.85" stroke={accent} strokeWidth="1.5" />
          <rect x="63" y="50" width="17" height="13" rx="3" fill="#0b1220" fillOpacity="0.85" stroke={accent} strokeWidth="1.5" />
          <path d="M57 56 L63 56" stroke={accent} strokeWidth="1.5" />
          <path d="M40 56 L33 54 M80 56 L87 54" stroke={accent} strokeWidth="1.5" />
        </>
      )}
      {accessory === 'earrings' && (
        <>
          <circle cx="32" cy="70" r="3.4" fill={accent} />
          <circle cx="88" cy="70" r="3.4" fill={accent} />
          <path d="M32 66 L32 70 M88 66 L88 70" stroke={accent} strokeWidth="1.5" />
        </>
      )}
      {accessory === 'visor' && (
        <>
          <rect x="38" y="50" width="44" height="14" rx="5" fill="#07101d" stroke={accent} strokeWidth="1.2" />
          <rect x="41" y="54" width="38" height="5" rx="2.5" fill={accent} opacity="0.85" />
        </>
      )}
      {accessory === 'backpack' && (
        <>
          <path d="M30 100 Q26 92 34 90 L42 92" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <path d="M90 100 Q94 92 86 90 L78 92" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <rect x="86" y="102" width="12" height="16" rx="4" fill={accent} opacity="0.8" />
        </>
      )}
    </svg>
  )
}

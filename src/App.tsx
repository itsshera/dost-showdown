import { useEffect, type ReactNode } from 'react'
import { MainMenu } from './screens/MainMenu'
import { CharacterSelect } from './screens/CharacterSelect'
import { PowerLab } from './screens/PowerLab'
import { HowToPlay } from './screens/HowToPlay'
import { SettingsScreen } from './screens/Settings'
import { GameScreen } from './screens/GameScreen'
import { OnlineGameScreen } from './screens/OnlineGameScreen'
import { Results } from './screens/Results'
import { OnlineLobby } from './screens/OnlineLobby'
import { useNavStore } from './store/useNavStore'
import { useSettingsStore } from './store/useSettingsStore'
import { audio } from './audio/AudioEngine'

export function App() {
  const screen = useNavStore((s) => s.screen)
  const mode = useNavStore((s) => s.session.mode)
  const settings = useSettingsStore()

  // Keep the synthesised audio engine in sync with persisted settings.
  useEffect(() => {
    audio.configure({
      master: settings.masterVolume,
      music: settings.musicVolume,
      sfx: settings.sfxVolume,
      muted: settings.muted,
    })
  }, [settings.masterVolume, settings.musicVolume, settings.sfxVolume, settings.muted])

  // Browsers only allow audio after a user gesture. Prime it on the first tap.
  useEffect(() => {
    const prime = () => {
      audio.init()
      audio.configure({
        master: useSettingsStore.getState().masterVolume,
        music: useSettingsStore.getState().musicVolume,
        sfx: useSettingsStore.getState().sfxVolume,
        muted: useSettingsStore.getState().muted,
      })
    }
    window.addEventListener('pointerdown', prime, { once: true })
    window.addEventListener('keydown', prime, { once: true })
    return () => {
      window.removeEventListener('pointerdown', prime)
      window.removeEventListener('keydown', prime)
    }
  }, [])

  let content: ReactNode
  switch (screen) {
    case 'select':
      content = <CharacterSelect />
      break
    case 'powerlab':
      content = <PowerLab />
      break
    case 'howto':
      content = <HowToPlay />
      break
    case 'settings':
      content = <SettingsScreen />
      break
    case 'game':
      content = mode === 'online' ? <OnlineGameScreen /> : <GameScreen />
      break
    case 'results':
      content = <Results />
      break
    case 'online':
      content = <OnlineLobby />
      break
    case 'menu':
    default:
      content = <MainMenu />
      break
  }

  return (
    <div key={screen} className="screen-enter absolute inset-0">
      {content}
    </div>
  )
}

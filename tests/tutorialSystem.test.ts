import { describe, it, expect } from 'vitest'
import {
  createTutorialState,
  deliver,
  setEnabled,
} from '../src/systems/TutorialSystem'
import { TUTORIAL_MESSAGES } from '../src/data/tutorialMessages'

describe('S.A.F.E. data', () => {
  it('catalog has a non-empty welcome message with a unique id', () => {
    const welcome = TUTORIAL_MESSAGES.filter((m) => m.event === 'welcome')
    expect(welcome).toHaveLength(1)
    expect(welcome[0].id).toBe('safe.welcome')
    expect(welcome[0].text.length).toBeGreaterThan(20)
    const ids = TUTORIAL_MESSAGES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('S.A.F.E. delivery', () => {
  it('delivers the welcome message exactly once (no spam)', () => {
    const s = createTutorialState()
    const first = deliver(s, 'welcome')
    expect(first?.id).toBe('safe.welcome')
    expect(deliver(s, 'welcome')).toBeNull() // second fire is silent
    expect(deliver(s, 'welcome')).toBeNull()
  })

  it('disabled state delivers nothing and records nothing', () => {
    const s = createTutorialState(false)
    expect(deliver(s, 'welcome')).toBeNull()
    expect(s.delivered.size).toBe(0)
  })

  it('re-enabling after disable allows delivery', () => {
    const s = createTutorialState(false)
    setEnabled(s, true)
    expect(deliver(s, 'welcome')?.id).toBe('safe.welcome')
  })

  it('unknown events deliver nothing', () => {
    const s = createTutorialState()
    expect(deliver(s, 'firstBuilding' as never)).toBeNull()
    // the welcome message is still available afterwards
    expect(deliver(s, 'welcome')).not.toBeNull()
  })

  it('restart = new session = welcome may fire again', () => {
    const s1 = createTutorialState()
    expect(deliver(s1, 'welcome')).not.toBeNull()
    const s2 = createTutorialState()
    expect(deliver(s2, 'welcome')).not.toBeNull()
  })
})

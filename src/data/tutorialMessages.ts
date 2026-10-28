// S.A.F.E. — Survival Advice For Everyone.
// The neighborhood's fictional municipal advisory system: cheerfully
// bureaucratic, overconfident, and spectacularly unhelpful.
//
// DATA ONLY — no Phaser, no gameplay logic. Messages are keyed by event and
// delivered event-triggered by TutorialSystem (see src/systems/).

export type TutorialEvent = 'welcome' | 'zombie.chased'
// Future events (one message each, delivered when the event fires):
// | 'firstBuilding' | 'firstDoor' | ...

export interface TutorialMessage {
  id: string
  event: TutorialEvent
  text: string
}

export const TUTORIAL_MESSAGES: TutorialMessage[] = [
  {
    id: 'safe.welcome',
    event: 'welcome',
    text:
      'Welcome to Nowhere. Please remain calm. Our records indicate panic ' +
      'has a disappointing success rate.',
  },
  {
    id: 'safe.zombie',
    event: 'zombie.chased',
    text:
      'You are being followed. This is not a commentary on your life ' +
      'choices. Recommended response: run. We will not be liable for what ' +
      'happens next.',
  },
]

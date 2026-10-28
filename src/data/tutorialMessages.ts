// S.A.F.E. — Survival Advice For Everyone.
// The neighborhood's fictional municipal advisory system: cheerfully
// bureaucratic, overconfident, and spectacularly unhelpful.
//
// DATA ONLY — no Phaser, no gameplay logic. Messages are keyed by event and
// delivered event-triggered by TutorialSystem (see src/systems/).

export type TutorialEvent =
  | 'welcome'
  | 'zombie.chased'
  | 'first.eat'
  | 'first.heal'
// Future events (one message each, delivered when the event fires):
// | 'hunger.low' | 'first.loot' | 'firstBuilding' | 'firstDoor' | ...

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
  {
    id: 'safe.eat',
    event: 'first.eat',
    text:
      'We have logged that you ate. Our actuaries find this to be the ' +
      'soundest decision you have made today. You are welcome, eventually.',
  },
  {
    id: 'safe.heal',
    event: 'first.heal',
    text:
      'You are treating a wound. Excellent. Note that the bandage is, and ' +
      'has always been, a bandage. It is not a tourniquet. We cannot stress ' +
      'this enough.',
  },
]

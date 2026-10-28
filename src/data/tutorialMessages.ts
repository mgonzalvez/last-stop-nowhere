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
  | 'first.loot'
  | 'hunger.low'
  | 'weapon.broke'
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
  {
    id: 'safe.loot',
    event: 'first.loot',
    text:
      'You are searching a container. Please note that nothing in Nowhere '
      + 'is signed, sealed, or owned. Property is, for administrative '
      + 'reasons, a rumor.',
  },
  {
    id: 'safe.hunger',
    event: 'hunger.low',
    text:
      'Advisory: your hunger level has entered the "concerned" range. The '
      + 'municipal pantry is located directly behind your left shoulder, in '
      + 'the direction you are least likely to look. We wish you luck.',
  },
  {
    id: 'safe.broke',
    event: 'weapon.broke',
    text:
      'Advisory: a tool you were holding has broken. Please be assured that '
      + 'tools are expected to break. Also expected, but rarely on schedule, '
      + 'is the breakage of hope. A replacement is probably inside one of '
      + 'the containers that still rattle when tapped.',
  },
]

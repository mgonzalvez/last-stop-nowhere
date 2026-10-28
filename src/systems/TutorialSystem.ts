// S.A.F.E. delivery logic: pure, Phaser-free, deterministic.
// Event-triggered, one-shot (each message delivers at most once per
// session), and globally disable-able.
import {
  TUTORIAL_MESSAGES,
  type TutorialEvent,
  type TutorialMessage,
} from '../data/tutorialMessages'

export interface TutorialState {
  enabled: boolean
  /** ids of messages already delivered this session */
  delivered: Set<string>
}

export function createTutorialState(enabled = true): TutorialState {
  return { enabled, delivered: new Set() }
}

/**
 * Deliver the message for `event`, or null when the system is disabled,
 * the event has no message, or it was already delivered.
 */
export function deliver(
  state: TutorialState,
  event: TutorialEvent,
): TutorialMessage | null {
  if (!state.enabled) return null
  const msg = TUTORIAL_MESSAGES.find(
    (m) => m.event === event && !state.delivered.has(m.id),
  )
  if (!msg) return null
  state.delivered.add(msg.id)
  return msg
}

export function setEnabled(state: TutorialState, enabled: boolean): void {
  state.enabled = enabled
}

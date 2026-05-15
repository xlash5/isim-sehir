export interface RuleSection {
  key: string
  titleKey: string
  bodyKey: string
}

export const RULE_SECTIONS: RuleSection[] = [
  { key: 'objective', titleKey: 'rules.objective.title', bodyKey: 'rules.objective.body' },
  { key: 'phases', titleKey: 'rules.phases.title', bodyKey: 'rules.phases.body' },
  { key: 'scoring', titleKey: 'rules.scoring.title', bodyKey: 'rules.scoring.body' },
  { key: 'grading', titleKey: 'rules.grading.title', bodyKey: 'rules.grading.body' },
  { key: 'admin', titleKey: 'rules.admin.title', bodyKey: 'rules.admin.body' },
  { key: 'spectator', titleKey: 'rules.spectator.title', bodyKey: 'rules.spectator.body' },
  { key: 'passwords', titleKey: 'rules.passwords.title', bodyKey: 'rules.passwords.body' },
  { key: 'letters', titleKey: 'rules.letters.title', bodyKey: 'rules.letters.body' },
]

export const FIRST_VISIT_KEY = 'has-seen-rules'
export const GAMES_PLAYED_KEY = 'games-played-count'
export const SPECTATOR_TIP_KEY = 'has-seen-spectator-tip'

export function isFirstVisit(): boolean {
  return !localStorage.getItem(FIRST_VISIT_KEY)
}

export function markRulesSeen(): void {
  localStorage.setItem(FIRST_VISIT_KEY, 'true')
}

export function getGamesPlayedCount(): number {
  return Number(localStorage.getItem(GAMES_PLAYED_KEY)) || 0
}

export function incrementGamesPlayed(): void {
  localStorage.setItem(GAMES_PLAYED_KEY, String(getGamesPlayedCount() + 1))
}

export function hasSeenSpectatorTip(): boolean {
  return !!localStorage.getItem(SPECTATOR_TIP_KEY)
}

export function markSpectatorTipSeen(): void {
  localStorage.setItem(SPECTATOR_TIP_KEY, 'true')
}

import { describe, it, expect } from 'vitest'
import { useNotificationStore } from '../../stores/useNotificationStore'

describe('useNotificationStore', () => {
  it('starts with null message and info severity', () => {
    const state = useNotificationStore.getState()
    expect(state.message).toBeNull()
    expect(state.severity).toBe('info')
  })

  it('show sets message and severity', () => {
    useNotificationStore.getState().show('Hello', 'error')
    const state = useNotificationStore.getState()
    expect(state.message).toBe('Hello')
    expect(state.severity).toBe('error')
  })

  it('show defaults severity to info', () => {
    useNotificationStore.getState().show('Test')
    const state = useNotificationStore.getState()
    expect(state.message).toBe('Test')
    expect(state.severity).toBe('info')
  })

  it('dismiss clears message and resets severity', () => {
    useNotificationStore.getState().show('Hello', 'warning')
    useNotificationStore.getState().dismiss()
    const state = useNotificationStore.getState()
    expect(state.message).toBeNull()
    expect(state.severity).toBe('info')
  })
})

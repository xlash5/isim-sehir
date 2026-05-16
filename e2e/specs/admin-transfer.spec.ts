import { test, expect } from '@playwright/test'
import { createPage, createRoom, joinRoom, waitForPlayers } from '../fixtures'

test('admin transfer on disconnect', async ({ browser }) => {
  const hostPage = await createPage(browser)
  const joinerPage = await createPage(browser)

  const code = await createRoom(hostPage, 'Host')
  await joinRoom(joinerPage, 'Joiner', code)
  await waitForPlayers(hostPage, 2)
  await waitForPlayers(joinerPage, 2)

  // Close the host (admin) page — triggers PeerJS disconnect detection
  await hostPage.close()

  // Wait for joiner to become admin (crown emoji next to name)
  // In headless CI, WebRTC close events are unreliable, so this may fall back to
  // the heartbeat monitor which detects a missing admin after 25 seconds of silence.
  // Allow 45 seconds to comfortably cover the heartbeat threshold + polling jitter.
  await expect(joinerPage.getByText('Joiner 👑')).toBeVisible({ timeout: 45_000 })
})

import { test, expect } from '@playwright/test'
import { createPage, createRoom, joinRoom, waitForPlayers } from '../fixtures'

test('create room and join with code', async ({ browser }) => {
  const hostPage = await createPage(browser)
  const joinerPage = await createPage(browser)

  const code = await createRoom(hostPage, 'Host')
  expect(code).toMatch(/^[A-Z0-9]{4,6}$/)

  await joinRoom(joinerPage, 'Joiner', code)

  await waitForPlayers(hostPage, 2)
  await waitForPlayers(joinerPage, 2)

  for (const page of [hostPage, joinerPage]) {
    await expect(page.getByText('Host')).toBeVisible()
    await expect(page.getByText('Joiner')).toBeVisible()
  }
})

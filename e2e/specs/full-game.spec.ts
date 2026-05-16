import { test, expect } from '@playwright/test'
import { createPage, createRoom, joinRoom, readyUp, startGame, waitForPlayers } from '../fixtures'

test('play a full 2-player game through all phases', async ({ browser }) => {
  const host = await createPage(browser)
  const joiner = await createPage(browser)

  // 1. Create room and select categories
  const code = await createRoom(host, 'Host')

  await host.getByRole('button', { name: 'Edit Settings' }).click()
  await host.getByRole('combobox', { name: 'Categories' }).click()

  await host.getByRole('option', { name: 'Name (Male)' }).click()
  await host.getByRole('option', { name: 'City (Turkey)' }).click()
  await host.getByRole('option', { name: 'Animal' }).click()

  await host.locator('body').click({ position: { x: 0, y: 0 } })
  await host.getByRole('button', { name: 'Save' }).click()

  // 2. Joiner joins
  await joinRoom(joiner, 'Joiner', code)
  await waitForPlayers(host, 2)
  await waitForPlayers(joiner, 2)

  // 3. Both ready up
  // Host first, then joiner — after both ready, countdown auto-starts
  await readyUp(host)
  await readyUp(joiner)

  // 4. Admin starts game (clicks Start Now or Start Game)
  await startGame(host)
  await host.waitForURL(/\/game\//)
  await joiner.waitForURL(/\/game\//)

  // 5. Wheel auto-spins and transitions to answering (~4s)
  await host.getByText('Write words starting with').waitFor({ state: 'visible', timeout: 15_000 })
  await joiner.getByText('Write words starting with').waitFor({ state: 'visible', timeout: 15_000 })

  // 6. Fill answers and submit
  for (const page of [host, joiner]) {
    const textboxes = page.getByRole('textbox')
    const count = await textboxes.count()
    for (let i = 0; i < count; i++) {
      const tb = textboxes.nth(i)
      if (await tb.isVisible()) {
        await tb.fill('Test')
      }
    }
    await page.getByRole('button', { name: 'Submit Answers' }).click()
  }

  // 7. Grade: both vote Valid on each other's answers
  for (const page of [host, joiner]) {
    await page.getByText('Grading').waitFor({ state: 'visible', timeout: 20_000 })
    const validButtons = page.getByRole('button', { name: 'Valid' })
    const vCount = await validButtons.count()
    for (let i = 0; i < vCount; i++) {
      await validButtons.nth(i).click()
    }
  }

  // 8. Admin shows results
  await host.getByRole('button', { name: 'Show Results' }).click()

  // 9. Verify round results are displayed
  await host.getByText(/Round \d Results/).waitFor({ state: 'visible', timeout: 10_000 })
  await joiner.getByText(/Round \d Results/).waitFor({ state: 'visible', timeout: 10_000 })

  // Verify scores accumulated
  const hostScore = await host.getByText(/Round Total/).isVisible()
  expect(hostScore).toBe(true)
})

import { test, expect } from '@playwright/test'
import { createPage, createRoom, joinRoom, readyUp, startGame, waitForPlayers } from '../fixtures'

test('play a full 2-player game through all phases', async ({ browser }) => {
  const host = await createPage(browser)
  host.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'log' && (text.includes('[Game]') || text.includes('[SlotMachine]') || text.includes('[Peer]') || text.includes('[Grading]'))) {
      console.log('HOST:', text)
    }
    if (msg.type() === 'error') {
      console.log('HOST_ERROR:', text)
    }
  })
  host.on('pageerror', (err) => {
    console.log('HOST_PAGE_ERROR:', err.message)
  })
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
  for (const [idx, page] of [host, joiner].entries()) {
    const label = idx === 0 ? 'HOST' : 'JOINER'
    console.log(`[TEST] ${label} waiting for Grading heading...`)
    await page.getByRole('heading', { name: 'Grading' }).waitFor({ state: 'visible', timeout: 20_000 })
    const validButtons = page.getByRole('button', { name: 'Valid' })
    const vCount = await validButtons.count()
    console.log(`[TEST] ${label} found ${vCount} Valid buttons`)
    for (let i = 0; i < vCount; i++) {
      await validButtons.nth(i).click()
      console.log(`[TEST] ${label} clicked Valid button ${i + 1}/${vCount}`)
    }
    console.log(`[TEST] ${label} done voting`)
  }

  // 8. Admin shows results
  await host.waitForTimeout(2000)
  const showResultsText = await host.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button')).map(b => b.textContent)
    return JSON.stringify(all)
  })
  console.log('[TEST] All button texts on host:', showResultsText)
  const footerHtml = await host.evaluate(() => {
    const footers = document.querySelectorAll('[class*="MuiBox-root"]')
    const last = footers[footers.length - 1]
    return last?.innerHTML ?? 'NO FOOTER FOUND'
  })
  console.log('[TEST] Footer HTML:', footerHtml.substring(0, 500))
  await host.getByText('Show Results').waitFor({ state: 'visible', timeout: 15_000 })
  await host.getByText('Show Results').click()

  // 9. Verify round results are displayed
  await host.getByText(/Round \d Results/).waitFor({ state: 'visible', timeout: 10_000 })
  await joiner.getByText(/Round \d Results/).waitFor({ state: 'visible', timeout: 10_000 })

  // Verify scores accumulated — player rows rendered on Scoreboard
  await expect(host.locator('h6').first()).toBeVisible()
})

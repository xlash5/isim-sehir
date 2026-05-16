import { type Page, type Browser } from '@playwright/test'

export async function createPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('locale', 'en')
  })
  return page
}

export async function createRoom(page: Page, nickname = 'Host'): Promise<string> {
  await page.goto('/')
  await page.getByLabel('Your Nickname').fill(nickname)
  await page.getByRole('button', { name: 'Create Room' }).click()
  await page.waitForURL(/\/room\/([A-Z0-9]+)/)
  const match = page.url().match(/\/room\/([A-Z0-9]+)/)
  if (!match) throw new Error('Could not extract room code from URL')
  return match[1]
}

export async function joinRoom(page: Page, nickname: string, code: string): Promise<void> {
  await page.goto('/')
  await page.getByLabel('Your Nickname').fill(nickname)
  await page.getByPlaceholder('4-6 character code').fill(code)
  await page.getByRole('button', { name: 'Join Room' }).click()
  await page.waitForURL(/\/room\//)
}

export async function readyUp(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: 'Ready' })
  await btn.waitFor({ state: 'visible', timeout: 10_000 })
  await btn.click()
}

export async function startGame(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Start (Now|Game)/ })
  await btn.waitFor({ state: 'visible', timeout: 15_000 })
  await btn.click()
}

export async function waitForPlayers(page: Page, count: number): Promise<void> {
  await page.getByText(`Players (${count})`).waitFor({ state: 'visible', timeout: 15_000 })
}

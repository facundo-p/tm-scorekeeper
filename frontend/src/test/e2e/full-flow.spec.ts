import { test, expect } from '@playwright/test'

/**
 * E2E: Full flow test
 * Requires backend running on localhost:8000 and frontend on localhost:5173.
 * Tests: login → navigate → players page → game form entry
 */

test.describe('Full flow integration', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh: clear localStorage
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('login with valid credentials navigates to home', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/home')
    await expect(page.getByText('Terraforming Mars')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'wrong')
    await page.fill('input[type="password"]', 'wrong')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/usuario o contraseña incorrectos/i)).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL('/login')
  })

  test('session persists after page reload', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/home')

    await page.reload()
    await expect(page).toHaveURL('/home')
  })

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/home')

    await page.getByRole('button', { name: /salir/i }).click()
    await expect(page).toHaveURL('/login')
  })

  test('navigate to players page from home', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')

    await page.getByText('Jugadores').click()
    await expect(page).toHaveURL('/players')
    await expect(page.getByText('Jugadores')).toBeVisible()
  })

  test('game form wizard: validates step 1 before advancing', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')

    await page.goto('/games/new')
    await expect(page.getByText('Cargar Partida')).toBeVisible()

    // Clear the date field and try to advance
    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill('')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Should show validation error
    await expect(page.getByText(/requerida/i)).toBeVisible()
  })

  test('records placeholder shows "próximamente"', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')

    await page.goto('/records')
    await expect(page.getByText(/próximamente/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /volver al inicio/i })).toBeVisible()
  })
})

test.describe('Game form — validation edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/home')
  })

  test('step 1: missing date shows validation error', async ({ page }) => {
    await page.goto('/games/new')
    await page.locator('input[type="date"]').fill('')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByText(/fecha.*requerida/i)).toBeVisible()
    await expect(page).toHaveURL('/games/new')
  })

  test('step 1: missing map shows validation error', async ({ page }) => {
    await page.goto('/games/new')
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(today)
    // Do not select map, try to advance
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByText(/mapa.*requerido/i)).toBeVisible()
  })

  test('step 2: fewer than 2 players shows validation error', async ({ page }) => {
    await page.goto('/games/new')
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(today)
    await page.locator('select').selectOption('Hellas')
    await page.locator('input[type="number"]').fill('10')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // In step 2, do not select any player → click Next
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByText(/al menos.*jugadores/i)).toBeVisible()
  })

  test('awards step: adding the same award twice shows validation error', async ({ page, request }) => {
    const ts = Date.now()
    const p1Name = `E2E EC1 ${ts}`
    const p2Name = `E2E EC2 ${ts}`

    // Create 2 players via API
    await request.post('/api/players/', { data: { name: p1Name } })
    await request.post('/api/players/', { data: { name: p2Name } })

    await page.goto('/games/new')

    // Step 1: valid game setup
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(today)
    await page.locator('select').selectOption('Hellas')
    await page.locator('input[type="number"]').fill('10')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 2: select both players
    await page.getByText(p1Name).click()
    await page.getByText(p2Name).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 3: assign different corporations
    await page.locator('select').nth(0).selectOption('Credicor')
    await page.locator('select').nth(1).selectOption('Ecoline')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 4 (Recompensas): add same award twice
    await page.getByText(/agregar recompensa/i).click()
    await page.locator('select').nth(0).selectOption('Cultivator')

    await page.getByText(/agregar recompensa/i).click()
    await page.locator('select').nth(2).selectOption('Cultivator') // same award

    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByText(/misma recompensa/i)).toBeVisible()
  })
})

test.describe('Game form — full game creation', () => {
  test('creates a complete game with awards and milestones', async ({ page, request }) => {
    const ts = Date.now()
    const p1Name = `E2E Full P1 ${ts}`
    const p2Name = `E2E Full P2 ${ts}`
    const p3Name = `E2E Full P3 ${ts}`

    // Create 3 players via API (3 players so 2nd place awards are valid)
    await request.post('/api/players/', { data: { name: p1Name } })
    await request.post('/api/players/', { data: { name: p2Name } })
    await request.post('/api/players/', { data: { name: p3Name } })

    // Login
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/home')

    await page.goto('/games/new')
    await expect(page.getByText('Cargar Partida')).toBeVisible()

    // ── Step 1: Game setup ──────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(today)
    await page.locator('select').selectOption('Hellas')
    await page.locator('input[type="number"]').fill('10') // generations
    await page.getByRole('button', { name: /siguiente/i }).click()

    // ── Step 2: Player selection ────────────────────────────────────────────
    await page.getByText(p1Name).click()
    await page.getByText(p2Name).click()
    await page.getByText(p3Name).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    // ── Step 3: Corporations & Terraform Rating ─────────────────────────────
    // Each player card has 1 select (corporation) and 1 number input (TR)
    // Players are in the order p1, p2, p3 (selection click order)
    await page.locator('select').nth(0).selectOption('Credicor')
    await page.locator('input[type="number"]').nth(0).fill('25')
    await page.locator('select').nth(1).selectOption('Ecoline')
    await page.locator('input[type="number"]').nth(1).fill('22')
    await page.locator('select').nth(2).selectOption('Helion')
    await page.locator('input[type="number"]').nth(2).fill('20')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // ── Step 4: Recompensas (Awards) ────────────────────────────────────────
    await page.getByText(/agregar recompensa/i).click()

    // select[0] = award name (Recompensa), select[1] = opened by (Abierto por)
    await page.locator('select').nth(0).selectOption('Cultivator')
    await page.locator('select').nth(1).selectOption({ label: p1Name })

    // First place: click p1 in the 1er puesto MultiSelect
    // The first-place section comes first in DOM; p1 buttons: [0]=1st-place, [1]=2nd-place
    await page.locator(`button:has-text("${p1Name}")`).first().click()

    // Second place: p1 is now excluded from 2nd-place options.
    // p2 appears: nth(0)=1st-place section, nth(1)=2nd-place section
    await page.locator(`button:has-text("${p2Name}")`).nth(1).click()

    await page.getByRole('button', { name: /siguiente/i }).click()

    // ── Step 5: Hitos (Milestones) ──────────────────────────────────────────
    // Claim first Hellas milestone (DIVERSIFIER)
    await page.locator('input[type="checkbox"]').first().click()
    // Select p1 for the claimed milestone (only 1 select appears after checking)
    await page.locator('select').selectOption({ label: p1Name })
    await page.getByRole('button', { name: /siguiente/i }).click()

    // ── Steps 6-9: Score fields (3 players each) ────────────────────────────
    // Step 6: card_resource_points
    for (let i = 0; i < 3; i++) {
      await page.locator('input[type="number"]').nth(i).fill('3')
    }
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 7: card_points
    for (let i = 0; i < 3; i++) {
      await page.locator('input[type="number"]').nth(i).fill('5')
    }
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 8: greenery_points
    for (let i = 0; i < 3; i++) {
      await page.locator('input[type="number"]').nth(i).fill('4')
    }
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 9: city_points
    for (let i = 0; i < 3; i++) {
      await page.locator('input[type="number"]').nth(i).fill('2')
    }
    await page.getByRole('button', { name: /siguiente/i }).click()

    // ── Review step ─────────────────────────────────────────────────────────
    await expect(page.getByText(p1Name)).toBeVisible()
    await expect(page.getByText(p2Name)).toBeVisible()
    await expect(page.getByText(p3Name)).toBeVisible()
    await expect(page.getByText('Cultivator')).toBeVisible() // award shown in review

    // Submit the game
    await page.getByRole('button', { name: /confirmar y guardar/i }).click()

    // ── Post-game: records screen ────────────────────────────────────────────
    // Navigate to /games/{id}/records
    await expect(page).toHaveURL(/\/games\/.*\/records/)
    // Records endpoint is pending, so a placeholder message is shown
    await expect(page.getByText(/próximamente|records/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /volver al inicio/i })).toBeVisible()
  })
})

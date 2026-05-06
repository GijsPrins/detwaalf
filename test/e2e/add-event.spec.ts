import { test, expect } from './fixtures/auth'

// Requires the E2E test account to have admin or event_manager role in Supabase.
test('authenticated admin can add and delete an event', async ({ page }) => {
  await page.goto('/events/new')
  await page.waitForLoadState('networkidle')
  await page.locator('#name').pressSequentially('E2E Test Evenement')
  await page.locator('#eventDate').pressSequentially('2027-09-15')
  await page.locator('#province').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Opslaan' }).click()
  await page.waitForURL(/\/events\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'E2E Test Evenement' })).toBeVisible()

  // Cleanup: delete the event so it doesn't pollute the database
  await page.getByRole('button', { name: 'Verwijderen' }).click()
  await page.getByRole('button', { name: 'Ja, verwijder' }).click()
  await page.waitForURL('/events')
})

import { expect, test } from '@playwright/test'
test('sample calculation persists and exports a PNG', async ({page}) => {
  await page.goto('/'); page.on('dialog', dialog=>dialog.accept())
  await page.getByRole('button',{name:'Load sample data'}).click()
  await expect(page.getByText('62.3 kWh')).toBeVisible()
  await expect(page.getByText('₦14,158.92').first()).toBeVisible()
  await page.getByLabel('Cost per Unit (₦/kWh)').fill('250.00')
  await expect(page.getByText('₦15,575.00').first()).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button',{name:'Download PNG'}).click()
  const file = await download; expect(file.suggestedFilename()).toMatch(/^light-bill-.*\.png$/)
  const path = await file.path(); expect(path).toBeTruthy()
  await page.reload(); await expect(page.getByLabel('Cost per Unit (₦/kWh)')).toHaveValue('250.00')
})

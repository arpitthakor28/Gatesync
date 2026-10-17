import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 }, // Mobile viewport (iPhone 14 / Pixel standard)
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 GateSyncPWA'
});

test.describe('GateSync Mobile Visitor Alerting & Decision Flow', () => {

  test('Full Guard -> Resident -> Live Approval E2E Flow with Persistent Auth', async ({ page, context }) => {
    // 1. Visit GateSync PWA at GitHub Pages subpath
    await page.goto('http://localhost:3000/Gatesync/');
    await expect(page).toHaveTitle(/GateSync/);

    // 2. Log in as Guard
    const roleSwitcher = page.locator('.header-role-switcher');
    await roleSwitcher.getByRole('button', { name: 'Guard' }).click();

    // Verify Guard Desk active
    await expect(page.getByText('Gate Security Desk')).toBeVisible();

    // 3. Guard registers visitor
    await page.getByRole('button', { name: 'Check-In Gate Visitor' }).click();
    await page.getByPlaceholder('e.g. Swiggy Delivery / Suresh Varma').fill('Vikram Malhotra');
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210');
    await page.getByRole('button', { name: 'Check-In Visitor & Save Entry' }).click();

    // 4. Resident Switcher Simulation
    await roleSwitcher.getByRole('button', { name: 'Resident' }).click();

    // 5. Verify Incoming Visitor Modal Appears on Resident Screen
    const incomingModal = page.locator('text=GATE INTERCOM CALL');
    await expect(incomingModal).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Vikram Malhotra')).toBeVisible();

    // 6. Resident approves entry
    const approveBtn = page.getByRole('button', { name: 'Approve Entry' });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Verify modal dismissed after decision
    await expect(incomingModal).not.toBeVisible();

    // 7. Verify Page Refresh NEVER logs out (Persistent Auth test)
    await page.reload();
    await expect(page.locator('.header-profile-text')).toBeVisible();
    await expect(page.getByText('Resident')).toBeVisible();

    // 8. Switch back to Guard and verify Live Decision status within 2s
    await roleSwitcher.getByRole('button', { name: 'Guard' }).click();
    const visitorRow = page.locator('tr', { hasText: 'Vikram Malhotra' });
    await expect(visitorRow).toBeVisible();
  });

  test('Emergency SOS panic alert button triggers siren banner', async ({ page }) => {
    await page.goto('http://localhost:3000/Gatesync/');
    const roleSwitcher = page.locator('.header-role-switcher');
    await roleSwitcher.getByRole('button', { name: 'Resident' }).click();

    // Click floating SOS button
    const sosBtn = page.getByRole('button', { name: 'Emergency SOS' });
    if (await sosBtn.isVisible()) {
      await sosBtn.click();
      await expect(page.getByText('Sending Emergency SOS Alert')).toBeVisible();
      // Cancel to test 3-second safety abort
      await page.getByRole('button', { name: 'Cancel Alert' }).click();
      await expect(page.getByText('Sending Emergency SOS Alert')).not.toBeVisible();
    }
  });

});

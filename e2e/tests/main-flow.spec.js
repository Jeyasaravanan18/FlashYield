import { test, expect } from '@playwright/test';

test.describe('Food Saver - Main Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/listings/nearby*', async route => {
      const json = {
        data: [
          {
            _id: 'mock-listing-1',
            title: 'End of Day Pastry Bundle',
            description: 'Assorted fresh pastries',
            category: 'bakery',
            originalPrice: 500,
            discountedPrice: 200,
            quantityTotal: 5,
            quantityAvailable: 5,
            claimWindowStart: new Date(Date.now() - 3600000).toISOString(),
            claimWindowEnd: new Date(Date.now() + 3600000).toISOString(),
            status: 'active',
            imageUrl: '/3d-icons/3d_food_basket.png',
            distance: 500,
            merchant: {
              businessName: 'Test Bakery',
              address: '123 Main St',
            },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      await route.fulfill({ json });
    });

    await page.route('**/api/v1/auth/me', async route => {
      await route.fulfill({ status: 401 });
    });
  });

  test('should display nearby listings on home page', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.getByRole('heading', { name: 'Discover Nearby Deals' })).toBeVisible();
    await expect(page.getByText('End of Day Pastry Bundle')).toBeVisible();
    await expect(page.getByText('Test Bakery')).toBeVisible();
    await expect(page.getByText('-60%')).toBeVisible();
    await expect(page.getByText('₹200')).toBeVisible();
  });

  test('should navigate to login when claiming while logged out', async ({ page }) => {
    await page.route('**/api/v1/listings/mock-listing-1', async route => {
      const json = {
        _id: 'mock-listing-1',
        title: 'End of Day Pastry Bundle',
        description: 'Assorted fresh pastries',
        category: 'bakery',
        originalPrice: 500,
        discountedPrice: 200,
        quantityTotal: 5,
        quantityAvailable: 5,
        claimWindowStart: new Date(Date.now() - 3600000).toISOString(),
        claimWindowEnd: new Date(Date.now() + 3600000).toISOString(),
        status: 'active',
        imageUrl: '/3d-icons/3d_food_basket.png',
        merchant: {
          businessName: 'Test Bakery',
          address: '123 Main St',
          location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
      };
      await route.fulfill({ json });
    });

    await page.goto('http://localhost:5173');
    await page.locator('#listing-mock-listing-1').click();
    await expect(page.getByRole('heading', { name: 'End of Day Pastry Bundle' })).toBeVisible();
    await page.getByRole('button', { name: 'Claim Now (Pay at Store)' }).click();
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});

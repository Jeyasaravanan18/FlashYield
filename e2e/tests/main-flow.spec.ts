import { test, expect } from '@playwright/test';

test.describe('Food Saver - Main Flow', () => {
  // We mock out the actual backend for this E2E test to isolate the frontend
  // and avoid needing a running MongoDB/Redis instance for the basic flow test.

  test.beforeEach(async ({ page }) => {
    // Mock the nearby listings API
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
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
            distance: 500,
            merchant: {
              businessName: 'Test Bakery',
              address: '123 Main St'
            }
          }
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      };
      await route.fulfill({ json });
    });

    // Mock the me endpoint to simulate logged out state initially
    await page.route('**/api/v1/auth/me', async route => {
      await route.fulfill({ status: 401 });
    });
  });

  test('should display nearby listings on home page', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check header
    await expect(page.getByRole('heading', { name: 'Discover Nearby Deals' })).toBeVisible();
    
    // Check that the mocked listing is displayed
    await expect(page.getByText('End of Day Pastry Bundle')).toBeVisible();
    await expect(page.getByText('Test Bakery')).toBeVisible();
    
    // Check the discount badge and price
    await expect(page.getByText('-60%')).toBeVisible(); // 500 -> 200 is 60% off
    await expect(page.getByText('₹200')).toBeVisible();
  });

  test('should navigate to login when claiming while logged out', async ({ page }) => {
    // Mock the specific listing endpoint
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
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        merchant: {
          businessName: 'Test Bakery',
          address: '123 Main St',
          location: { type: 'Point', coordinates: [77.5946, 12.9716] }
        }
      };
      await route.fulfill({ json });
    });

    await page.goto('http://localhost:5173');
    
    // Click on the listing
    await page.locator('#listing-mock-listing-1').click();
    
    // Ensure we are on the detail page
    await expect(page.getByRole('heading', { name: 'End of Day Pastry Bundle' })).toBeVisible();
    
    // Click claim
    await page.getByRole('button', { name: 'Claim Now (Pay at Store)' }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});

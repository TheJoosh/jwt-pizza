import { test, expect } from 'playwright-test-coverage';
import { Role } from '../src/service/pizzaService';

test('updateUser', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  const user = {
    id: '4',
    name: 'pizza diner',
    email,
    roles: [{ role: Role.Diner }],
  };
  let updatedUser = { ...user };

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();

    if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    expect(['POST', 'PUT']).toContain(method);
    await route.fulfill({
      status: 200,
      json: { user: updatedUser, token: 'registered-token' },
    });
  });

  await page.route('*/**/api/user/4', async (route) => {
    expect(route.request().method()).toBe('PUT');
    updatedUser = { ...updatedUser, ...route.request().postDataJSON() };
    await route.fulfill({
      status: 200,
      json: { user: updatedUser, token: 'updated-token' },
    });
  });

  await page.route('*/**/api/order', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({
      json: { id: 'order-history', dinerId: user.id, orders: [] },
    });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('textbox').nth(1).fill('e@jwt.com');
  await page.getByRole('textbox').last().fill('newPassword');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('e@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('newPassword');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('admin can view users with pagination', async ({ page }) => {
  const admin = {
    id: '1',
    name: 'Admin User',
    email: 'a@jwt.com',
    roles: [{ role: Role.Admin }],
  };
  const users = Array.from({ length: 11 }, (_, index) => ({
    id: String(index + 1),
    name: `User ${index + 1}`,
    email: `user${index + 1}@jwt.com`,
    roles: [{ role: Role.Diner }],
  }));

  await page.addInitScript(() => {
    localStorage.setItem('token', 'admin-token');
  });

  await page.route('*/**/api/user/me', async (route) => {
    await route.fulfill({ json: admin });
  });

  await page.route('*/**/api/user', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: { users } });
  });

  await page.route('*/**/api/franchise**', async (route) => {
    await route.fulfill({ json: { franchises: [], more: false } });
  });

  await page.goto('/admin-dashboard');
  await page.getByRole('button', { name: 'List Users', exact: true }).click();

  await expect(page).toHaveURL(/\/admin-dashboard\/list-users/);
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

  const userRows = page.locator('tbody tr');
  await expect(userRows).toHaveCount(10);
  await expect(page.getByText('User 1', { exact: true })).toBeVisible();
  await expect(page.getByText('User 11', { exact: true })).not.toBeVisible();

  const previousButton = page.getByRole('button', { name: '«' });
  const nextButton = page.getByRole('button', { name: '»' });
  await expect(previousButton).toBeDisabled();
  await expect(nextButton).toBeEnabled();

  await nextButton.click();
  await expect(userRows).toHaveCount(1);
  await expect(page.getByText('User 1', { exact: true })).not.toBeVisible();
  await expect(page.getByText('User 11', { exact: true })).toBeVisible();
  await expect(previousButton).toBeEnabled();
  await expect(nextButton).toBeDisabled();

  await previousButton.click();
  await expect(userRows).toHaveCount(10);
  await expect(page.getByText('User 1', { exact: true })).toBeVisible();
});

test('admin can delete a user and the user is no longer listed', async ({ page }) => {
  const admin = {
    id: '1',
    name: 'Admin User',
    email: 'a@jwt.com',
    roles: [{ role: Role.Admin }],
  };
  let users = [
    { id: '2', name: 'User To Delete', email: 'delete@jwt.com', roles: [{ role: Role.Diner }] },
    { id: '3', name: 'Remaining User', email: 'remaining@jwt.com', roles: [{ role: Role.Diner }] },
  ];

  await page.addInitScript(() => {
    localStorage.setItem('token', 'admin-token');
  });

  await page.route('*/**/api/user/me', async (route) => {
    await route.fulfill({ json: admin });
  });

  await page.route('*/**/api/user', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: { users } });
  });

  await page.route('*/**/api/user/2', async (route) => {
    expect(route.request().method()).toBe('DELETE');
    users = users.filter((user) => user.id !== '2');
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/admin-dashboard/list-users');

  const deletedUserRow = page.getByRole('row', { name: /User To Delete/ });
  await expect(deletedUserRow).toBeVisible();
  await deletedUserRow.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page).toHaveURL(/\/admin-dashboard\/delete-user/);
  await expect(page.getByText('User To Delete', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page).toHaveURL(/\/admin-dashboard/);
  await page.getByRole('button', { name: 'List Users', exact: true }).click();

  await expect(page).toHaveURL(/\/admin-dashboard\/list-users/);
  await expect(page.getByRole('row', { name: /User To Delete/ })).not.toBeVisible();
  await expect(page.getByRole('row', { name: /Remaining User/ })).toBeVisible();
});
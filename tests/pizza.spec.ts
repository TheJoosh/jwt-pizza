import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { Role, User } from '../src/service/pizzaService';

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
  'd@jwt.com': {
    id: '3',
    name: 'Kai Chen',
    email: 'd@jwt.com',
    password: 'a',
    roles: [{ role: Role.Diner }],
  },
  'f@jwt.com': {
    id: '5',
    name: 'Franchise Owner',
    email: 'f@jwt.com',
    password: 'a',
    roles: [{ role: Role.Franchisee, objectId: '2' }],
  },
  'a@jwt.com': {
    id: '1',
    name: 'Admin User',
    email: 'a@jwt.com',
    password: 'a',
    roles: [{ role: Role.Admin }],
  },
};

  const franchise = {
    id: 2,
    name: 'LotaPizza',
    stores: [
      { id: 4, name: 'Lehi' },
      { id: 5, name: 'Springville' },
      { id: 6, name: 'American Fork' },
    ],
  };

  await page.route('*/**/api/auth', async (route) => {
    const request = route.request();

    // Logout
    if (request.method() === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    const authReq = request.postDataJSON() ?? {};

    if (authReq.name) {
      const registeredUser = {
        id: '4',
        name: authReq.name,
        email: authReq.email,
        roles: [{ role: Role.Diner }],
      };

      await route.fulfill({
        status: 200,
        json: { user: registeredUser, token: 'registered-token' },
      });
      return;
    }

    const user = validUsers[authReq.email];

    if (!user || user.password !== authReq.password) {
      await route.fulfill({
        status: 401,
        json: { error: 'Unauthorized' },
      });
      return;
    }

    loggedInUser = user;

    await route.fulfill({
      status: 200,
      json: { user, token: 'abcdef' },
    });
  });

  await page.route('*/**/api/user/me', async (route) => {
    if (!loggedInUser) {
      await route.fulfill({
        status: 401,
        json: { code: 401 },
      });
      return;
    }

    await route.fulfill({ json: loggedInUser });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/franchise**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (request.method() === 'POST' && /\/api\/franchise$/.test(url)) {
      const body = request.postDataJSON();

      await route.fulfill({
        status: 201,
        json: {
          id: 10,
          name: body.name,
          stores: [],
        },
      });
      return;
    }

    if (request.method() === 'GET' && /\/api\/franchise\/\d+$/.test(url)) {
      await route.fulfill({ json: [franchise] });
      return;
    }

    if (request.method() === 'POST' && /\/store$/.test(url)) {
      const body = request.postDataJSON();

      const newStore = {
        id: 10,
        name: body.name,
      };

      franchise.stores.push(newStore);

      await route.fulfill({
        status: 201,
        json: newStore,
      });
      return;
    }

    if (request.method() === 'DELETE' && /\/store\/\d+$/.test(url)) {
      const storeId = Number(url.match(/\/store\/(\d+)$/)?.[1]);
      franchise.stores = franchise.stores.filter((store) => store.id !== storeId);

      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fallback();
  });

  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          id: '3',
          dinerId: '3',
          orders: [
            {
              id: '23',
              franchiseId: '2',
              storeId: '4',
              date: '2026-09-30',
              items: [
                {
                  menuId: '1',
                  description: 'Veggie',
                  price: 0.0038,
                },
              ],
            },
          ],
        },
      });
      return;
    }

    const orderReq = route.request().postDataJSON();
    await route.fulfill({
      json: {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      },
    });
  });

  await page.route('*/**/api/docs', async (route) => {
    await route.fulfill({
      json: {
        endpoints: [
          {
            requiresAuth: false,
            method: 'GET',
            path: '/api/order/menu',
            description: 'Get the pizza menu',
            example: '{}',
            response: [],
          },
        ],
      },
    });
  });

  await page.goto('/');
}

async function loginAsDiner(page: Page) {
  await page.goto('/login');

  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  await expect(page.getByRole('link', { name: 'KC', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'KC', exact: true }).click();

  await expect(page).toHaveURL(/\/diner-dashboard/);
}

async function loginAsFranchisee(page: Page) {
  await page.goto('/franchise-dashboard/login');

  await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard/);
}

async function loginAsAdmin(page: Page) {
  await page.goto('/admin-dashboard/login');

  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard/);
}

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByText('0.008')).toBeVisible();
});

test('menu displays available pizzas', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.getByText('Veggie')).toBeVisible();
  await expect(page.getByText('A garden of delight')).toBeVisible();
  await expect(page.getByText('Pepperoni')).toBeVisible();
  await expect(page.getByText('Spicy treat')).toBeVisible();
});

test('invalid login is rejected', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'KC', exact: true })).not.toBeVisible();
});

test('checkout requires login before payment', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();

  await expect(page.getByPlaceholder('Email address')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
});

test('registration creates an account', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Register', exact: true }).click();
  await page.getByRole('textbox', { name: /name/i }).fill('Alex Smith');
  await page.getByRole('textbox', { name: 'Email address' }).fill('alex@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Register', exact: true }).click();

  await expect(page.getByRole('link', { name: /Alex Smith|AS/ })).toBeVisible();
});

test('order selection increases pizza quantity', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();
  await page.getByRole('combobox').selectOption('4');

  const veggie = page.getByRole('link', {
    name: 'Image Description Veggie A',
  });

  await veggie.click();
  await expect(page.getByText('Selected pizzas: 1')).toBeVisible();

  await veggie.click();
  await expect(page.getByText('Selected pizzas: 2')).toBeVisible();
});

test('store options are loaded from the mocked backend', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  const storeSelect = page.getByRole('combobox');

  await expect(storeSelect.locator('option')).toHaveText([
    'choose store',
    'Lehi',
    'Springville',
    'American Fork',
    'Spanish Fork',
  ]);
});

test('registration rejects missing required fields', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Register', exact: true }).click();
  await page.getByRole('button', { name: 'Register', exact: true }).click();

  await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
});

test('about page is displayed', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'About', exact: true }).click();

  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole('main')).toBeVisible();
});

test('order checkout remains disabled until a store and pizza are selected', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  const checkout = page.getByRole('button', { name: 'Checkout' });
  await expect(checkout).toBeDisabled();

  await page.getByRole('combobox').selectOption('4');
  await expect(checkout).toBeDisabled();

  await page.getByRole('link', {
    name: 'Image Description Veggie A',
  }).click();

  await expect(checkout).toBeEnabled();
});

test('API documentation displays mocked endpoints', async ({ page }) => {
  await basicInit(page);

  await page.goto('/docs');

  await expect(page.getByRole('main')).toContainText('/api/order/menu');
  await expect(page.getByRole('main')).toContainText('Get the pizza menu');
});


test('franchisee can create a store', async ({ page }) => {
  await basicInit(page);
  await loginAsFranchisee(page);

  await page.getByRole('button', { name: 'Create store', exact: true }).click();

  await page
    .getByRole('textbox', { name: 'store name', exact: true })
    .fill('Downtown Store');

  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page.getByText('Downtown Store')).toBeVisible();
});

test('franchisee can close a store', async ({ page }) => {
  await basicInit(page);
  await loginAsFranchisee(page);

  const storeRow = page.getByRole('row', { name: /Lehi/ });
  await storeRow.getByRole('button', { name: 'Close', exact: true }).click();

  await expect(page.getByRole('row', { name: /Lehi/ })).not.toBeVisible();
});

test('admin can close a franchise', async ({ page }) => {
  await basicInit(page);
  await loginAsAdmin(page);

  const franchise = page.getByRole('row', { name: /LotaPizza/ });
  await franchise.getByRole('button', { name: 'Close', exact: true }).click();

  await expect(page.getByRole('row', { name: /LotaPizza/ })).not.toBeVisible();
});

test('admin can create a franchise', async ({ page }) => {
  await basicInit(page);
  await loginAsAdmin(page);

  await page.getByRole('button', { name: 'Add Franchise', exact: true }).click();

  await page
    .getByRole('textbox', { name: 'franchise name', exact: true })
    .fill('Downtown Pizza');

  await page
    .getByRole('textbox', { name: 'franchisee admin email', exact: true })
    .fill('owner@jwt.com');

  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page).toHaveURL(/\/admin-dashboard/);
});

test('history page is displayed', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'History', exact: true }).click();

  await expect(page).toHaveURL(/\/history/);
  await expect(page.getByRole('main')).toBeVisible();
});

test('diner dashboard displays the signed-in user', async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);

  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('link', { name: 'KC', exact: true })).toBeVisible();
});

test('diner dashboard displays order history', async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);

  const orderRow = page.getByRole('row', {
    name: /23.*0\.004 ₿.*2026-09-30/,
  });

  await expect(orderRow).toBeVisible();
});

test('diner can log out from the dashboard', async ({ page }) => {
  await basicInit(page);
  await loginAsDiner(page);

  await page.getByRole('link', { name: 'Logout', exact: true }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
});
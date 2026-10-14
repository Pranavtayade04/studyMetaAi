import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureAdminUser, parseAdminOptions } from '../scripts/create-admin.js';

test('parses positional admin arguments', () => {
  const options = parseAdminOptions(['admin@example.com', 'Study Admin', 'secret123']);

  assert.equal(options.email, 'admin@example.com');
  assert.equal(options.name, 'Study Admin');
  assert.equal(options.password, 'secret123');
  assert.equal(options.role, 'admin');
});

test('accepts flag-based admin arguments', () => {
  const options = parseAdminOptions([
    '--email',
    'flag@example.com',
    '--name',
    'Flag Admin',
    '--password',
    'longer-secret',
    '--role',
    'admin',
  ]);

  assert.equal(options.email, 'flag@example.com');
  assert.equal(options.name, 'Flag Admin');
  assert.equal(options.password, 'longer-secret');
  assert.equal(options.role, 'admin');
});

test('falls back to environment values when present', () => {
  const previousEmail = process.env.ADMIN_EMAIL;
  const previousName = process.env.ADMIN_NAME;
  const previousPassword = process.env.ADMIN_PASSWORD;

  process.env.ADMIN_EMAIL = 'env@example.com';
  process.env.ADMIN_NAME = 'Env Admin';
  process.env.ADMIN_PASSWORD = 'env-password';

  try {
    const options = parseAdminOptions([]);

    assert.equal(options.email, 'env@example.com');
    assert.equal(options.name, 'Env Admin');
    assert.equal(options.password, 'env-password');
  } finally {
    if (previousEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousEmail;

    if (previousName === undefined) delete process.env.ADMIN_NAME;
    else process.env.ADMIN_NAME = previousName;

    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
  }
});

test('rejects invalid input before attempting to create a user', async () => {
  await assert.rejects(
    () => ensureAdminUser({ email: 'not-an-email', name: 'Admin', password: 'short' }),
    { message: 'A valid email address is required.' }
  );
});

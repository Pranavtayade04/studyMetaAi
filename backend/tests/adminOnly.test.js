import assert from 'node:assert/strict';
import test from 'node:test';
import adminOnly from '../middleware/adminOnly.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('rejects requests without an authenticated user', () => {
  const response = createResponse();
  let continued = false;

  adminOnly({}, response, () => {
    continued = true;
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { message: 'Admin access only.' });
  assert.equal(continued, false);
});

test('rejects authenticated non-admin users', () => {
  const response = createResponse();
  let continued = false;

  adminOnly({ user: { role: 'student' } }, response, () => {
    continued = true;
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { message: 'Admin access only.' });
  assert.equal(continued, false);
});

test('allows admin users to continue', () => {
  const response = createResponse();
  let continued = false;

  adminOnly({ user: { role: 'admin' } }, response, () => {
    continued = true;
  });

  assert.equal(response.statusCode, 200);
  assert.equal(continued, true);
});

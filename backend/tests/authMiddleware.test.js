import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import test from 'node:test';
import protect from '../middleware/auth.js';
import User from '../models/User.js';

const TEST_SECRET = 'test-secret';

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

test('rejects requests without a bearer token', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const response = createResponse();
    let continued = false;

    await protect({ headers: {} }, response, () => {
      continued = true;
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, {
      message: 'Not authorized. Please log in and try again.',
    });
    assert.equal(continued, false);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('rejects invalid bearer tokens', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const response = createResponse();
    let continued = false;

    await protect({ headers: { authorization: 'Bearer not.a.valid.jwt' } }, response, () => {
      continued = true;
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, {
      message: 'Session expired or invalid. Please log in again.',
    });
    assert.equal(continued, false);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('loads the user and continues for valid bearer tokens', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const response = createResponse();
    const originalFindById = User.findById;
    const fakeUser = { _id: 'user-123', role: 'student' };
    let continued = false;

    User.findById = async (id) => {
      assert.equal(id, 'user-123');
      return fakeUser;
    };

    try {
      const token = jwt.sign({ id: 'user-123', role: 'student' }, TEST_SECRET, {
        expiresIn: '7d',
      });

      const req = {
        headers: { authorization: `Bearer ${token}` },
      };

      await protect(req, response, () => {
        continued = true;
      });

      assert.equal(response.statusCode, 200);
      assert.equal(req.user, fakeUser);
      assert.equal(continued, true);
    } finally {
      User.findById = originalFindById;
    }
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('rejects tokens whose user no longer exists', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;

  try {
    const response = createResponse();
    const originalFindById = User.findById;
    let continued = false;

    User.findById = async () => null;

    try {
      const token = jwt.sign({ id: 'deleted-user', role: 'student' }, TEST_SECRET, {
        expiresIn: '7d',
      });

      await protect({ headers: { authorization: `Bearer ${token}` } }, response, () => {
        continued = true;
      });

      assert.equal(response.statusCode, 401);
      assert.deepEqual(response.body, {
        message: 'This account no longer exists.',
      });
      assert.equal(continued, false);
    } finally {
      User.findById = originalFindById;
    }
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('reports a database lookup failure instead of treating it as an invalid token', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
  const originalFindById = User.findById;
  User.findById = async () => {
    throw new Error('database unavailable');
  };

  try {
    const response = createResponse();
    let continued = false;
    const token = jwt.sign({ id: 'user-123' }, TEST_SECRET);

    await protect(
      { headers: { authorization: `Bearer ${token}` } },
      response,
      () => {
        continued = true;
      }
    );

    assert.equal(response.statusCode, 503);
    assert.match(response.body.message, /database is unavailable/i);
    assert.equal(continued, false);
  } finally {
    User.findById = originalFindById;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

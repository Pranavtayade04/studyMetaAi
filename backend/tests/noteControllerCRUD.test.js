import assert from 'node:assert/strict';
import test from 'node:test';
import { createNote, deleteNote, updateNote } from '../controllers/noteController.js';
import ActivityLog from '../models/ActivityLog.js';
import Note from '../models/Note.js';

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

test('createNote validates required note fields before creating a record', async () => {
  const response = createResponse();

  await createNote(
    {
      user: { _id: 'user-123' },
      body: { title: '', body: 'Body', subject: 'Math' },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: 'Enter a note title between 1 and 120 characters.',
  });
});

test('createNote stores a new note and records activity', async () => {
  const response = createResponse();
  const originalCreate = Note.create;
  const originalActivityCreate = ActivityLog.create;
  const createdAt = new Date('2026-10-11T12:00:00Z');
  const updatedAt = new Date('2026-10-11T12:00:00Z');

  Note.create = async (payload) => ({
    _id: 'note-1',
    ...payload,
    color: '#796bff',
    createdAt,
    updatedAt,
  });

  ActivityLog.create = async () => ({ ok: true });

  try {
    await createNote(
      {
        user: { _id: 'user-123' },
        body: {
          title: 'Biology recap',
          body: 'Cell structure summary',
          subject: 'Biology',
        },
      },
      response
    );

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body.note, {
      id: 'note-1',
      title: 'Biology recap',
      body: 'Cell structure summary',
      subject: 'Biology',
      color: '#796bff',
      createdAt,
      updatedAt,
    });
  } finally {
    Note.create = originalCreate;
    ActivityLog.create = originalActivityCreate;
  }
});

test('updateNote rejects invalid note ids and prevents updates', async () => {
  const response = createResponse();

  await updateNote(
    {
      user: { _id: 'user-123' },
      params: { id: 'invalid-id' },
      body: { title: 'Updated', body: 'Body', subject: 'Math' },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { message: 'Invalid note ID.' });
});

test('deleteNote removes a user-owned note and logs the action', async () => {
  const response = createResponse();
  const originalFindOneAndDelete = Note.findOneAndDelete;
  const originalActivityCreate = ActivityLog.create;

  Note.findOneAndDelete = async () => ({
    _id: 'note-1',
    userId: 'user-123',
    subject: 'History',
  });

  ActivityLog.create = async () => ({ ok: true });

  try {
    await deleteNote(
      {
        user: { _id: 'user-123' },
        params: { id: '507f1f77bcf86cd799439011' },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { message: 'Note deleted.' });
  } finally {
    Note.findOneAndDelete = originalFindOneAndDelete;
    ActivityLog.create = originalActivityCreate;
  }
});

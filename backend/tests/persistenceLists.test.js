import assert from 'node:assert/strict';
import test from 'node:test';
import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import { listNotes } from '../controllers/noteController.js';
import { listSubjects } from '../controllers/subjectController.js';

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

test('listNotes filters notes by user, subject, and search query', async () => {
  const originalFind = Note.find;
  const now = new Date('2026-10-11T12:00:00Z');

  Note.find = (filter) => {
    assert.deepEqual(filter, {
      userId: 'user-123',
      subject: 'Mathematics',
      $or: [
        { title: { $regex: 'quiz', $options: 'i' } },
        { body: { $regex: 'quiz', $options: 'i' } },
        { subject: { $regex: 'quiz', $options: 'i' } },
      ],
    });

    return {
      sort: (sortField) => {
        assert.deepEqual(sortField, { updatedAt: -1 });
        return {
          lean: async () => [
            {
              _id: 'note-1',
              title: 'Quiz prep',
              body: 'Review key terms for the quiz.',
              subject: 'Mathematics',
              color: '#796bff',
              createdAt: now,
              updatedAt: now,
            },
          ],
        };
      },
    };
  };

  try {
    const response = createResponse();

    await listNotes(
      {
        user: { _id: 'user-123' },
        query: { subject: 'Mathematics', search: 'quiz' },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.notes, [
      {
        id: 'note-1',
        title: 'Quiz prep',
        body: 'Review key terms for the quiz.',
        subject: 'Mathematics',
        color: '#796bff',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  } finally {
    Note.find = originalFind;
  }
});

test('listSubjects returns only subjects already saved by the user', async () => {
  const originalFind = Subject.find;
  let query;

  Subject.find = (filter) => {
    query = filter;
    return {
      sort: () => ({
        lean: async () => [],
      }),
    };
  };

  try {
    const response = createResponse();

    await listSubjects({ user: { _id: 'user-123' } }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(query, { userId: 'user-123' });
    assert.deepEqual(response.body.subjects, []);
  } finally {
    Subject.find = originalFind;
  }
});

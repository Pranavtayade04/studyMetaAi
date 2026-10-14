import assert from 'node:assert/strict';
import test from 'node:test';
import Quiz from '../models/Quiz.js';
import { gradeQuiz } from '../controllers/quizController.js';

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

test('gradeQuiz reports database failures without a success-shaped response', async () => {
  const originalFindOne = Quiz.findOne;
  Quiz.findOne = async () => {
    throw new Error('database unavailable');
  };

  try {
    const response = createResponse();

    await gradeQuiz(
      {
        user: { _id: 'user-123' },
        body: {
          quizId: '507f1f77bcf86cd799439011',
          answers: [0],
        },
      },
      response
    );

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, {
      message: 'Could not save quiz results. Please try again.',
    });
  } finally {
    Quiz.findOne = originalFindOne;
  }
});

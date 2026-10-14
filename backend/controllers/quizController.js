import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import Quiz from '../models/Quiz.js';
import recordActivity from '../utils/recordActivity.js';
import createNotification from '../utils/createNotification.js';

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const MAX_SUBJECT_LENGTH = 100;

const CURATED_QUESTIONS = {
  'Computer Science': [
    { question: 'Which data structure follows the First In, First Out (FIFO) principle?', options: ['Stack', 'Queue', 'Array', 'Binary Tree'], correctIndex: 1, explanation: 'A Queue follows FIFO where the first element added is the first to be removed.' },
    { question: 'What is the time complexity of searching in a balanced Binary Search Tree?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correctIndex: 2, explanation: 'In a balanced BST, half of the remaining nodes are eliminated at each step, giving O(log n).' },
    { question: 'Which protocol is used for securely transmitting web pages over the internet?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correctIndex: 2, explanation: 'HTTPS (HyperText Transfer Protocol Secure) encrypts data using TLS/SSL.' },
    { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Power Utility', 'Core Program Unit'], correctIndex: 0, explanation: 'CPU stands for Central Processing Unit, the primary component that executes instructions.' },
    { question: 'Which of the following is not an object-oriented programming concept?', options: ['Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism'], correctIndex: 2, explanation: 'Compilation is the process of translating source code, not an OOP concept.' },
    { question: 'What is the main function of an operating system kernel?', options: ['Render web pages', 'Manage hardware resources and system calls', 'Format disks', 'Compile code'], correctIndex: 1, explanation: 'The kernel is the core of the OS managing CPU, memory, devices, and system calls.' },
    { question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correctIndex: 2, explanation: 'Merge Sort guarantees O(n log n) time complexity across best, average, and worst cases.' },
    { question: 'What is a deadlock in concurrent programming?', options: ['A process running infinitely', 'Two or more processes waiting indefinitely for resources held by each other', 'A thread terminating early', 'Memory exhaustion'], correctIndex: 1, explanation: 'Deadlock happens when processes cannot proceed because each is waiting on a lock held by another.' },
    { question: 'Which IP address represents localhost loopback?', options: ['192.168.1.1', '127.0.0.1', '10.0.0.1', '255.255.255.0'], correctIndex: 1, explanation: '127.0.0.1 is the standard IPv4 loopback address.' },
    { question: 'In Git, which command creates a new branch and switches to it?', options: ['git branch <name>', 'git checkout -b <name>', 'git merge <name>', 'git status'], correctIndex: 1, explanation: 'git checkout -b <name> (or git switch -c <name>) creates and switches to the branch.' },
    { question: 'What does API stand for?', options: ['Application Programming Interface', 'Automated Process Integration', 'Applied Program Instruction', 'Application Process Interconnect'], correctIndex: 0, explanation: 'API stands for Application Programming Interface.' },
    { question: 'Which type of memory is volatile?', options: ['ROM', 'Flash Memory', 'Hard Drive', 'RAM'], correctIndex: 3, explanation: 'RAM is volatile memory that loses its data when powered off.' },
  ],
  'Database Systems': [
    { question: 'Which normal form eliminates partial dependency on a composite primary key?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctIndex: 1, explanation: 'Second Normal Form (2NF) requires 1NF and no non-prime attribute to be partially dependent on a candidate key.' },
    { question: 'In MongoDB, what is a collection analogous to in relational databases?', options: ['A row', 'A table', 'A column', 'A schema'], correctIndex: 1, explanation: 'In MongoDB, collections store documents, similar to how relational tables store rows.' },
    { question: 'Which SQL clause is used to filter records based on aggregate values?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], correctIndex: 2, explanation: 'HAVING filters aggregated groups, whereas WHERE filters individual rows before grouping.' },
    { question: 'What does ACID stand for in database management?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Integrity, Data', 'Action, Command, Index, Document', 'Allocation, Concurrency, Iteration, Division'], correctIndex: 0, explanation: 'ACID guarantees reliable processing of database transactions.' },
    { question: 'What is a primary key?', options: ['A key that allows duplicates', 'A column or set of columns that uniquely identifies each row in a table', 'An external table reference', 'An index for text search'], correctIndex: 1, explanation: 'A primary key uniquely identifies each record in a database table.' },
    { question: 'Which MongoDB command is used to retrieve documents from a collection?', options: ['db.collection.select()', 'db.collection.find()', 'db.collection.query()', 'db.collection.get()'], correctIndex: 1, explanation: 'find() queries documents in a MongoDB collection.' },
  ],
  'Mathematics': [
    { question: 'What is the derivative of sin(x) with respect to x?', options: ['-cos(x)', 'cos(x)', '-sin(x)', 'tan(x)'], correctIndex: 1, explanation: 'The derivative of sin(x) is cos(x).' },
    { question: 'What is the solution to 2x + 6 = 14?', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correctIndex: 2, explanation: '2x = 14 - 6 = 8, so x = 4.' },
    { question: 'What is the value of 5! (5 factorial)?', options: ['24', '60', '120', '720'], correctIndex: 2, explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120.' },
    { question: 'What is the area of a circle with radius r?', options: ['2πr', 'πr²', '4/3 πr³', 'πd'], correctIndex: 1, explanation: 'The area of a circle is calculated as A = πr².' },
    { question: 'What is the median of the numbers 3, 7, 9, 12, 15?', options: ['7', '9', '10', '12'], correctIndex: 1, explanation: 'In an ordered set of 5 numbers, the middle (3rd) value is 9.' },
  ],
};

function generateFallbackQuestions(subject, difficulty, count) {
  const normalizedSubject = Object.keys(CURATED_QUESTIONS).find(
    (key) => key.toLowerCase() === subject.trim().toLowerCase()
  ) || 'Computer Science';

  const pool = CURATED_QUESTIONS[normalizedSubject] || CURATED_QUESTIONS['Computer Science'];
  const questions = [];

  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    questions.push({
      question: count > pool.length ? `${template.question} (Q${i + 1})` : template.question,
      options: [...template.options],
      correctIndex: template.correctIndex,
      explanation: template.explanation,
    });
  }

  return questions;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || /^(demo-key|your[-_ ].*|replace[-_ ].*)$/i.test(apiKey)) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function parseQuestions(output, expectedCount) {
  const cleaned = output.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(questions) || questions.length !== expectedCount) {
    throw new Error('Gemini returned an invalid question count.');
  }

  const validQuestions = questions.every(
    (item) =>
      item &&
      typeof item.question === 'string' &&
      item.question.trim().length > 0 &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      item.options.every((option) => typeof option === 'string' && option.trim()) &&
      Number.isInteger(item.correctIndex) &&
      item.correctIndex >= 0 &&
      item.correctIndex < 4 &&
      typeof item.explanation === 'string' &&
      item.explanation.trim().length > 0
  );

  if (!validQuestions) {
    throw new Error('Gemini returned questions in an invalid format.');
  }

  return questions.map((item) => ({
    question: item.question.trim(),
    options: item.options.map((option) => option.trim()),
    correctIndex: item.correctIndex,
    explanation: item.explanation.trim(),
  }));
}

function withTimeout(promise, ms = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timed out')), ms)
    ),
  ]);
}

export async function generateQuiz(req, res) {
  const { subject, difficulty, count } = req.body || {};

  if (
    typeof subject !== 'string' ||
    !subject.trim() ||
    subject.trim().length > MAX_SUBJECT_LENGTH ||
    !DIFFICULTIES.includes(difficulty) ||
    !QUESTION_COUNTS.includes(count)
  ) {
    return res.status(400).json({
      message: 'Choose a subject, a valid difficulty, and 5, 10, 15, or 20 questions.',
    });
  }

  let questions = null;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const interaction = await withTimeout(
        ai.interactions.create({
          model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          input: `Create exactly ${count} original multiple-choice questions about "${subject.trim()}" at ${difficulty} difficulty. Each question must have exactly four plausible options and one unambiguous correct option. Return only valid JSON with this shape: {"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}. correctIndex is zero-based. Do not include markdown fences or any text outside the JSON.`,
          system_instruction:
            'You are an expert educational quiz author. Create accurate, age-appropriate questions and concise explanations. Never provide ambiguous questions or multiple correct options.',
        }),
        7000
      );

      const output = interaction.output_text?.trim();
      if (output) {
        questions = parseQuestions(output, count);
      }
    } catch (err) {
      console.warn('Gemini quiz generation note:', err.message);
    }
  }

  if (!questions) {
    questions = generateFallbackQuestions(subject, difficulty, count);
  }

  try {
    const quiz = await Quiz.create({
      userId: req.user._id,
      subject: subject.trim(),
      difficulty,
      questions,
      score: 0,
      totalQuestions: questions.length,
    });

    return res.status(201).json({
      quizId: quiz._id,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      questions: questions.map(({ question, options }) => ({ question, options })),
    });
  } catch (error) {
    console.error('Quiz creation failed:', error);
    return res.status(500).json({ message: 'Could not save the generated quiz.' });
  }
}

export async function gradeQuiz(req, res) {
  const { quizId, answers } = req.body || {};
  if (!mongoose.isValidObjectId(quizId) || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Provide a valid quiz and answer list.' });
  }

  try {
    const quiz = await Quiz.findOne({ _id: quizId, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found. Please generate a new quiz.' });
    }
    if (quiz.completedAt) {
      return res.status(409).json({ message: 'This quiz has already been submitted.' });
    }
    if (
      answers.length !== quiz.questions.length ||
      answers.some((answer) => !Number.isInteger(answer) || answer < 0 || answer > 3)
    ) {
      return res.status(400).json({ message: 'Answer every question with a valid option.' });
    }

    const correctCount = quiz.questions.reduce(
      (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
      0
    );

    quiz.answers = answers;
    quiz.score = correctCount;
    quiz.totalQuestions = quiz.questions.length;
    quiz.completedAt = new Date();
    await quiz.save();

    await recordActivity(
      req.user._id,
      'quiz',
      `Completed ${quiz.subject} quiz: ${correctCount}/${quiz.questions.length}`
    );

    await createNotification(
      req.user._id,
      'quiz',
      `Completed ${quiz.subject} quiz: ${correctCount}/${quiz.questions.length}`
    );

    return res.json({
      quizId: quiz._id,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      score: correctCount,
      total: quiz.questions.length,
      questions: quiz.questions.map((question, index) => ({
        question: question.question,
        options: question.options,
        selectedIndex: answers[index],
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      })),
    });
  } catch (error) {
    console.error('Quiz grading failed:', { name: error.name, code: error.code });
    return res.status(500).json({ message: 'Could not save quiz results. Please try again.' });
  }
}

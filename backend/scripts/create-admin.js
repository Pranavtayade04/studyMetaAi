import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAdminOptions(argv = process.argv.slice(2)) {
  const options = {
    email: '',
    name: '',
    password: '',
    role: '',
  };

  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value) continue;

    if (value.startsWith('--')) {
      const key = value.slice(2);
      const nextValue = argv[index + 1];

      if (['email', 'name', 'password', 'role'].includes(key)) {
        if (!nextValue || nextValue.startsWith('--')) {
          throw new Error(`Missing value for --${key}.`);
        }
        options[key] = nextValue;
        index += 1;
      } else if (key === 'help') {
        throw new Error('Admin creation usage: npm run make-admin -- <email> <name> <password>');
      } else {
        throw new Error(`Unknown option: --${key}`);
      }
      continue;
    }

    if (value.startsWith('-')) {
      const shortKey = value.slice(1);
      const shortMap = { e: 'email', n: 'name', p: 'password', r: 'role' };
      const key = shortMap[shortKey];

      if (!key) {
        throw new Error(`Unknown option: ${value}`);
      }

      const nextValue = argv[index + 1];
      if (!nextValue || nextValue.startsWith('-')) {
        throw new Error(`Missing value for ${value}.`);
      }
      options[key] = nextValue;
      index += 1;
      continue;
    }

    positional.push(value);
  }

  if (!options.email) options.email = positional[0] || process.env.ADMIN_EMAIL || '';
  if (!options.name) options.name = positional[1] || process.env.ADMIN_NAME || '';
  if (!options.password) options.password = positional[2] || process.env.ADMIN_PASSWORD || '';
  if (!options.role) options.role = process.env.ADMIN_ROLE || 'admin';

  return {
    email: options.email.trim(),
    name: options.name.trim(),
    password: options.password,
    role: String(options.role).trim() || 'admin',
  };
}

export async function ensureAdminUser({ email, name, password, role = 'admin' } = {}) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('A valid email address is required.');
  }

  if (!name || !name.trim()) {
    throw new Error('A name is required.');
  }

  if (!password || password.length < 6) {
    throw new Error('A password with at least 6 characters is required.');
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedName = name.trim();
  const normalizedRole = role === 'admin' ? 'admin' : 'student';

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.name = normalizedName;
    user.role = normalizedRole;

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    await user.save();

    return { created: false, user };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: normalizedRole,
  });

  return { created: true, user };
}

export function isMainModule() {
  const fileUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
  return !!fileUrl && import.meta.url === fileUrl;
}

async function main() {
  dotenv.config();

  const options = parseAdminOptions();
  await connectDB();

  const result = await ensureAdminUser(options);

  console.log(
    result.created
      ? `Created admin account for ${result.user.email}.`
      : `Updated existing account ${result.user.email} to admin.`
  );
  console.log(`Role: ${result.user.role}`);
  console.log('You can now sign in with the provided email and password.');
}

if (isMainModule()) {
  main()
    .catch((error) => {
      console.error(`Admin setup failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(() => {
      mongoose.disconnect();
    });
}

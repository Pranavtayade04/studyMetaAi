import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '[MongoDB Error] MONGODB_URI is not set. Please set MONGODB_URI in backend/.env.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    const host = conn.connection.host || 'unknown-host';
    const port = conn.connection.port || 'default';
    const dbName = conn.connection.name || 'unknown-db';
    console.log(
      `[MongoDB Connected] Successfully connected to database "${dbName}" at ${host}:${port}`
    );
    return conn;
  } catch (error) {
    console.error('[MongoDB Connection Failed] Could not connect to the configured MongoDB database.', {
      name: error.name,
      code: error.code,
    });
    process.exit(1);
  }
}

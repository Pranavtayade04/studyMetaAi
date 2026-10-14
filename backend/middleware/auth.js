import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Not authorized. Please log in and try again.',
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: 'Session expired or invalid. Please log in again.',
    });
  }

  let user;
  try {
    // Resolve the account on every request so deleted users and changed roles
    // take effect immediately rather than when the token expires.
    user = await User.findById(decoded.id);
  } catch (error) {
    console.error('Authentication database lookup failed:', {
      name: error.name,
      code: error.code,
    });
    return res.status(503).json({
      message: 'Could not verify your session because the database is unavailable. Please try again.',
    });
  }

  if (!user) {
    return res.status(401).json({
      message: 'This account no longer exists.',
    });
  }

  req.user = user;
  return next();
}

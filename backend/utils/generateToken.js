import jwt from 'jsonwebtoken';

// Creates a signed JWT for a given user. We store the user's id and role
// inside the token payload — the id lets protected routes look up "who is
// this?", and the role lets the admin middleware check "are they allowed
// here?" without hitting the database on every single request.
export default function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

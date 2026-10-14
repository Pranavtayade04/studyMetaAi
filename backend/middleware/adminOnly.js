// Usage: router.get('/admin/stats', protect, adminOnly, handler)
// 'protect' must run first so req.user is already set.
export default function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access only.',
    });
  }
  next();
}

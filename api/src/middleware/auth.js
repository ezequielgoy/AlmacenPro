const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // "Bearer xxx"

  if (!token) {
    return res.status(401).json({ message: 'Token no provisto' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error en auth middleware:', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = auth;

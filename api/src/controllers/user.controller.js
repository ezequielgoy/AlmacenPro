const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Escapa caracteres especiales para regex (para comparar usernames case-insensitive)
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /api/users
 * Body esperado:
 * {
 *   username: string,
 *   password: string,
 *   role?: "user" | "manager"
 * }
 * Reglas:
 *  - Solo "admin" y "manager" pueden crear usuarios.
 *  - Si quien llama es "admin":
 *      role puede ser "user" o "manager" (si no se pasa, default "user").
 *  - Si quien llama es "manager":
 *      role SIEMPRE será "user", aunque mande otra cosa.
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !username.trim() || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required' });
    }

    // Solo admin y manager pueden crear
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not allowed to create users' });
    }

    const trimmedUsername = username.trim();

    // Verificar que no exista (case-insensitive)
    const existing = await User.findOne({
      username: new RegExp(`^${escapeRegExp(trimmedUsername)}$`, 'i'),
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: 'A user with this username already exists' });
    }

    let newRole = 'user';

    if (req.user.role === 'admin') {
      if (role === 'manager') {
        newRole = 'manager';
      } else {
        newRole = 'user';
      }
    } else if (req.user.role === 'manager') {
      // Manager solo puede crear usuarios de rol "user"
      newRole = 'user';
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: trimmedUsername,
      passwordHash,
      role: newRole,
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

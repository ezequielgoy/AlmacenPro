const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// Crear usuario (solo admin / manager)
router.post('/', auth, userController.createUser);

module.exports = router;

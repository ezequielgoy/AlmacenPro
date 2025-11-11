const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const auth = require('../middleware/auth');

// Listar proyectos activos
router.get('/', auth, projectController.getProjects);

// Crear nuevo proyecto
router.post('/', auth, projectController.createProject);

module.exports = router;

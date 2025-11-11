const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movement.controller');
const auth = require('../middleware/auth');


router.get('/', auth, movementController.getMovements);
router.post('/confirm', auth, movementController.confirmMovements);
router.get('/export', auth, movementController.exportMovements);

module.exports = router;

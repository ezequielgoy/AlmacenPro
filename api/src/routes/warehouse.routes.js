const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const auth = require('../middleware/auth');

// Todas requieren login
router.get('/', auth, warehouseController.getWarehouses);
router.post('/', auth, warehouseController.createWarehouse);
router.patch('/:id', auth, warehouseController.updateWarehouse);
router.delete('/:id', auth, warehouseController.deleteWarehouse);

module.exports = router;

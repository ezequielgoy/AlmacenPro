const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const auth = require('../middleware/auth');

router.get('/', auth, inventoryController.getInventory);
router.post('/', auth, inventoryController.addProduct);
router.delete('/:id', auth, inventoryController.deleteProduct);

module.exports = router;

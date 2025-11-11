const Warehouse = require('../models/Warehouse');
const InventoryItem = require('../models/InventoryItem');
const StockMovement = require('../models/StockMovement');

exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: 1 });
    res.json(warehouses);
  } catch (err) {
    next(err);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const warehouse = await Warehouse.create({ name });
    res.status(201).json(warehouse);
  } catch (err) {
    next(err);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ message: 'Depósito no encontrado' });
    }

    res.json(warehouse);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/warehouses/:id
 * - No permite borrar si:
 *   - Hay items de inventario asociados
 *   - Hay movimientos registrados para ese depósito
 */
exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que exista el depósito
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Depósito no encontrado' });
    }

    // Verificar inventario asociado
    const hasInventory = await InventoryItem.exists({ warehouse: id });
    if (hasInventory) {
      return res.status(400).json({
        message:
          'No se puede eliminar el depósito porque tiene productos en inventario. ' +
          'Primero debe mover o eliminar esos productos.',
      });
    }

    // Verificar movimientos asociados
    const hasMovements = await StockMovement.exists({ warehouse: id });
    if (hasMovements) {
      return res.status(400).json({
        message:
          'No se puede eliminar el depósito porque tiene movimientos de stock registrados.',
      });
    }

    await Warehouse.findByIdAndDelete(id);

    // 204 No Content: borrado exitoso, sin cuerpo
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

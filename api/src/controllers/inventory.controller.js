const InventoryItem = require('../models/InventoryItem');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');

exports.getInventory = async (req, res, next) => {
  try {
    const { warehouseId, search } = req.query;
    const filter = {};

    if (warehouseId) filter.warehouse = warehouseId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const items = await InventoryItem.find(filter)
      .populate('warehouse', 'name')
      .sort({ name: 1 });

    res.json(items);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/inventory
 * Agrega un producto o aumenta stock.
 * - Si no existe en el warehouse → crea producto.
 * - Si ya existe → incrementa stock.
 * - Siempre genera un movimiento positivo (sin proyecto, sin requestedBy).
 */
exports.addProduct = async (req, res, next) => {
  try {
    const { name, currentStock, warehouseId } = req.body;

    if (!name || currentStock == null || !warehouseId) {
      return res
        .status(400)
        .json({ message: 'name, currentStock y warehouseId son requeridos' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: 'Depósito no encontrado' });
    }

    const quantityToAdd = Number(currentStock) || 0;
    if (quantityToAdd <= 0) {
      return res.status(400).json({ message: 'currentStock debe ser > 0' });
    }

    let item = await InventoryItem.findOne({ name, warehouse: warehouseId });
    let previousStock = 0;
    let newStock = quantityToAdd;

    if (item) {
      // Ya existe: sumamos
      previousStock = item.currentStock;
      newStock = previousStock + quantityToAdd;
      item.currentStock = newStock;
      await item.save();
    } else {
      // No existe: creamos nuevo producto
      item = await InventoryItem.create({
        name,
        currentStock: quantityToAdd,
        warehouse: warehouseId,
      });
    }

    // Registrar movimiento de ingreso
    const movement = await StockMovement.create({
      user: req.user?.id ?? null,
      warehouse: warehouseId,
      items: [
        {
          inventoryItem: item._id,
          itemName: item.name,
          delta: quantityToAdd,
          previousStock,
          newStock,
        },
      ],
      requestedBy: null,
      project: null,
    });

    await movement.populate([
      { path: 'user', select: 'username' },
      { path: 'warehouse', select: 'name' },
    ]);

    res.status(item.isNew ? 201 : 200).json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/inventory/:id
 * Solo admin puede borrar productos.
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findById(id);

    if (!item) return res.status(404).json({ message: 'Producto no encontrado' });

    await InventoryItem.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

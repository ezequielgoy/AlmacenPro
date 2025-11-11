const InventoryItem = require('../models/InventoryItem');
const Warehouse = require('../models/Warehouse');

exports.getInventory = async (req, res, next) => {
  try {
    const { warehouseId, search } = req.query;
    const filter = {};

    if (warehouseId) {
      filter.warehouse = warehouseId;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

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
 * Si YA existe un producto con ese nombre en ese depósito:
 *   -> suma la cantidad enviada al stock existente y devuelve el item actualizado.
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

    // Buscamos si ya existe un producto con el mismo nombre en este depósito.
    const existingItem = await InventoryItem.findOne({
      name,
      warehouse: warehouseId,
    });

    if (existingItem) {
      // Sumamos la cantidad al stock actual
      const quantityToAdd = Number(currentStock) || 0;
      existingItem.currentStock += quantityToAdd;
      await existingItem.save();

      // 200 OK: recurso existente actualizado
      return res.status(200).json(existingItem);
    }

    // Si no existía, creamos uno nuevo
    const item = await InventoryItem.create({
      name,
      currentStock,
      warehouse: warehouseId,
    });

    // 201 Created: recurso nuevo
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/inventory/:id
 * (solo por usuarios admin)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await InventoryItem.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const StockMovement = require('../models/StockMovement');
const InventoryItem = require('../models/InventoryItem');
const Warehouse = require('../models/Warehouse');
const ExcelJS = require('exceljs');

// Escapa caracteres especiales para regex
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Construye el filtro común para listados y exportaciones
 */
function buildMovementFilter(query) {
  const { warehouseId, from, to, project } = query;
  const filter = {};

  if (warehouseId) {
    filter.warehouse = warehouseId;
  }

  if (project) {
    // Match EXACTO (case-insensitive) del nombre de proyecto
    const trimmed = project.trim();
    if (trimmed) {
      const escaped = escapeRegExp(trimmed);
      filter.project = { $regex: new RegExp(`^${escaped}$`, 'i') };
    }
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      filter.createdAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      // incluir todo el día "to"
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  return filter;
}

/**
 * GET /api/movements
 * Filtros opcionales:
 *  - warehouseId
 *  - from (YYYY-MM-DD)
 *  - to   (YYYY-MM-DD)
 *  - project (string, match exacto)
 */
exports.getMovements = async (req, res, next) => {
  try {
    const filter = buildMovementFilter(req.query);

    const movements = await StockMovement.find(filter)
      .populate('user', 'username')
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 });

    res.json(movements);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/movements/confirm
 * Body:
 * {
 *   warehouseId: string,
 *   items: [{ itemId, delta }],
 *   requestedBy?: string,
 *   project?: string
 * }
 */
exports.confirmMovements = async (req, res, next) => {
  try {
    const { warehouseId, items, requestedBy, project } = req.body;

    if (!warehouseId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: 'warehouseId e items son requeridos' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: 'Depósito no encontrado' });
    }

    const movementItems = [];

    for (const entry of items) {
      const { itemId, delta } = entry;
      if (!itemId || typeof delta !== 'number' || delta === 0) {
        continue;
      }

      const item = await InventoryItem.findOne({
        _id: itemId,
        warehouse: warehouseId,
      });

      if (!item) {
        return res
          .status(404)
          .json({ message: `Producto no encontrado (${itemId})` });
      }

      const previousStock = item.currentStock;
      const newStock = previousStock + delta;

      if (newStock < 0) {
        return res.status(400).json({
          message: `La operación dejaría el stock de "${item.name}" en negativo`,
        });
      }

      item.currentStock = newStock;
      await item.save();

      movementItems.push({
        inventoryItem: item._id,
        itemName: item.name, // nombre congelado
        delta,
        previousStock,
        newStock,
      });
    }

    if (movementItems.length === 0) {
      return res
        .status(400)
        .json({ message: 'No hay cambios válidos para aplicar.' });
    }

    const movement = await StockMovement.create({
      user: req.user.id,
      warehouse: warehouseId,
      items: movementItems,
      requestedBy: requestedBy?.trim() || undefined,
      project: project?.trim() || undefined,
    });

    await movement.populate([
      { path: 'user', select: 'username' },
      { path: 'warehouse', select: 'name' },
    ]);

    res.status(201).json(movement);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/movements/export
 * Mismos filtros que getMovements, pero devuelve un Excel.
 */
exports.exportMovements = async (req, res, next) => {
  try {
    const filter = buildMovementFilter(req.query);

    const movements = await StockMovement.find(filter)
      .populate('user', 'username')
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stock Movements');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Warehouse', key: 'warehouse', width: 25 },
      { header: 'Requested By', key: 'requestedBy', width: 25 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'User (system)', key: 'user', width: 20 },
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Delta', key: 'delta', width: 10 },
      { header: 'Previous Stock', key: 'previousStock', width: 15 },
      { header: 'New Stock', key: 'newStock', width: 15 },
    ];

    movements.forEach((m) => {
      m.items.forEach((it) => {
        sheet.addRow({
          date: m.createdAt,
          warehouse: m.warehouse?.name || '',
          requestedBy: m.requestedBy || '',
          project: m.project || '',
          user: m.user?.username || '',
          item: it.itemName,
          delta: it.delta,
          previousStock: it.previousStock,
          newStock: it.newStock,
        });
      });
    });

    // formato fecha
    sheet.getColumn('date').numFmt = 'yyyy-mm-dd hh:mm';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="stock-movements.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

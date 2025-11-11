const mongoose = require('mongoose');

const MovementItemSchema = new mongoose.Schema({
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
  itemName: String, // para mantener el nombre aunque se borre el producto
  delta: Number,
  previousStock: Number,
  newStock: Number,
});

const StockMovementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    items: [MovementItemSchema],
    requestedBy: { type: String, default: null },
    project: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockMovement', StockMovementSchema);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const InventoryItem = require('./models/InventoryItem');

async function seed() {
  await connectDB();

  console.log('🧪 Limpiando colecciones...');
  await User.deleteMany({});
  await Warehouse.deleteMany({});
  await InventoryItem.deleteMany({});

  console.log('🧪 Creando usuarios...');
  const usersData = [
    { username: 'admin', role: 'admin', password: 'admin123' },
    { username: 'manager', role: 'manager', password: 'manager123' },
    { username: 'user', role: 'user', password: 'user123' }
  ];

  const users = [];
  for (const u of usersData) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await User.create({
      username: u.username,
      role: u.role,
      passwordHash
    });
    users.push(user);
  }

  console.log('🧪 Creando depósitos...');
  const warehouses = await Warehouse.insertMany([
    { name: 'Main Warehouse' },   // wh1
    { name: 'North Warehouse' },  // wh2
    { name: 'South Warehouse' }   // wh3
  ]);

  const wh1 = warehouses[0]._id;
  const wh2 = warehouses[1]._id;
  const wh3 = warehouses[2]._id;

  console.log('🧪 Creando inventario (mockInventory)...');
  const itemsData = [
    { name: 'Laptop Computer', currentStock: 45, warehouse: wh1 },
    { name: 'Wireless Mouse', currentStock: 120, warehouse: wh1 },
    { name: 'USB-C Cable', currentStock: 200, warehouse: wh1 },
    { name: 'Monitor 27"', currentStock: 30, warehouse: wh1 },
    { name: 'Keyboard Mechanical', currentStock: 65, warehouse: wh1 },
    { name: 'Desk Chair', currentStock: 15, warehouse: wh1 },

    { name: 'Laptop Computer', currentStock: 32, warehouse: wh2 },
    { name: 'Wireless Mouse', currentStock: 85, warehouse: wh2 },
    { name: 'USB-C Cable', currentStock: 150, warehouse: wh2 },
    { name: 'Monitor 27"', currentStock: 22, warehouse: wh2 },

    { name: 'Laptop Computer', currentStock: 28, warehouse: wh3 },
    { name: 'Wireless Mouse', currentStock: 95, warehouse: wh3 },
    { name: 'Headphones', currentStock: 40, warehouse: wh3 }
  ];

  await InventoryItem.insertMany(itemsData);

  console.log('✅ Seed completado.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});

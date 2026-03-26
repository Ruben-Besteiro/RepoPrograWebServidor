// src/config/db.js
import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);   // Esto de aquí es obligatorio para resolver el problema del ECONNREFUSED

const dbConnect = async () => {
  const DATABASE_URI = process.env.DB_URI;

  if (!DATABASE_URI) {
    console.error('❌ DB_URI no está definida en .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(DATABASE_URI, { dbName: process.env.DB_NAME });
    console.log(`✅ Conectado a MongoDB: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Desconectado de MongoDB');
});

// Cerrar conexión al terminar la app
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 Conexión a MongoDB cerrada');
  process.exit(0);
});

export default dbConnect;
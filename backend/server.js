require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // Importamos el cliente y ObjectId

const app = express();
const PORT = 3000;

// --- Configuración de la Conexión a MongoDB ---
const client = new MongoClient(process.env.DB_CONNECTION_STRING);
const dbName = process.env.DB_NAME;
let db;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Endpoints ---

// [GET] Obtener todas las solicitudes
app.get('/solicitudes', async (req, res) => {
    // .find({}) busca todos los documentos. .toArray() los convierte a un array.
    const solicitudes = await db.collection('solicitudes').find({}).toArray();
    res.json(solicitudes);
});

// [POST] Crear una nueva solicitud
app.post('/solicitudes', async (req, res) => {
    const { titulo, nit, tipo, descripcion, solicitante, responsable } = req.body;
    
    // Traemos la lista de NITs válidos desde una colección en la DB
    const validNitsDoc = await db.collection('config').findOne({ name: 'validNits' });
    if (!validNitsDoc || !validNitsDoc.nits.includes(nit)) {
        return res.status(403).json({ error: 'El NIT no está autorizado.', code: 'nit_invalid' });
    }
    
    const pendingRequests = await db.collection('solicitudes').countDocuments({ solicitante, estado: 'pendiente' });
    if (pendingRequests >= 2) {
        return res.status(429).json({ error: 'Ha alcanzado el límite de 2 solicitudes pendientes.', code: 'limit_exceeded' });
    }

    const nuevaSolicitud = {
        // MongoDB crea automáticamente un campo _id único, no necesitamos uuidv4
        titulo, nit, tipo, descripcion, solicitante, responsable,
        estado: 'pendiente',
        fecha: new Date().toLocaleString(),
        comentarios: []
    };

    const result = await db.collection('solicitudes').insertOne(nuevaSolicitud);
    res.status(201).json(result.ops[0]);
});

// [PUT] Actualizar una solicitud
app.put('/solicitudes/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, comentario, currentUser } = req.body;
    
    // MongoDB usa un tipo especial ObjectId para sus IDs. Necesitamos convertir el string.
    const query = { _id: new ObjectId(id) }; 
    const updateDoc = { $set: { estado } };

    if (comentario) {
        updateDoc.$push = { // $push añade un elemento a un array
            comentarios: {
                autor: currentUser,
                texto: comentario,
                fecha: new Date().toLocaleString()
            }
        };
    }
    
    await db.collection('solicitudes').updateOne(query, updateDoc);
    const updatedSolicitud = await db.collection('solicitudes').findOne(query);
    res.json(updatedSolicitud);
});

// --- Función para Conectar a la DB e Iniciar el Servidor ---
const startServer = async () => {
    try {
        // Conectar el cliente al servidor de MongoDB
        await client.connect();
        console.log("Conectado exitosamente a MongoDB Atlas");
        db = client.db(dbName);

        // Pre-cargar la configuración de NITs si no existe
        const nitsConfig = await db.collection('config').findOne({ name: 'validNits' });
        if (!nitsConfig) {
            await db.collection('config').insertOne({
                name: 'validNits',
                nits: ["900123456", "800555444", "901987654"]
            });
            console.log("Configuración de NITs válidos insertada en la base de datos.");
        }

        // Iniciar el servidor Express
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo conectar a la base de datos", error);
        process.exit(1);
    }
};

// --- Iniciar la aplicación ---
startServer();
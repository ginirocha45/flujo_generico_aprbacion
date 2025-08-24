require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;

const client = new MongoClient(process.env.DB_CONNECTION_STRING);
const dbName = process.env.DB_NAME;
let db;

app.use(cors());
app.use(express.json());

// --- Endpoints ---

app.get('/solicitudes', async (req, res) => {
    try {
        const solicitudes = await db.collection('solicitudes').find({}).toArray();
        res.json(solicitudes);
    } catch (error) {
        console.error("Error al obtener solicitudes:", error);
        res.status(500).json({ error: "Error interno del servidor al obtener datos." });
    }
});

app.post('/solicitudes', async (req, res) => {
    try {
        const { titulo, nit, tipo, descripcion, solicitante, responsable } = req.body;
        
        const validNitsDoc = await db.collection('config').findOne({ name: 'validNits' });
        if (!validNitsDoc || !validNitsDoc.nits.includes(nit)) {
            return res.status(403).json({ error: 'El NIT no está autorizado.', code: 'nit_invalid' });
        }
        
        const pendingRequests = await db.collection('solicitudes').countDocuments({ solicitante, estado: 'pendiente' });
        if (pendingRequests >= 2) {
            return res.status(429).json({ error: 'Ha alcanzado el límite de 2 solicitudes pendientes.', code: 'limit_exceeded' });
        }

        const nuevaSolicitud = {
            titulo, nit, tipo, descripcion, solicitante, responsable,
            estado: 'pendiente',
            fecha: new Date().toLocaleString(),
            comentarios: []
        };

        const result = await db.collection('solicitudes').insertOne(nuevaSolicitud);
        
        // --- CORRECCIÓN CLAVE ---
        // El método moderno para obtener el documento insertado es buscarlo por su ID.
        const solicitudInsertada = await db.collection('solicitudes').findOne({ _id: result.insertedId });
        
        res.status(201).json(solicitudInsertada);
        // --- FIN DE LA CORRECCIÓN ---

    } catch (error) {
        console.error("Error al crear la solicitud:", error);
        res.status(500).json({ error: "Error interno del servidor al crear la solicitud." });
    }
});

app.put('/solicitudes/:id', async (req, res) => {
    // ... (el código del PUT no necesita cambios, pero es bueno añadir try-catch también)
    try {
        const { id } = req.params;
        const { estado, comentario, currentUser } = req.body;
        
        const query = { _id: new ObjectId(id) }; 
        const updateDoc = { $set: { estado } };

        if (comentario) {
            updateDoc.$push = {
                comentarios: { autor: currentUser, texto: comentario, fecha: new Date().toLocaleString() }
            };
        }
        
        await db.collection('solicitudes').updateOne(query, updateDoc);
        const updatedSolicitud = await db.collection('solicitudes').findOne(query);
        res.json(updatedSolicitud);
    } catch (error) {
        console.error(`Error al actualizar la solicitud ${req.params.id}:`, error);
        res.status(500).json({ error: "Error interno del servidor al actualizar." });
    }
});

const startServer = async () => {
    try {
        await client.connect();
        console.log("Conectado exitosamente a MongoDB Atlas");
        db = client.db(dbName);

        const nitsConfig = await db.collection('config').findOne({ name: 'validNits' });
        if (!nitsConfig) {
            await db.collection('config').insertOne({
                name: 'validNits',
                nits: ["900123456-7", "800555444-2", "901987654-3"]
            });
            console.log("Configuración de NITs válidos insertada en la base de datos.");
        }

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo conectar a la base de datos", error);
        process.exit(1);
    }
};

startServer();
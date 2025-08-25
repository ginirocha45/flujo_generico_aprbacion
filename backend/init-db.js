// init-db.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

// --- DATOS DE PRUEBA ---
const testData = [
    {
        titulo: "Acceso a base de datos de marketing",
        nit: "900123456-7",
        tipo: "acceso",
        descripcion: "Se requiere acceso de solo lectura para análisis de campaña.",
        solicitante: "analista.marketing",
        responsable: "jefe.ti",
        estado: "pendiente",
        fecha: new Date("2025-08-26T10:00:00Z").toLocaleString(),
        comentarios: []
    },
    {
        titulo: "Despliegue de nueva versión del portal de clientes",
        nit: "800555444-2",
        tipo: "despliegue",
        descripcion: "Desplegar la versión 2.1.5 en el entorno de pre-producción.",
        solicitante: "dev.ops",
        responsable: "jefe.arquitectura",
        estado: "aprobado",
        fecha: new Date("2025-08-25T15:30:00Z").toLocaleString(),
        comentarios: [
            {
                autor: "jefe.arquitectura",
                texto: "Aprobado. Pruebas unitarias completadas con éxito.",
                fecha: new Date("2025-08-25T16:00:00Z").toLocaleString()
            }
        ]
    },
    {
        titulo: "Solicitud de cambio técnico en firewall",
        nit: "901987654-3",
        tipo: "cambio-tecnico",
        descripcion: "Abrir puerto 443 para nuevo servicio.",
        solicitante: "admin.redes",
        responsable: "jefe.seguridad",
        estado: "rechazado",
        fecha: new Date("2025-08-24T09:00:00Z").toLocaleString(),
        comentarios: [
            {
                autor: "jefe.seguridad",
                texto: "Rechazado. Falta documento de análisis de riesgos.",
                fecha: new Date("2025-08-24T11:20:00Z").toLocaleString()
            }
        ]
    }
];

// --- FUNCIÓN PRINCIPAL DEL SCRIPT ---
async function run() {
    const client = new MongoClient(process.env.DB_CONNECTION_STRING);
    try {
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        const collection = db.collection('solicitudes');

        console.log("Conectado a la base de datos...");

        // 1. Borrar todos los datos existentes para empezar de cero
        await collection.deleteMany({});
        console.log("Colección 'solicitudes' limpiada.");

        // 2. Insertar los nuevos datos de prueba
        await collection.insertMany(testData);
        console.log(`${testData.length} documentos de prueba insertados con éxito.`);
        
        console.log("\n¡Base de datos inicializada con datos de prueba!");

    } catch (error) {
        console.error("Ocurrió un error durante la inicialización:", error);
    } finally {
        // 3. Cerrar la conexión
        await client.close();
        console.log("Conexión cerrada.");
    }
}

// Ejecutar el script
run();
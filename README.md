# 🚀 Flujo Genérico de Aprobación - Kata Junior

## 1. Tecnologías Utilizadas

Este es un proyecto Fullstack que utiliza un stack moderno, escalable y basado en tecnologías de código abierto.

*   **Frontend:**
    *   **Lenguajes:** HTML5, CSS3, JavaScript (ES6+)
    *   **Librerías/Frameworks:** No se utilizaron frameworks para demostrar el manejo puro de JavaScript del lado del cliente.
    *   **Comunicación:** Se utilizó la `Fetch API` nativa del navegador para la comunicación asíncrona con el backend.

*   **Backend:**
    *   **Entorno de Ejecución:** Node.js
    *   **Framework:** Express.js para la gestión de rutas, middlewares y la API REST.
    *   **Drivers:** `mongodb` para la conexión con la base de datos y `dotenv` para la gestión segura de variables de entorno.

*   **Base de Datos:**
    *   **Tipo:** NoSQL (No Relacional).
    *   **Motor:** MongoDB.
    *   **Alojamiento:** Se utilizó **MongoDB Atlas**, una base de datos como servicio (DBaaS) en la nube, aprovechando su plan gratuito (Free Tier).

*   **Despliegue y Orquestación:**
    *   **Contenedores:** **Docker**. La aplicación fue completamente "dockerizada", separando el frontend y el backend en contenedores independientes para garantizar la portabilidad y consistencia del entorno.
        *   El contenedor del **backend** utiliza una imagen oficial de Node.js.
        *   El contenedor del **frontend** utiliza una imagen oficial de **Nginx** como servidor web para servir los archivos estáticos de manera eficiente.

## 2. Guía de Revisión y Pruebas

Para revisar y probar la funcionalidad completa de la aplicación, por favor siga los siguientes escenarios.

### ✅ Prueba del "Camino Feliz" (Flujo completo)

1.  **Crear una solicitud:**
    *   En la pestaña **"Crear Nueva Solicitud"**, ingrese los datos. Por ejemplo:
        *   **NIT Cliente:** `900123456` (debe ser uno de los válidos).
        *   **Solicitante:** `usuario.general`
        *   **Responsable de Aprobar:** `jefe.area`
    *   Haga clic en **"Enviar Solicitud"**. Debería ver una alerta de éxito.

2.  **Revisar como Aprobador:**
    *   Vaya a la pestaña **"Bandeja de Entrada"**.
    *   En el campo de filtro, escriba `jefe.area`.
    *   **Verificación:** Debería aparecer una insignia de notificación con un "1". La solicitud creada aparecerá en la lista con estado "pendiente" y con los botones de acción.

3.  **Aprobar la solicitud:**
    *   Añada un comentario en el campo de texto (ej: "Aprobado por cumplir con los requisitos").
    *   Haga clic en el botón **"Aprobar"**.
    *   **Verificación:** La tarjeta se actualizará, el estado cambiará a "aprobado" y los botones de acción desaparecerán.

4.  **Verificar el Historial:**
    *   En el campo de filtro, escriba `usuario.general` (el solicitante original).
    *   **Verificación:** La misma solicitud aparecerá ahora con el estado "aprobado" y en la sección "Historial de Aprobación" se verá el comentario dejado por `jefe.area`.

### ❌ Pruebas de Validaciones y Reglas de Negocio

1.  **NIT no autorizado:**
    *   Intente crear una solicitud con un NIT que no esté en la base de datos (ej: `111111111`).
    *   **Resultado esperado:** El formulario no se enviará y aparecerá un mensaje de error en rojo debajo del campo NIT.

2.  **Límite de Solicitudes Pendientes:**
    *   Como `usuario.general`, cree dos solicitudes pendientes para `jefe.area`. Ambas se crearán con éxito.
    *   Intente crear una **tercera** solicitud pendiente.
    *   **Resultado esperado:** Aparecerá una alerta indicando que se ha alcanzado el límite de 2 solicitudes pendientes.

## 3. Guía de Despliegue Local con Docker

Para ejecutar este proyecto en un entorno local, por favor siga estos pasos.

### Prerrequisitos
*   Git instalado.
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/ginirocha45/flujo_generico_aprobacion.git
    cd flujo_generico_aprobacion
    ```

2.  **Configurar las Variables de Entorno del Backend:**
    *   Navegue a la carpeta `backend`.
    *   Cree un archivo llamado `.env`.
    *   Copie y pegue el siguiente contenido en el archivo `.env`, **reemplazando la cadena de conexión** con la suya de MongoDB Atlas:
    ```
    DB_CONNECTION_STRING=mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/
    DB_NAME=kataBancoDB
    ```

3.  **Construir las imágenes de Docker:**
    *   Desde la carpeta **raíz** del proyecto (`flujo_generico_aprobacion`), ejecute los siguientes comandos:
    ```bash
    # Construir la imagen del backend
    docker build -t kata-backend ./backend

    # Construir la imagen del frontend
    docker build -t kata-frontend ./frontend
    ```

4.  **Crear una red de Docker:**
    *   Para que los contenedores se comuniquen entre sí, creamos una red privada.
    ```bash
    docker network create kata-net
    ```

5.  **Ejecutar los contenedores:**
    *   Es importante ejecutar el backend primero.
    ```bash
    # Ejecutar el contenedor del backend en el puerto 3000
    docker run -d --name backend-container --network kata-net --env-file ./backend/.env -p 3000:3000 kata-backend

    # Ejecutar el contenedor del frontend en el puerto 8080
    docker run -d --name frontend-container --network kata-net -p 8080:80 kata-frontend
    ```

6.  **Acceder a la aplicación:**
    *   ¡Listo! Abra su navegador web y vaya a la siguiente dirección:
    *   **[http://localhost:8080](http://localhost:8080)**
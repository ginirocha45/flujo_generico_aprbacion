# Usar una imagen oficial de Node.js
FROM node:18-alpine

# Crear y definir el directorio de trabajo
WORKDIR /usr/src/app

# Copiar los archivos de dependencias e instalarlas
COPY package*.json ./
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto en el que corre la app
EXPOSE 3000

# Comando para iniciar la aplicación
CMD [ "node", "server.js" ]
# Dockerfile
# Railway detecta el archivo y crea el contenedor automáticamente
# Si no existe, el contenedor se crea con un Dockerfile default

# Imagen base
FROM node:22-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (solo producción)
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Puerto que expone la app
EXPOSE 3000

# Usuario no-root por seguridad
USER node
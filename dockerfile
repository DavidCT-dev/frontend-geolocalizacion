# Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos package.json y lock
COPY package*.json ./

# Instalamos dependencias
RUN npm install --force

# Copiamos el resto del código
COPY . .

# Copiamos el archivo de variables de entorno
COPY .env.production .env

# Build de la app
RUN npm run build

# Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Configuración de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios desde builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Usar usuario seguro
USER nextjs

# Exponer el puerto
EXPOSE 3000

# Ejecutar la app
CMD ["node", "server.js"]

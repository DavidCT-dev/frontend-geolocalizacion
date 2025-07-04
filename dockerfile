# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --force
COPY . .

# Definir variables de entorno como argumentos de build
ARG NEXT_PUBLIC_API_URL_BACK
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_WEB_SOCKET_URL_CLOUD

# Pasar argumentos a variables de entorno disponibles en build time
ENV NEXT_PUBLIC_API_URL_BACK=$NEXT_PUBLIC_API_URL_BACK
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_WEB_SOCKET_URL_CLOUD=$NEXT_PUBLIC_WEB_SOCKET_URL_CLOUD

RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

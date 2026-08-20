# Deps: instala dependencias en su propia capa, cacheada mientras package*.json no cambie.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder: compila con next build (output "standalone", ver next.config.ts).
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* se hornea en el bundle de cliente en build time, no en runtime —
# tiene que venir como build arg, no como variable de entorno del contenedor final.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Runtime: solo el output standalone + estáticos + assets públicos, sin node_modules ni fuentes.
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -S cotizador && adduser -S cotizador -G cotizador

COPY --from=builder /app/public ./public
COPY --from=builder --chown=cotizador:cotizador /app/.next/standalone ./
COPY --from=builder --chown=cotizador:cotizador /app/.next/static ./.next/static

USER cotizador

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]

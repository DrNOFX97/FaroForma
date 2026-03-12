# ── Stage 1: Frontend build ────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Server build ──────────────────────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build

# ── Stage 3: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy server compiled output and dependencies
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules

# Copy Vite frontend build
COPY --from=frontend-build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/dist/index.js"]

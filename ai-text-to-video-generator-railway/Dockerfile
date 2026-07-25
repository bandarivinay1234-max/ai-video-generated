# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

# Persistent data directory (mount a Railway volume here)
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "dist/server.cjs"]

FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY drizzle.config.js ./
COPY migrations ./migrations

EXPOSE 5000

CMD ["node", "src/server.js"]

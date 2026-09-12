FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/
RUN npm ci --omit=dev --workspaces --include-workspace-root

COPY src/ ./src/
COPY backends/ ./backends/

EXPOSE 8080

CMD ["node", "src/server.js"]

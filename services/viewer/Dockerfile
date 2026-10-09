# Build stage: compile TypeScript
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage: production dependencies, compiled code, page templates and static files
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# The pipeline passes its image tag here, so the running app can say which version it is.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY templates ./templates
COPY public ./public
COPY scripts ./scripts
USER node
EXPOSE 3000
CMD ["node", "--import", "@azure/monitor-opentelemetry/loader", "--import", "./dist/telemetry.js", "dist/index.js"]

FROM node:24-bookworm-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev --include=optional --no-audit --no-fund
COPY app ./app
COPY lib ./lib
COPY db ./db
COPY public ./public
COPY docker/votes-sqlite.ts ./docker/votes-sqlite.ts
COPY docker/vite.config.ts ./vite.config.ts
COPY tsconfig.json postcss.config.mjs ./
RUN node node_modules/vinext/dist/cli.js build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build /src/dist/standalone/ ./
COPY drizzle/*.sql ./drizzle/
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]

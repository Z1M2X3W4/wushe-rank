FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /app
ADD runtime.tar.gz ./
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]

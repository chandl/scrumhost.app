# mcr.microsoft.com/playwright ships Node + the exact browser binaries and
# OS deps matching the `playwright` npm version below; keep the tag in sync
# with package.json's "playwright" dependency.
FROM mcr.microsoft.com/playwright:v1.58.2-jammy AS build
WORKDIR /src
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.58.2-jammy
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /src/dist ./dist
RUN groupadd -r canary && useradd -r -g canary canary && chown -R canary:canary /app
USER canary:canary
EXPOSE 8081
ENV CANARY_HTTP_ADDR=:8081 \
    CANARY_INTERVAL=2m \
    CANARY_TIMEOUT=30s \
    CANARY_UI_INTERVAL=15m \
    CANARY_UI_TIMEOUT=120s
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8081/livez').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["node", "dist/index.js"]

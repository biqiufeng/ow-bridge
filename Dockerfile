# syntax=docker/dockerfile:1

# ---- test stage: verify the proxy core before packaging ----
FROM node:22-bookworm-slim AS test
WORKDIR /app
COPY package.json package-lock.json ./
# Core service only needs the "tar" runtime dependency; skip Electron devDependencies.
RUN npm ci --omit=dev --ignore-scripts
COPY src ./src
COPY test ./test
# Tests import files from desktop/ (activity.cjs, renderer.js)
COPY desktop ./desktop
RUN node --test test/*.test.js

# ---- runtime stage ----
FROM node:22-bookworm-slim AS runtime
# CA certs are required to reach the npm registry and model providers over HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 bridge
WORKDIR /app
COPY --from=test /app/node_modules ./node_modules
COPY --from=test /app/src ./src
COPY package.json ./
ENV BUDDY_DATA_DIR=/data \
    BUDDY_PORT=41980 \
    BUDDY_HOST=0.0.0.0 \
    BUDDY_NO_SYNC=1
RUN mkdir -p /data && chown bridge:bridge /data
USER bridge
VOLUME ["/data"]
EXPOSE 41980
# First start downloads the OpenCode runtime, so the start period is generous.
HEALTHCHECK --interval=15s --timeout=5s --start-period=180s --retries=3 \
  CMD node -e "const fs=require('node:fs');const key=fs.readFileSync('/data/api-key','utf8').trim();fetch('http://127.0.0.1:'+(process.env.BUDDY_PORT||41980)+'/health',{headers:{Authorization:'Bearer '+key}}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/main.js"]

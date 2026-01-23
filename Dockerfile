# Multi-stage build for Next.js

# Stage 1: Dependencies
# Debian slim (glibc) evita problemas com binários nativos (ex: lightningcss) no Alpine/musl
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Use Yarn (Yarn Classic) para instalar deps a partir do yarn.lock.
RUN corepack enable \
    && corepack prepare yarn@1.22.22 --activate

# Copy dependency manifests
COPY package.json yarn.lock ./

# Instala dependências (inclui optional deps por padrão)
RUN yarn install --frozen-lockfile

# Stage 2: Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Build-time public env (embutido no bundle do Next quando usado em client components)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN corepack enable \
    && corepack prepare yarn@1.22.22 --activate \
    && yarn build

# Stage 3: Runner - optimized final image
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the files needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/controlplane', (r) => {process.exit(r.statusCode >= 200 && r.statusCode < 400 ? 0 : 1)})"

CMD ["node", "server.js"]

# Base Image
FROM node:18-alpine AS base

# Dependencies Layer
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder Layer
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# We disable telemetry globally during the build process
ENV NEXT_TELEMETRY_DISABLED 1

# If using a .env file locally, ensure you pass build args here if required by Next.js static compilation.
RUN npm run build

# Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Setup group/user to run the app non-root for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy explicitly necessary files from the builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Note: The standalone build uses server.js
CMD ["node", "server.js"]

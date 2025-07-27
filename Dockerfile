# Render-optimized Dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sprintsync -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client
COPY src/prisma/ ./prisma/
RUN npx prisma generate

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create logs directory and set permissions
RUN mkdir -p logs && \
    chown -R sprintsync:nodejs /app

# Switch to non-root user
USER sprintsync

# Expose port (Render will set PORT env var)
EXPOSE $PORT

# Health check for Render
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Render will automatically run database migrations through render.yaml
CMD ["npm", "start"]

# HSM Tech Bot - Production Dockerfile
# Optimized for 24/7 deployment on Koyeb

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install production dependencies first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p auth data logs temp_downloads VU_Files

# Set environment to production
ENV NODE_ENV=production

# Expose port (for keep-alive health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the bot
CMD ["node", "bot.js"]

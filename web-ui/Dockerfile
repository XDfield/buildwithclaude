# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Set proxy for build
ARG HTTPS_PROXY
ARG HTTP_PROXY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set proxy for production
ARG HTTPS_PROXY
ARG HTTP_PROXY

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

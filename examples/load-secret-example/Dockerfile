# Build stage
FROM node:18-alpine AS deps
WORKDIR /app

# Create .npmrc with authentication token (required by GitHub)
ARG GITHUB_PACKAGES_TOKEN
RUN echo "@chipcleary:registry=https://npm.pkg.github.com" > .npmrc && \
  echo "//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}" >> .npmrc

COPY package*.json ./
RUN npm install
# Delete .npmrc to keep it out of the image
RUN rm .npmrc

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1

RUN NODE_ENV=production npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV APP_VERSION=${APP_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

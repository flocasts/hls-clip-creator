### ---- Base Node ----
FROM alpine:3.9 AS base
# Install node & tini process runner
RUN apk add --no-cache nodejs tini
# Set working directory
WORKDIR /app
# Set tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

#
# ---- System Dependencies ----
FROM base AS sys-dependencies
WORKDIR /app
RUN apk add --no-cache nodejs-npm

#
# ---- Application Dependencies ----
FROM sys-dependencies AS app-dependencies
WORKDIR /app
# Copy project file
COPY package.json package-lock.json ./
# Install node packages
RUN npm set progress=false && \
    npm config set depth 0 && \
    npm install --only=production
# Copy production node_modules aside
RUN cp -R node_modules prod_node_modules

#
# ---- Test & Build ----
# Run linters, tests, and build
FROM sys-dependencies AS test-and-build
WORKDIR /app
COPY . .
# Install ALL node_modules, including 'devDependencies'
RUN npm install
# RUN npm run lint && npm run test
RUN npm run build

#
# ---- Release ----
FROM base AS release
WORKDIR /app
# Copy production node_modules
COPY --from=app-dependencies /app/prod_node_modules ./node_modules
# Copy built app
COPY --from=test-and-build /app/dist ./dist

# Expose port and define CMD
EXPOSE 3000
CMD ["node", "dist/app.js"]

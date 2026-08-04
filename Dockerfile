# ── Stage 1: build the Vite app ──────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first so this layer is cached unless package*.json changes
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source and build
COPY . .

# Passed in at build time: docker build --build-arg VITE_API_URL=https://your-backend.onrender.com
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: serve the static build with Nginx ───────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

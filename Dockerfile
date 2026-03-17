# ==========================================
#  Stage 1: Build the React app
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json ./
RUN npm install ajv@latest ajv-keywords@latest

# Copy source and build
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# ==========================================
#  Stage 2: Serve with nginx
# ==========================================
FROM nginx:alpine

# Copy the built app
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

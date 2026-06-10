FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG EXPO_PUBLIC_API_BASE_URL=http://localhost:8082
ARG EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}
ENV EXPO_PUBLIC_SOCKET_URL=${EXPO_PUBLIC_SOCKET_URL}
ENV EXPO_TELEMETRY_DISABLED=1

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8083

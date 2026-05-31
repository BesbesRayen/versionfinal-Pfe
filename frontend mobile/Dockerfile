FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV EXPO_TELEMETRY_DISABLED=1
EXPOSE 8083

CMD ["npx", "expo", "start", "--web", "--host", "lan", "--port", "8083", "--clear"]

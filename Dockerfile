# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_HARBOUR_SHELL_URL=https://harbour.local
ENV VITE_HARBOUR_SHELL_URL=$VITE_HARBOUR_SHELL_URL

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache nginx chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV NODE_ENV=production
ENV PORT=3000
ENV TRUST_GATEWAY_HEADERS=true
ENV DOCS_DB_PATH=/data/docs.db
ENV DOCS_DATA_DIR=/data
ENV EXPORT_PDF_ENABLED=true
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY --from=build /app/dist/main.js ./dist/main.js
COPY --from=build /app/dist/ui /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data

EXPOSE 80
VOLUME ["/data"]
ENTRYPOINT ["/entrypoint.sh"]

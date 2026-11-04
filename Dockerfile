FROM node:22-alpine

WORKDIR /app

# Salin manifest dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Salin script server dan bundle frontend statis
COPY catalog_server.js ./
COPY public ./public

# Buat folder untuk persistence foto produk
RUN mkdir -p /app/public/images/products

# Default port dan host
ENV NODE_ENV=production
ENV PORT=3600
ENV CATALOG_HOST=0.0.0.0

EXPOSE 3600

CMD ["node", "catalog_server.js"]

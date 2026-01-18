FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Gera o cliente do Prisma para o Linux do container
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && npx prisma db seed && npm run dev"
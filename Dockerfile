FROM node:18-alpine

# Install netcat for database health checks
RUN apk add --no-cache netcat-openbsd

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps \
    && npm install @nestjs/config class-validator class-transformer \
    && npm install --save-dev prisma

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

EXPOSE 3000

COPY ./docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["npm", "run", "start:dev"]
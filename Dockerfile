FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install && \
    npm install @nestjs/config class-validator class-transformer

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
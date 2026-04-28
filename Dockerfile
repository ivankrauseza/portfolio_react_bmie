FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001

ENV HOST=0.0.0.0
VOLUME ["/app/data"]

CMD ["npm", "start"]

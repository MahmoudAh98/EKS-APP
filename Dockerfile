FROM  node:alpine

WORKDIR /app1

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]


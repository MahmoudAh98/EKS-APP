FROM  node:alpine

WORKDIR /app1

COPY APP/ .

EXPOSE 3000

CMD ["node", "app.js"]


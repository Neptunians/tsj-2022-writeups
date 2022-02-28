FROM node:16.6.0

WORKDIR /app/service-info/

COPY ./resource/keyfile /keyfile
COPY ./resource/flag /flag
COPY ./service-info/app.js .
COPY ./service-info/package.json .
RUN npm install

USER node

CMD ["node", "app.js"]

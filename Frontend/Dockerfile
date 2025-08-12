FROM node:22-alpine
WORKDIR /opt/app
COPY package.json .
RUN npm install
COPY . .
VOLUME ["/opt/app/node_modules"]
ARG DEFAULT_PORT=4200
ENV PORT=${DEFAULT_PORT}
EXPOSE ${DEFAULT_PORT}
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]

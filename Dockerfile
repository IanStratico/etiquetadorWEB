# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.10.0

FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine as base

WORKDIR /usr/src/app/

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3040
RUN npm run build
CMD [ "npm", "start" ]



FROM node:16-alpine AS balancer
WORKDIR /bwg/app
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm ci
ADD . .
RUN npm run build
RUN npm prune --production
EXPOSE 1000
CMD ["node", "./dist/main.js"]

FROM node:16-alpine AS s1
WORKDIR /bwg/s1
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD tsconfig.json tsconfig.json
ADD tsconfig.build.json tsconfig.build.json
RUN npm ci
ADD . .
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["node", "./dist/service/app.js"]

FROM node:16-alpine AS s2
WORKDIR /bwg/s2
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD tsconfig.json tsconfig.json
ADD tsconfig.build.json tsconfig.build.json
RUN npm ci
ADD . .
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["node", "./dist/service/app.js"]

FROM node:16-alpine AS s3
WORKDIR /bwg/s3
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD tsconfig.json tsconfig.json
ADD tsconfig.build.json tsconfig.build.json
RUN npm ci
ADD . .
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["node", "./dist/service/app.js"]

FROM node:16-alpine AS s4
WORKDIR /bwg/s4
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD tsconfig.json tsconfig.json
ADD tsconfig.build.json tsconfig.build.json
RUN npm ci
ADD . .
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["node", "./dist/service/app.js"]
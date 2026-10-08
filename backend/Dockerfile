# Backend image with ffprobe for real server-side media validation.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npx nest build

# Test image: dev deps + ffmpeg, runs the integration/contract suites in-container.
FROM node:22-alpine AS test
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
COPY test ./test
COPY scripts ./scripts

FROM node:22-alpine
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
ENV MEDIA_STORAGE_DIR=/var/lib/isnextgen/media
VOLUME ["/var/lib/isnextgen/media"]
EXPOSE 3001
# Freeze-keeping entrypoint: apply the verbatim baseline, then run.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

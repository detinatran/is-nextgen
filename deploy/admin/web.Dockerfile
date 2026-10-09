# App admin (Next.js chạy server) phục vụ dưới https://nextgen.vnuis.edu.vn/admin
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_ADMIN_API_BASE=/admin/api/v1
ARG NEXT_PUBLIC_ADMIN_ASSET_BASE=/admin
ARG ADMIN_ASSET_PREFIX=/admin
ENV NEXT_PUBLIC_ADMIN_API_BASE=$NEXT_PUBLIC_ADMIN_API_BASE \
    NEXT_PUBLIC_ADMIN_ASSET_BASE=$NEXT_PUBLIC_ADMIN_ASSET_BASE \
    ADMIN_ASSET_PREFIX=$ADMIN_ASSET_PREFIX \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

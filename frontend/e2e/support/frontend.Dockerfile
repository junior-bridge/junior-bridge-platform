FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Copia explícita: ni credenciales locales ni la infraestructura E2E pendiente de Carlos.
COPY app ./app
COPY components ./components
COPY constants ./constants
COPY context ./context
COPY hooks ./hooks
COPY lib ./lib
COPY services ./services
COPY types ./types
COPY public ./public
COPY tsconfig.json postcss.config.mjs ./
COPY e2e/support/next.e2e.config.ts ./next.config.ts
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]

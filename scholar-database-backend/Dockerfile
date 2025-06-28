FROM oven/bun AS builder

WORKDIR /mnt

COPY . .

RUN bun install

RUN bun run build

FROM builder AS runner

WORKDIR /mnt

COPY --from=builder ./out/index.js .

COPY --from=builder .env .

EXPOSE 8000

ENTRYPOINT [ "bun", "run", "index.js" ]
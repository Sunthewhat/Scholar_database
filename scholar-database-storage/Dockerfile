FROM oven/bun AS builder

WORKDIR /mnt

COPY . .

RUN bun install

RUN bun run build

FROM builder AS runner

WORKDIR /mnt

COPY --from=builder mnt/out/index.js .

COPY --from=builder mnt/.env .

EXPOSE 9000

ENTRYPOINT [ "bun", "run", "index.js" ]
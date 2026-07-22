import { defineConfig, env } from "prisma/config";

process.loadEnvFile(".env");

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

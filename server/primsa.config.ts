import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // The Prisma CLI uses this DIRECT_URL to run migrations (bypassing connection poolers)
    url: env("DIRECT_URL"),
  },
});

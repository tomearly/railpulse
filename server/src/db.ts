// server/src/db.ts
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client.js";

const connectionString = process.env.DATABASE_URL;

// Automatically detect if you are running against a local database or cloud
const isLocal = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");

const pool = new pg.Pool({
  connectionString,
  // 💡 Turn off SSL for local dev, enable it with relaxed validation for cloud Supabase
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
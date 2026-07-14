// server/prisma/seed.ts
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client/client.js";
import "dotenv/config";

// Setup the connection pool just like we did in db.ts
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up old database records...");
  // Clear any existing data so we don't create duplicates if we run this twice
  await prisma.departure.deleteMany({});
  await prisma.arrival.deleteMany({});
  await prisma.station.deleteMany({});

  console.log("Seeding new station data...");
// 1. Create Northampton
  const nmp = await prisma.station.create({
    data: { code: "NMP", name: "Northampton" },
  });

  // 2. Create London Euston
  const eus = await prisma.station.create({
    data: { code: "EUS", name: "London Euston" },
  });

  console.log("Seeding train departures...");
  // 2. Create the departures linked directly to that station via foreign key
  await prisma.departure.createMany({
    data: [
      // Northampton Departures
      { time: "14:32", destination: "London Euston", operator: "London Northwestern Railway", platform: "1", status: "On Time", stationId: nmp.id },
      { time: "14:45", destination: "Birmingham New Street", operator: "London Northwestern Railway", platform: "2", status: "Delayed", delayMins: 12, stationId: nmp.id },

      // London Euston Departures
      { time: "15:10", destination: "Manchester Piccadilly", operator: "Avanti West Coast", platform: "6", status: "On Time", stationId: eus.id },
      { time: "15:23", destination: "Birmingham New Street", operator: "Avanti West Coast", platform: "12", status: "Delayed", delayMins: 5, stationId: eus.id },
      { time: "15:40", destination: "Glasgow Central", operator: "Avanti West Coast", platform: "15", status: "Cancelled", stationId: eus.id },
    ],
  });

  await prisma.arrival.createMany({
    data: [
      // Northampton Arrivals
      { time: "16:25", destination: "Northampton", operator: "London Northwestern Railway", platform: "1", status: "On Time", stationId: nmp.id },
      { time: "16:45", destination: "Birmingham New Street", operator: "London Northwestern Railway", platform: "2", status: "Delayed", delayMins: 12, stationId: nmp.id },

      // London Euston Arrivals
      { time: "15:10", destination: "London Euston", operator: "Avanti West Coast", platform: "6", status: "On Time", stationId: eus.id },
      { time: "15:23", destination: "London Euston", operator: "Avanti West Coast", platform: "12", status: "Delayed", delayMins: 5, stationId: eus.id },
      { time: "15:40", destination: "London Euston", operator: "Avanti West Coast", platform: "15", status: "Cancelled", stationId: eus.id },
    ],
  });

  console.log("Database seeding completed successfully! 🎉");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection pool cleanly
    await pool.end();
  });

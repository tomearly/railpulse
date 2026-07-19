// server/prisma/seed.ts
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client/client.js";
import "dotenv/config";
import { faker } from '@faker-js/faker';

const FAILURE_REASONS = [
  "Signal Failure", "Overhead Wire Damage", "Shortage of Train Crew",
  "Track Circuit Failure", "Medical Emergency", "Severe Weather",
  "Faulty Train", "Speed Restrictions", "Planned Engineering Works"
];

const stationData = [
  { name: 'London Euston', crs: 'EUS' },
  { name: 'Manchester Piccadilly', crs: 'MAN' },
  { name: 'Birmingham New Street', crs: 'BHM' },
  { name: 'London Kings Cross', crs: 'KGX' },
  { name: 'London Paddington', crs: 'PAD' },
  { name: 'London Victoria', crs: 'VIC' },
  { name: 'London St Pancras', crs: 'STP' },
  { name: 'Cardiff Central', crs: 'CDF' }
];

// Setup the connection pool just like we did in db.ts
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
  console.log('Clearing existing data...');
  // Delete in reverse order of dependencies to satisfy foreign key constraints
  await prisma.serviceStop.deleteMany();
  await prisma.service.deleteMany();
  await prisma.departureBoard.deleteMany();
  await prisma.station.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.status.deleteMany();
}

const trainOperators = [
  { name: 'Avanti West Coast', code: 'VT' },
  { name: 'c2c', code: 'CC' },
  { name: 'Chiltern Railways', code: 'CH' },
  { name: 'CrossCountry', code: 'XC' },
  { name: 'East Midlands Railway', code: 'EM' },
  { name: 'Great Western Railway', code: 'GW' },
  { name: 'Greater Anglia', code: 'LE' },
  { name: 'London North Eastern Railway', code: 'GR' },
  { name: 'Northern Trains', code: 'NT' },
  { name: 'Southeastern', code: 'SE' },
  { name: 'South Western Railway', code: 'SW' },
  { name: 'TransPennine Express', code: 'TP' },
  { name: 'Transport for Wales Rail', code: 'AW' },
  { name: 'West Midlands Railway', code: 'LM' }
];

async function main() {
  // 1. Setup Stations
  await prisma.station.createMany({data: stationData, skipDuplicates: true});
  const allStations = await prisma.station.findMany();

  // 2. Setup Operators
  const trainOperators = [
    {name: 'Avanti West Coast', code: 'VT'},
    {name: 'CrossCountry', code: 'XC'},
    {name: 'Great Western Railway', code: 'GW'},
    {name: 'LNER', code: 'GR'}
  ];

  for (const op of trainOperators) {
    await prisma.operator.upsert({
      where: {code: op.code},
      update: {},
      create: {name: op.name, code: op.code}
    });
  }
  const operators = await prisma.operator.findMany();

  // 3. Seed Services
  for (const station of allStations) {
    const board = await prisma.departureBoard.create({
      data: {generatedAt: new Date(), stationId: station.id}
    });

    for (let i = 0; i < 20; i++) {
      const delayMinutes = faker.helpers.arrayElement([0, 0, 0, 5, 10]);
      const randomOperator = operators[Math.floor(Math.random() * operators.length)];

      // Select 2-3 intermediate stops from the available stations
      const otherStations = allStations.filter(s => s.id !== station.id);
      const intermediateStops = faker.helpers.arrayElements(otherStations, faker.number.int({min: 2, max: 3}));

      await prisma.service.create({
        data: {
          id: faker.string.uuid(),
          trainUid: faker.string.alphanumeric(8).toUpperCase(),
          mode: 'train',
          category: 'express',
          departureInfo: faker.date.soon({ days: 1 }),
          platform: faker.helpers.arrayElement(['1', '2', '3', '4', '5']),

          // Fix: Use the 'connect' syntax for the operator relation
          operator: {
            connect: { id: randomOperator.id }
          },

          board: {
            connect: { id: board.id }
          },

          status: {
            create: {
              status: delayMinutes === 0 ? 'On Time' : 'Delayed',
              delayMinutes: delayMinutes
            }
          },

          stops: {
            create: [
              { stopOrder: 0, scheduledTime: new Date(), stationId: station.id },
              ...intermediateStops.map((s, idx) => ({
                stopOrder: idx + 1,
                scheduledTime: faker.date.soon({ days: 1 }),
                stationId: s.id
              })),
              {
                stopOrder: intermediateStops.length + 1,
                scheduledTime: faker.date.soon({ days: 1 }),
                stationId: faker.helpers.arrayElement(otherStations).id
              }
            ]
          }
        }
      });
    }
  }
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

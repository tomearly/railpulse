// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db'; // Pulls in our Prisma PG client from db.ts

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running smoothly', database: 'connected' });
});

// The dynamic endpoint!
app.get('/api/departures', async (req, res) => {
  try {
    // 1. Grab the "code" query parameter (e.g. /api/departures?code=EUS)
    // If none is supplied, default to "NMP" (Northampton)
    const stationCode = (req.query.code as string || 'NMP').toUpperCase();

    // 2. Look up the station in Supabase and pull its departures simultaneously
    const stationData = await prisma.station.findUnique({
      where: { code: stationCode },
      include: {
        departures: {
          orderBy: {
            time: 'asc',
          },
        },
      },
    });

    // 3. If the station code doesn't exist, send a clean 404 error
    if (!stationData) {
      return res.status(404).json({ error: `Station code '${stationCode}' not found.` });
    }

    // 4. Send back the real station name and its departures
    res.json({
      stationName: stationData.name,
      departures: stationData.departures,
    });
  } catch (error) {
    console.error('Database query failure:', error);
    res.status(500).json({ error: 'Failed to retrieve departure information.' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
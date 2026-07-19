// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db';
import { setupSwagger } from './swagger';

import departureRoutes from './routes/departures';
import stations from './routes/stations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

app.use(cors());
app.use(express.json());

setupSwagger(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running smoothly', database: 'connected' });
});

app.use('/api/v1', departureRoutes);
app.use('/api/v1', stations);

app.get('/api/arrivals', async (req, res) => {
    try {
        const stationCode = (req.query.code as string || 'NMP').toUpperCase();

      // 2. Look up the station in Supabase and pull its departures simultaneously
      const stationData = await prisma.station.findUnique({
        where: { code: stationCode },
        include: {
          arrivals: {
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

      // 4. Send back the real station name and its arrivals
      res.json({
        stationName: stationData.name,
        arrivals: stationData.arrivals,
      });
    } catch (error) {
      console.error('Database query failure:', error);
      res.status(500).json({ error: 'Failed to retrieve arrival information.' });
    }
});

app.get('/api/arrivals/:id', async (req, res) => {
    try {
        const arrivalId = req.params.id;

        // Look up the arrival by ID
        const arrival = await prisma.arrival.findUnique({
            where: { id: arrivalId },
        });

        if (!arrival) {
            return res.status(404).json({ error: `Arrival with ID '${arrivalId}' not found.` });
        }

        res.json(arrival);
    } catch (error) {
        console.error('Database query failure:', error);
        res.status(500).json({ error: 'Failed to retrieve arrival information.' });
    }
});


app.post('/api/arrivals', async (req, res) => {
  try {
    const { stationCode, time, origin, operator, platform, status, delayMins } = req.body;

    // Validate required fields
    if (!stationCode || !time || !origin || !operator || !platform || !status) {
      return res.status(400).json({ error: 'Missing required fields in request body.' });
    }

    // Find the station by code
    const station = await prisma.station.findUnique({
      where: { code: stationCode.toUpperCase() },
    });

    if (!station) {
      return res.status(404).json({ error: `Station code '${stationCode}' not found.` });
    }

    // Create a new arrival linked to the station
    const newArrival = await prisma.arrival.create({
      data: {
        time,
        destination: origin,
        operator,
        platform,
        status,
        delayMins: delayMins || null,
        stationId: station.id,
      },
    });

    res.status(201).json(newArrival);
  } catch (error) {
    console.error('Error creating arrival:', error);
    res.status(500).json({ error: 'Failed to create new arrival.' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
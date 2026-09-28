// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './db';
import { setupSwagger } from './swagger';

import departureRoutes from './routes/departures';
import stations from './routes/stations';
import weather from './routes/weather';

dotenv.config();

const app = express();

// Vite picks the next free port (5173, 5174, ...) when the default is taken,
// so match any localhost/127.0.0.1 port in dev rather than hardcoding one.
const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

function isAllowedOrigin(origin: string) {
    return devOriginPattern.test(origin);
}

const PORT = Number(process.env.PORT) || 4000;

// ---------------------------------------------------------
// SECURITY MIDDLEWARE
// ---------------------------------------------------------
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per window
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: { error: 'Too many requests from this IP, please try again later.' }
// });

// Robust dynamic CORS configuration for Express
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by Express CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
// app.use('/api/', apiLimiter);

setupSwagger(app);

// ---------------------------------------------------------
// EXPRESS REST API ROUTES
// ---------------------------------------------------------

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running smoothly', database: 'connected' });
});

app.use('/api/v1', departureRoutes);
app.use('/api/v1', stations);
app.use('/api/v1', weather);

app.get('/api/arrivals', async (req, res) => {
    try {
        const stationCode = (req.query.code as string || 'EUS').toUpperCase();

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

        if (!stationData) {
            return res.status(404).json({ error: `Station code '${stationCode}' not found.` });
        }

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

        if (!stationCode || !time || !origin || !operator || !platform || !status) {
            return res.status(400).json({ error: 'Missing required fields in request body.' });
        }

        const station = await prisma.station.findUnique({
            where: { code: stationCode.toUpperCase() },
        });

        if (!station) {
            return res.status(404).json({ error: `Station code '${stationCode}' not found.` });
        }

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

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

export default app;
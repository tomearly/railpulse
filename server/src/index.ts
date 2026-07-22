// server/src/index.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './db';
import { setupSwagger } from './swagger';

import departureRoutes from './routes/departures';
import stations from './routes/stations';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

// Robust dynamic CORS configuration for Socket.io
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by Socket.io CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

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
        if (allowedOrigins.indexOf(origin) !== -1) {
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
// WEATHER / REAL-TIME STREAMING SETUP
// ---------------------------------------------------------
const stationData = [
    { name: 'London Euston', crs: 'EUS', lat: 51.5281, lng: -0.1337 },
    { name: 'Manchester Piccadilly', crs: 'MAN', lat: 53.4774, lng: -2.2309 },
    { name: 'Birmingham New Street', crs: 'BHM', lat: 52.4778, lng: -1.8992 },
    { name: 'London Kings Cross', crs: 'KGX', lat: 51.5322, lng: -0.1233 },
    { name: 'London Paddington', crs: 'PAD', lat: 51.5154, lng: -0.1755 },
    { name: 'London Victoria', crs: 'VIC', lat: 51.4952, lng: -0.1439 },
    { name: 'London St Pancras', crs: 'STP', lat: 51.5317, lng: -0.1260 },
    { name: 'Cardiff Central', crs: 'CDF', lat: 51.4764, lng: -3.1779 }
];

const crsCodes = stationData.map(station => station.crs);

async function fetchWeatherData(stationCode = 'EUS') {
    try {
        console.log('stationCode: ' + stationCode)
        const station = stationData.find(station => station.crs === stationCode);

        if (!station?.lat && !station?.lng) {
            throw new Error('Cannot get data for station')
        }

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );
        const data = await response.json();
        return data.current;
    } catch (error) {
        console.error('Failed to fetch weather feed:', error);
        return null;
    }
}

setInterval(async () => {
    const weatherData = await fetchWeatherData();
    if (weatherData) {
        io.emit('rail-weather-stream', weatherData);
    }
}, 30000);

io.on('connection', (socket) => {
    let stationCode = socket.handshake.query.stationCode;

    socket.on('request-station-weather', async ({ stationCode }) => {
        const weatherData = await fetchWeatherData(stationCode);
        if (weatherData) {
            // Send it back exclusively to the client that asked,
            // or use io.emit if you want to broadcast it
            socket.emit('rail-weather-stream', weatherData);
        } else {
            socket.emit('rail-weather-stream', {});

        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// ---------------------------------------------------------
// EXPRESS REST API ROUTES
// ---------------------------------------------------------

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running smoothly', database: 'connected' });
});

app.use('/api/v1', departureRoutes);
app.use('/api/v1', stations);

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

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
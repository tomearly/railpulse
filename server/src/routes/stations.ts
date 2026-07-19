import { Router } from 'express';
const router = Router();
import { prisma } from '../db';

// GET /api/stations/:crs
router.get('/stations/:crs', async (req, res) => {
    const { crs } = req.params;

    try {
        const station = await prisma.station.findUnique({
            where: { crs: crs.toUpperCase() },
            // Optional: Include related data if you want to see what's currently
            // departing or arriving at this specific station
            include: {
                serviceStops: {
                    take: 5,
                    orderBy: { scheduledTime: 'desc' }
                }
            }
        });

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        res.json(station);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
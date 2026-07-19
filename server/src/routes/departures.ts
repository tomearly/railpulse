import { Router } from 'express';
const router = Router();
import { prisma } from '../db';


// GET /api/departures/:crs
// Returns the departure board for a specific station
router.get('/departures/:crs', async (req, res) => {
    const { crs } = req.params;

    try {
        const departures = await prisma.service.findMany({
            where: {
                stops: {
                    some: {
                        station: { crs: crs.toUpperCase() },
                        stopOrder: 0 // Only services where this station is the origin
                    }
                },
                departureInfo: { gte: new Date() } // Upcoming only
            },
            orderBy: { departureInfo: 'asc' },
            include: {
                operator: true,
                status: true,
                stops: {
                    include: { station: true },
                    orderBy: { stopOrder: 'asc' }
                }
            }
        });

        res.json(departures);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departure board' });
    }
});

// GET /api/service/:rid
// Returns full details for a specific train service
router.get('/service/:rid', async (req, res) => {
    const { rid } = req.params;

    try {
        const service = await prisma.service.findUnique({
            where: { id: rid },
            include: {
                operator: true,
                status: true,
                stops: {
                    include: { station: true },
                    orderBy: { stopOrder: 'asc' }
                }
            }
        });

        if (!service) return res.status(404).json({ error: 'Service not found' });

        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch service details' });
    }
});

export default router;
import { Router } from 'express';

const router = Router();

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

async function fetchWeatherData(stationCode = 'EUS') {
    try {
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

// GET /api/v1/weather/:crs
router.get('/weather/:crs', async (req, res) => {
    const { crs } = req.params;

    const weatherData = await fetchWeatherData(crs.toUpperCase());

    if (!weatherData) {
        return res.status(404).json({ error: `Weather data unavailable for station '${crs.toUpperCase()}'.` });
    }

    res.json(weatherData);
});

export default router;

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

// 1. Create the socket instance OUTSIDE the component
// so it establishes a single, persistent connection
const socket = io('http://localhost:4000', {
    withCredentials: true,
});

interface WeatherTelemetryWidgetProps {
    stationCode: string;
    lat: number;
    lng: number;
}

export default function WeatherTelemetryWidget({ stationCode, lat, lng }: WeatherTelemetryWidgetProps) {
    const [weather, setWeather] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        // 1. Instantly trigger a weather fetch for the new station's coordinates
        if (stationCode.length !== 3) return;
        socket.emit('request-station-weather', { stationCode });

        // 2. Define the listener for incoming data
        const handleWeatherUpdate = (incomingData: any) => {
            setWeather(incomingData);
            setLastUpdated(new Date().toLocaleTimeString());
        };

        socket.on('rail-weather-stream', handleWeatherUpdate);

        // Cleanup: remove the listener when the station changes or component unmounts
        return () => {
            socket.off('rail-weather-stream', handleWeatherUpdate);
        };
    }, [stationCode]);

    if (!weather) {
        return <div className="p-4 text-slate-400">Awaiting live weather stream telemetry for {stationCode}...</div>;
    }

    return (
        <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg max-w-sm">
            <h3 className="text-xl font-bold mb-4">Live Weather ({stationCode})</h3>
            <div className="space-y-2">
                <p><strong>Temperature:</strong> {weather?.temperature_2m}°C</p>
                <p><strong>Wind Speed:</strong> {weather?.wind_speed_10m} km/h</p>
                <p><strong>Humidity:</strong> {weather?.relative_humidity_2m}%</p>
            </div>
            {lastUpdated && (
                <span className="text-xs text-slate-400 mt-4 block">
                    Last synced: {lastUpdated}
                </span>
            )}
        </div>
    );
}
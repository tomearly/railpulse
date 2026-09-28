import { useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 30000;

interface WeatherTelemetryWidgetProps {
    stationCode: string;
}

export default function WeatherTelemetryWidget({ stationCode }: WeatherTelemetryWidgetProps) {
    const [weather, setWeather] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        if (stationCode.length !== 3) return;

        const controller = new AbortController();

        const fetchWeather = async () => {
            try {
                const response = await fetch(`/api/v1/weather/${stationCode}`, { signal: controller.signal });
                if (!response.ok) return;

                const data = await response.json();
                setWeather(data);
                setLastUpdated(new Date().toLocaleTimeString());
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('Failed to fetch weather telemetry:', err);
            }
        };

        void fetchWeather();
        const intervalId = setInterval(fetchWeather, POLL_INTERVAL_MS);

        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [stationCode]);

    if (!weather) {
        return <div className="p-4 text-slate-400">Awaiting live weather telemetry for {stationCode}...</div>;
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

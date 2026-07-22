import {useEffect, useState} from 'react'
import WeatherTelemetryWidget from './WeatherTelemetryWidget.tsx'

export interface Station {
    id: string;
    name: string;
    crs: string;
}

export interface Operator {
    id: string;
    name: string;
    code: string;
}

export interface Status {
    id: string;
    status: string;
    delayMinutes: number;
    reason: string | null;
}

export interface ServiceStop {
    id: string;
    serviceId: string;
    stationId: string;
    stopOrder: number;
    scheduledTime: Date | string; // Date string if serialized as JSON
    estimatedTime: Date | string | null;
    station: Station;
}

export interface Service {
    id: string;
    trainUid: string;
    mode: string;
    category: string;
    departureInfo: Date | string;
    operator: Operator;
    status: Status;
    stops: ServiceStop[];
}

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

export default function App() {
    const [searchCode, setSearchCode] = useState('EUS')

    // State to hold actual display data returned from our API
    const [stationName, setStationName] = useState('Euston')
    const [departures, setDepartures] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [unknownStation, setUnknownStation] = useState('')

    // 2. Fetch runs whenever searchCode changes!
    useEffect(() => {
        setUnknownStation('')

        // Only fetch if the user has entered a standard 3-letter British rail code
        if (searchCode.length !== 3) {
            return;
        }
        if (!crsCodes.includes(searchCode)) {
            setStationName('Unknown Station')
            setUnknownStation('Unknown station code')
            setTimeout(() => {
                setSearchCode('')
            }, 3000);
            return;
        }

        const controller = new AbortController(); // Prevents memory leaks if searchCode changes fast

        setLoading(true);
        setError(null);

        fetch(`/api/v1/stations/${searchCode}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Station '${searchCode.toUpperCase()}' not found`);
                setStationName('')

                return res.json();
            })
            .then((data) => {
                setStationName(data.name);
            })
            .catch((err) => {
                setError(err.message);
            });

        const fetchDepartures = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/v1/departures/${searchCode}`);
                const data = await response.json();
                setDepartures(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchDepartures();
        return () => controller.abort(); // Cleanup function
    }, [searchCode]); // <-- Adding searchCode here makes this effect react to input changes!

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
            <header
                className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
                <div>
                    <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">Live Departure Board</span>
                    <h1 className="text-4xl font-extrabold tracking-tight mt-1">
                        {loading ? "Searching..." : `${stationName} (${searchCode.toUpperCase()})`}
                    </h1>
                </div>
                <WeatherTelemetryWidget stationCode={searchCode} />

                <div className="mt-4 md:mt-0">
                    <label className="text-xs text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Enter 3-Letter Station Code</label>
                    <input
                        type="text"
                        maxLength={3}
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                        className="my-4 bg-slate-900 border border-slate-700 text-amber-500 font-mono tracking-widest text-xl px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-48 text-center uppercase"
                        placeholder="EUS"
                    />
                    <p className="text-amber-500">{unknownStation && <span>{unknownStation }</span>}</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div
                        className="bg-slate-950 px-6 py-3 border-b border-slate-800 grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span className="col-span-2">Dep. Time</span>
                        <span className="col-span-4">Destination & Stops</span>
                        <span className="col-span-2">Operator</span>
                        <span className="col-span-2 text-center">Platform</span>
                        <span className="col-span-2 text-right">Status</span>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {departures?.map((train) => {
                            const destination = train.stops[train.stops.length - 1]?.station.name || "Unknown";
                            const time = new Date(train.departureInfo).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return (
                                <div key={train.id}
                                     className="px-6 py-5 grid grid-cols-12 gap-4 items-start hover:bg-slate-900/50 transition-colors">
                                    {/* Time */}
                                    <span className="col-span-2 text-amber-500 font-mono text-lg font-bold">
                            {time}
                        </span>

                                    {/* Destination & Stops */}
                                    <div className="col-span-4" style={{overflow: 'hidden', position: 'relative'}}>
                                        <div style={{color: '#f1f5f9', fontWeight: 600, letterSpacing: '0.025em'}}>
                                            {destination}
                                        </div>

                                        <div className="scroll-container">
                                            {train.stops.length > 2 ? <>
                                                <div className="scroll-container">
                                                    <div className="scroll-text">
    <span style={{ fontSize: '10px', color: '#64748b' }}>
      Calls at: {train.stops.slice(1, -1).map(s => s.station.name).join(' • ')}
    </span>
                                                    </div>
                                                </div>
                                            </> : <>
                                                <div style={{fontSize: '10px', color: '#64748b'}}>Direct Service</div>
                                            </>}
                                        </div>
                                    </div>

                                    {/* Operator */}
                                    <span className="col-span-2 text-slate-400 text-xs mt-1">
                            {train.operator.name}
                        </span>

                                    {/* Platform */}
                                    <span
                                        className="col-span-2 text-center font-mono text-white bg-slate-800 px-2 py-1 rounded">
                            {train.platform || '—'}
                        </span>

                                    {/* Status */}
                                    <div className="col-span-2 text-right font-semibold">
                                        {train.status.status === 'On Time' ? (
                                            <span className="text-emerald-400">On Time</span>
                                        ) : (
                                            <span className="text-amber-500 animate-pulse">
                                    {train.status.status} {train.status.delayMinutes > 0 ? `(${train.status.delayMinutes}m)` : ''}
                                </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {departures.length === 0 &&
                        <p className="p-4">No planned departures</p>
                    }
                </div>
            </main>
        </div>
    )
}
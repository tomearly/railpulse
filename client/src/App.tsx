import { useState, useEffect } from 'react'

interface Departure {
  id: string;
  time: string;
  destination: string;
  operator: string;
  platform: string;
  status: 'On Time' | 'Delayed' | 'Cancelled';
  delayMins?: number;
}

export default function App() {
  // 1. State to track the raw 3-letter code input (defaults to NMP)
  const [searchCode, setSearchCode] = useState('NMP')

  // State to hold actual display data returned from our API
  const [stationName, setStationName] = useState('Northampton')
  const [departures, setDepartures] = useState<Departure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 2. Fetch runs whenever searchCode changes!
  useEffect(() => {
    // Only fetch if the user has entered a standard 3-letter British rail code
    if (searchCode.length !== 3) return;

    setLoading(true);
    setError(null);

    fetch(`/api/departures?code=${searchCode}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Station '${searchCode.toUpperCase()}' not found`);
          return res.json();
        })
        .then((data) => {
          setStationName(data.stationName);
          setDepartures(data.departures);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
  }, [searchCode]); // <-- Adding searchCode here makes this effect react to input changes!

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
        <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">Live Departure Board</span>
            <h1 className="text-4xl font-extrabold tracking-tight mt-1">
              {loading ? "Searching..." : `${stationName} (${searchCode.toUpperCase()})`}
            </h1>
          </div>

          <div className="mt-4 md:mt-0">
            <label className="text-xs text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Enter 3-Letter Station Code</label>
            <input
                type="text"
                maxLength={3}
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                className="bg-slate-900 border border-slate-700 text-amber-500 font-mono tracking-widest text-xl px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-48 text-center uppercase"
                placeholder="NMP"
            />
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="col-span-2">Dep. Time</span>
              <span className="col-span-4">Destination</span>
              <span className="col-span-2">Operator</span>
              <span className="col-span-2 text-center">Platform</span>
              <span className="col-span-2 text-right">Status</span>
            </div>

            {loading && departures.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  <span className="animate-pulse">Loading live departures...</span>
                </div>
            ) : error ? (
                <div className="p-12 text-center text-rose-500 font-semibold">
                  {error}
                </div>
            ) : departures.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  No scheduled departures from this station today.
                </div>
            ) : (
                <div className="divide-y divide-slate-800">
                  {departures.map((train) => (
                      <div
                          key={train.id}
                          className="px-6 py-5 grid grid-cols-12 gap-4 items-center text-sm font-medium hover:bg-slate-900/50 transition-colors"
                      >
                  <span className="col-span-2 text-amber-500 font-mono text-lg font-bold">
                    {train.time}
                  </span>
                        <span className="col-span-4 text-slate-100 font-semibold tracking-wide">
                    {train.destination}
                  </span>
                        <span className="col-span-2 text-slate-400 text-xs">
                    {train.operator}
                  </span>
                        <span className="col-span-2 text-center font-mono text-amber-500 font-semibold">
                    {train.platform || '—'}
                  </span>
                        <div className="col-span-2 text-right font-semibold">
                          {train.status === 'On Time' && (
                              <span className="text-emerald-400">On Time</span>
                          )}
                          {train.status === 'Delayed' && (
                              <span className="text-amber-500 animate-pulse">
                        Delayed ({train.delayMins}m)
                      </span>
                          )}
                          {train.status === 'Cancelled' && (
                              <span className="text-rose-500">Cancelled</span>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>

          <footer className="mt-6 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Connected to Node Express API & Supabase Postgres</span>
            <span>Prisma v7 Active</span>
          </footer>
        </main>
      </div>
  )
}
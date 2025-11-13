import React, { useState, useEffect } from 'react';
import { Globe, Activity, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

const REGIONS = [
  { id: 'us-east', name: 'US East', lat: 40.7128, lng: -74.0060 },
  { id: 'us-west', name: 'US West', lat: 37.7749, lng: -122.4194 },
  { id: 'eu-west', name: 'EU West', lat: 51.5074, lng: -0.1278 },
  { id: 'ap-south', name: 'AP South', lat: 1.3521, lng: 103.8198 },
  { id: 'ap-northeast', name: 'AP Northeast', lat: 35.6762, lng: 139.6503 }
];

export default function App() {
  const [url, setUrl] = useState('https://www.cloudflare.com');
  const [monitoring, setMonitoring] = useState(false);
  const [currentData, setCurrentData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, min: 0, max: 0, p95: 0 });

  const measurePerformance = async (targetUrl) => {
    const measurements = [];
    
    for (const region of REGIONS) {
      const startTime = performance.now();
      
      try {
        // Simulate different response times based on region
        const baseLatency = Math.random() * 200 + 100;
        const regionFactor = region.id.includes('us') ? 1 : 1.5;
        const jitter = Math.random() * 50;
        const loadTime = baseLatency * regionFactor + jitter;
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        measurements.push({
          region: region.name,
          regionId: region.id,
          loadTime: Math.round(loadTime),
          timestamp: new Date().toISOString(),
          status: loadTime < 300 ? 'good' : loadTime < 500 ? 'warning' : 'poor'
        });
      } catch (error) {
        measurements.push({
          region: region.name,
          regionId: region.id,
          loadTime: 0,
          timestamp: new Date().toISOString(),
          status: 'error'
        });
      }
    }
    
    return measurements;
  };

  const calculateStats = (data) => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
    
    const times = data.map(d => d.loadTime).filter(t => t > 0).sort((a, b) => a - b);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p95Index = Math.floor(times.length * 0.95);
    const p95 = times[p95Index] || max;
    
    return { avg, min, max, p95 };
  };

  const startMonitoring = async () => {
    setMonitoring(true);
    setHistoricalData([]);
    
    const measurements = await measurePerformance(url);
    setCurrentData(measurements);
    setStats(calculateStats(measurements));
    
    const timestamp = new Date().toLocaleTimeString();
    const avgLoad = Math.round(measurements.reduce((a, b) => a + b.loadTime, 0) / measurements.length);
    setHistoricalData([{ time: timestamp, avgLoad }]);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
  };

  useEffect(() => {
    if (!monitoring) return;
    
    const interval = setInterval(async () => {
      const measurements = await measurePerformance(url);
      setCurrentData(measurements);
      setStats(calculateStats(measurements));
      
      const timestamp = new Date().toLocaleTimeString();
      const avgLoad = Math.round(measurements.reduce((a, b) => a + b.loadTime, 0) / measurements.length);
      
      setHistoricalData(prev => {
        const newData = [...prev, { time: timestamp, avgLoad }];
        return newData.slice(-20);
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [monitoring, url]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getBarColor = (loadTime) => {
    if (loadTime < 300) return '#10b981';
    if (loadTime < 500) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold">Global Performance Monitor</h1>
          </div>
          <p className="text-slate-400">Real-time website performance tracking across multiple regions</p>
        </div>

        {/* URL Input */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">Target URL</label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={monitoring}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {!monitoring ? (
              <button
                onClick={startMonitoring}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {currentData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Average</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{stats.avg}ms</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Min</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{stats.min}ms</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Max</span>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold">{stats.max}ms</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">P95</span>
                <Activity className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold">{stats.p95}ms</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regional Performance */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Regional Performance
            </h2>
            {currentData.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start monitoring to see regional performance data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentData.map((data) => (
                  <div key={data.regionId} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{data.region}</span>
                      <span className={`font-bold ${getStatusColor(data.status)}`}>
                        {data.loadTime}ms
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((data.loadTime / 600) * 100, 100)}%`,
                          backgroundColor: getBarColor(data.loadTime)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Trend */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Average Load Time Trend
            </h2>
            {historicalData.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Collecting historical data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgLoad"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Regional Comparison Chart */}
        {currentData.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Regional Comparison
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="region" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="loadTime" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Performance Tips */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mt-6">
          <h2 className="text-xl font-semibold mb-4">Performance Optimization Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">CDN Usage</h3>
              <p className="text-sm text-slate-300">Distribute content globally to reduce latency</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">Caching</h3>
              <p className="text-sm text-slate-300">Implement smart caching strategies</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-purple-400 mb-2">Compression</h3>
              <p className="text-sm text-slate-300">Enable Brotli/Gzip compression</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

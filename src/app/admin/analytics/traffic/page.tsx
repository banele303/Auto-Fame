'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Globe, ExternalLink, Users, Monitor, Smartphone,
  Tablet, Laptop, ArrowUpRight, ArrowDownRight,
  TrendingUp, Settings, AlertCircle, RefreshCw,
  LayoutGrid, Eye, Zap, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAuthSession } from "../../adminAuth";

// ─────────────────────────────── Palette / constants
const PALETTE = ['#6366f1','#22d3ee','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const DOW_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const RANGES = [
  { label: '1 Day',   value: '1d'  },
  { label: '7 Days',  value: '7d'  },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '6 Months',value: '6m'  },
  { label: '12 Months',value:'12m' },
];

// ─────────────────────────────── Types
interface TrafficPoint { name: string; views: number; visitors: number; }
interface PageRow       { path: string; views: number; uniqueVisitors: number; }
interface SourceRow     { name: string; value: number; visitors: number; }
interface DeviceRow     { name: string; count: number; pct?: number; }
interface CountryRow    { country: string; views: number; visitors: number; }
interface HourlyRow     { hour: number; dow: number; events: number; }
interface Summary       { totalVisitors: number; totalPageviews: number; activeNow: number; avgPagesPerVisit: number; }
interface AnalyticsData {
  traffic: TrafficPoint[];
  pages: PageRow[];
  sources: SourceRow[];
  devices: DeviceRow[];
  countries: CountryRow[];
  hourly: HourlyRow[];
  summary: Summary;
}

// ─────────────────────────────── Helpers
function buildHeatmap(rows: HourlyRow[]) {
  const matrix = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => ({ dow: d + 1, hour: h, events: 0 }))
  );
  for (const r of rows) {
    const d = Math.max(0, Math.min(6, r.dow - 1));
    const h = Math.max(0, Math.min(23, r.hour));
    matrix[d][h].events = r.events;
  }
  return matrix;
}

function DeviceIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes('mobile') || n.includes('phone')) return <Smartphone className={className} />;
  if (n.includes('tablet')) return <Tablet className={className} />;
  if (n.includes('laptop')) return <Laptop className={className} />;
  return <Monitor className={className} />;
}

// ─────────────────────────────── Sub-components
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800", className)} />;
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 shadow-xl text-white text-sm">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, color, pulse = false, trend, trendUp }: {
  title: string; value: string | number; description?: string;
  icon: any; color: 'indigo'|'cyan'|'amber'|'emerald'|'purple';
  pulse?: boolean; trend?: string; trendUp?: boolean;
}) {
  const bg: Record<string, string> = {
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    cyan:    'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <Card className="p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h3>
            {trend && (
              <span className={cn("text-xs font-bold flex items-center px-1.5 py-0.5 rounded-md",
                trendUp ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-500 bg-rose-50 dark:bg-rose-900/20")}>
                {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {trend}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium italic">{description}</p>
        </div>
        <div className={cn("p-4 rounded-2xl relative flex-shrink-0", bg[color])}>
          {pulse && <span className="absolute inset-0 rounded-2xl bg-current opacity-20 animate-ping" />}
          <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────── Main Page
export default function TrafficAnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async (selectedRange = range) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get Cognito auth token — required by verifyAuth on the server
      let token: string | undefined;
      try {
        const session = await fetchAuthSession();
        token = session.tokens?.idToken?.toString();
      } catch (e) {
        console.warn('Auth session unavailable:', e);
      }

      if (!token) {
        setError('You must be logged in as an Admin to view analytics.');
        return;
      }

      const res = await fetch(`/api/analytics/traffic?range=${selectedRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (json.setup_required) {
        setSetupRequired(true);
        return;
      }
      if (json.error || !res.ok) {
        setError(json.detail || json.error || `Server error ${res.status}`);
        return;
      }

      setData(json);
      setSetupRequired(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Traffic fetch error:', err);
      setError('Network error — could not reach the analytics API.');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData(range);
    const id = setInterval(() => fetchData(range), 120_000);
    return () => clearInterval(id);
  }, [range, fetchData]);

  const handleRangeChange = (r: string) => {
    setRange(r);
    fetchData(r);
  };

  // Derived data
  const trafficData  = useMemo(() => data?.traffic  ?? [], [data]);
  const sourceData   = useMemo(() => data?.sources  ?? [], [data]);
  const topPages     = useMemo(() => {
    const raw = data?.pages ?? [];
    return raw.filter(p => {
      const path = (p.path || '').toLowerCase();
      return !path.startsWith('/admin') &&
             !path.startsWith('/dashboard') &&
             !path.startsWith('/employees') &&
             !path.startsWith('/employee') &&
             !path.startsWith('/customers') &&
             !path.startsWith('/customer') &&
             !path.startsWith('/account') &&
             !path.startsWith('/user') &&
             !path.startsWith('/signin') &&
             !path.startsWith('/signup') &&
             !path.startsWith('/admin-login');
    });
  }, [data]);
  const countryData  = useMemo(() => data?.countries ?? [], [data]);

  const deviceData = useMemo(() => {
    const raw = data?.devices ?? [];
    const total = raw.reduce((s, d) => s + d.count, 0) || 1;
    return raw.map(d => ({ ...d, pct: Math.round((d.count / total) * 100) }));
  }, [data]);

  const heatmap = useMemo(() => buildHeatmap(data?.hourly ?? []), [data]);
  const maxHeat = useMemo(() => Math.max(1, ...heatmap.flat().map(c => c.events)), [heatmap]);

  // ── Setup screen
  if (setupRequired) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md p-8 rounded-3xl border-none shadow-2xl dark:bg-slate-900 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Connect PostHog API</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Add your PostHog API keys to <code>.env</code> to see live analytics.
          </p>
          <Button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12"
            onClick={() => window.open('https://us.posthog.com/settings/project-personal-api-keys', '_blank')}>
            Get API Key <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Visitor Traffic</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time insights via PostHog
            {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-400 animate-pulse">
              <Globe className="w-4 h-4 animate-spin" /> Fetching…
            </div>
          )}
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200 dark:border-slate-800 w-9 h-9"
            onClick={() => fetchData(range)} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 font-semibold"
            onClick={() => window.open('https://us.posthog.com', '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" /> Open PostHog
          </Button>
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800"
            onClick={() => router.push('/admin/analytics')}>
            Business Analytics
          </Button>
        </div>
      </div>

      {/* ── Date Range Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mr-1">
          <Calendar className="w-4 h-4" /> Range:
        </div>
        {RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => handleRangeChange(r.value)}
            disabled={isLoading}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-semibold transition-all border",
              range === r.value
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ── Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <Button size="sm" variant="ghost" className="ml-auto rounded-xl" onClick={() => fetchData(range)}>Retry</Button>
        </div>
      )}

      {/* ── Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard title="Total Visitors"  value={(data?.summary?.totalVisitors  ?? 0).toLocaleString()} icon={Users}      color="indigo"  description={`Unique visitors · ${RANGES.find(r=>r.value===range)?.label}`} />
            <StatCard title="Total Pageviews" value={(data?.summary?.totalPageviews ?? 0).toLocaleString()} icon={Eye}        color="cyan"    description={`All pageview events · ${RANGES.find(r=>r.value===range)?.label}`} />
            <StatCard title="Pages / Visit"   value={data?.summary?.avgPagesPerVisit ?? '—'}                icon={LayoutGrid} color="amber"   description="Avg pages per unique visitor" />
            <StatCard title="Active Now"       value={(data?.summary?.activeNow     ?? 0).toLocaleString()} icon={Zap}        color="emerald" description="Users in last 5 minutes" pulse />
          </>
        )}
      </div>

      {/* ── Visitor Traffic Chart + Discovery Source */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Traffic Chart */}
        <Card className="lg:col-span-2 p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visitor Traffic</h2>
              <p className="text-sm text-slate-500">Daily pageviews &amp; unique visitors</p>
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" /> Live
            </span>
          </div>
          {isLoading ? <Skeleton className="h-[300px]" /> : trafficData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
              <Globe className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No pageview data for this period yet.</p>
              <p className="text-xs text-slate-400">Browse your site to start generating traffic data.</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}  />
                    </linearGradient>
                    <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}  />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1}/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:11}} dy={8}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:11}}/>
                  <RechartTooltip content={<DarkTooltip />}/>
                  <Legend wrapperStyle={{fontSize:12,paddingTop:12}} iconType="circle"/>
                  <Area type="monotone" dataKey="views"    name="Pageviews"       stroke="#6366f1" strokeWidth={2.5} fill="url(#gV)" dot={false} activeDot={{r:5}}/>
                  <Area type="monotone" dataKey="visitors" name="Unique Visitors"  stroke="#22d3ee" strokeWidth={2.5} fill="url(#gU)" dot={false} activeDot={{r:5}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Discovery Source */}
        <Card className="p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Discovery Source</h2>
          <p className="text-sm text-slate-500 mb-4">Where visitors come from</p>
          {isLoading ? <Skeleton className="h-[240px] mb-4" /> : sourceData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Globe className="w-8 h-8 opacity-20" />
              <p className="text-sm">No source data yet</p>
            </div>
          ) : (
            <>
              <div className="h-[190px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value">
                      {sourceData.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                    </Pie>
                    <RechartTooltip content={<DarkTooltip />}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {(data?.summary?.totalPageviews ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 mt-4">
                {sourceData.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor: PALETTE[i%PALETTE.length]}}/>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-[130px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{item.visitors?.toLocaleString()}v</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Device Distribution + Top Pages */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Device */}
        <Card className="p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Device Distribution</h2>
          <p className="text-sm text-slate-500 mb-6">Breakdown by device category</p>
          {isLoading ? <Skeleton className="h-48" /> : deviceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Monitor className="w-8 h-8 opacity-40" />
              <p className="text-sm">No device data yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              {deviceData.map((device, i) => (
                <div key={device.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DeviceIcon name={device.name} className="w-4 h-4 text-slate-400"/>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{device.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{device.count.toLocaleString()}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{device.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{width:`${device.pct}%`, backgroundColor: PALETTE[i%PALETTE.length]}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Pages */}
        <Card className="p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Most Visited Pages</h2>
          <p className="text-sm text-slate-500 mb-5">Top 10 pages by views</p>
          {isLoading ? <Skeleton className="h-56" /> : topPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Globe className="w-8 h-8 opacity-40"/>
              <p className="text-sm">No page data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 font-bold">Page</th>
                    <th className="pb-3 font-bold text-right">Views</th>
                    <th className="pb-3 font-bold text-right">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topPages.map((page) => (
                    <tr key={page.path} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 pr-2">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 break-all">{page.path}</span>
                      </td>
                      <td className="py-2.5 text-right text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {page.views?.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                          {page.uniqueVisitors?.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Country Breakdown */}
      {(isLoading || countryData.length > 0) && (
        <Card className="p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Country Breakdown</h2>
          <p className="text-sm text-slate-500 mb-6">Top countries by pageviews</p>
          {isLoading ? <Skeleton className="h-48" /> : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} margin={{left:-10,right:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1}/>
                  <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:11}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8',fontSize:11}}/>
                  <RechartTooltip content={<DarkTooltip />}/>
                  <Legend wrapperStyle={{fontSize:12,paddingTop:12}} iconType="circle"/>
                  <Bar dataKey="views" name="Pageviews" radius={[6,6,0,0]}>
                    {countryData.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* ── Hourly Activity Heatmap */}
      <Card className="p-6 rounded-3xl border-none shadow-sm dark:bg-slate-900 overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Hourly Activity</h2>
        <p className="text-sm text-slate-500 mb-6">When your visitors are most active (last 7 days)</p>
        {isLoading ? <Skeleton className="h-44" /> : (
          <div className="min-w-[520px]">
            <div className="flex items-center mb-1 pl-10">
              {Array.from({length:24},(_,h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-slate-400 font-medium">
                  {h%4===0 ? `${h}h` : ''}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {heatmap.map((row, d) => (
                <div key={d} className="flex items-center gap-1">
                  <span className="w-9 text-[10px] text-slate-400 font-medium text-right flex-shrink-0">{DOW_LABELS[d]}</span>
                  <div className="flex flex-1 gap-0.5">
                    {row.map((cell, h) => {
                      const alpha = cell.events === 0 ? 0.04 : 0.1 + (cell.events/maxHeat)*0.9;
                      return (
                        <div key={h} className="flex-1 h-6 rounded-sm cursor-default hover:opacity-80 transition-opacity"
                          style={{backgroundColor:`rgba(99,102,241,${alpha})`}}
                          title={`${DOW_LABELS[d]} ${h}:00 — ${cell.events} events`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-xs text-slate-400">Less</span>
              {[0.04,0.2,0.4,0.65,0.9].map((a,i) => (
                <div key={i} className="w-4 h-4 rounded-sm" style={{backgroundColor:`rgba(99,102,241,${a})`}}/>
              ))}
              <span className="text-xs text-slate-400">More</span>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}

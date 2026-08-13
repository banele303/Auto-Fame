"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  useGetAuthUserQuery,
  useGetCarsQuery,
  useGetAllEmployeesQuery,
  useGetAllCustomersQuery,
  useGetSalesQuery,
  useGetTestDrivesQuery,
  useGetInquiriesQuery,
  useGetFinancingApplicationsQuery
} from "@/state/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, Home, Banknote, MapPin, Fuel, CheckCircle, ShoppingCart, PowerOff, ShieldCheck, Activity } from "lucide-react";


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const { data: authUser } = useGetAuthUserQuery();
  const { data: cars = [] } = useGetCarsQuery({ showAll: 'true' });
  const { data: employees = [] } = useGetAllEmployeesQuery({});
  const { data: customers = [] } = useGetAllCustomersQuery();
  const { data: sales = [] } = useGetSalesQuery({});
  const { data: testDrives = [] } = useGetTestDrivesQuery();
  const { data: inquiries = [] } = useGetInquiriesQuery({});
  const { data: financingApps = [] } = useGetFinancingApplicationsQuery({});
  const router = useRouter();

  
  // Car by type distribution (using carType / condition fallback)
  const carData = useMemo(() => {
    const counts: Record<string, number> = {};
    cars.forEach(c => {
      const key = (c as any).carType || c.condition || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count).slice(0,8);
  }, [cars]);

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const key = c.city || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name,count])=>({name, count})).sort((a,b)=>b.count-a.count).slice(0,10);
  }, [customers]);

  const priceRangeData = useMemo(() => {
    const ranges: { name: string; min: number; max: number | null; count: number }[] = [
      { name: 'R0-R100k', min: 0, max: 100000, count: 0 },
      { name: 'R100k-R200k', min: 100000, max: 200000, count: 0 },
      { name: 'R200k-R300k', min: 200000, max: 300000, count: 0 },
      { name: 'R300k-R400k', min: 300000, max: 400000, count: 0 },
      { name: 'R400k-R500k', min: 400000, max: 500000, count: 0 },
      { name: 'R500k+', min: 500000, max: null, count: 0 },
    ];
    cars.forEach(c => {
      const price = c.price;
      const bucket = ranges.find(r => price >= r.min && (r.max === null || price < r.max));
      if (bucket) bucket.count += 1;
    });
    return ranges.map(r => ({ name: r.name, count: r.count }));
  }, [cars]);

  const employeeActivityData = useMemo(() => {
    const map: Record<string, { name: string; sales: number; inquiries: number; testDrives: number }> = {};
    employees.forEach(e => { map[e.cognitoId] = { name: e.name, sales: 0, inquiries: 0, testDrives: 0 }; });
    sales.forEach(s => { if (map[s.employeeId]) map[s.employeeId].sales += 1; });
    inquiries.forEach(i => { if (i.employeeId && map[i.employeeId]) map[i.employeeId].inquiries += 1; });
    testDrives.forEach(t => { if (t.employeeId && map[t.employeeId]) map[t.employeeId].testDrives += 1; });
    return Object.values(map).sort((a,b)=>b.sales-a.sales).slice(0,10);
  }, [employees, sales, inquiries, testDrives]);

  const customerActivityData = useMemo(() => {
    // Last 6 calendar months including current
    const now = new Date();
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleString('default', { month: 'short' }));
    }
    const init = monthLabels.map(m => ({ month: m, inquiries: 0, testDrives: 0, purchases: 0 }));
    const monthIndex = (date: Date) => new Date(date).toLocaleString('default', { month: 'short' });
    inquiries.forEach(q => {
      const m = monthIndex(q.inquiryDate as any);
      const bucket = init.find(b => b.month === m); if (bucket) bucket.inquiries += 1;
    });
    testDrives.forEach(td => {
      const m = monthIndex(td.scheduledDate as any);
      const bucket = init.find(b => b.month === m); if (bucket) bucket.testDrives += 1;
    });
    sales.forEach(s => {
      const m = monthIndex(s.saleDate as any);
      const bucket = init.find(b => b.month === m); if (bucket) bucket.purchases += 1;
    });
    return init;
  }, [inquiries, testDrives, sales]);

  

  
  const totalCars = cars.length;
  const totalEmployees = employees.length;
  const totalCustomers = customers.length;
  const totalSalesCount = sales.length;

  const statusMetrics = useMemo(() => {
    const counts = { AVAILABLE: 0, SOLD: 0, INACTIVE: 0, RESERVED: 0, MAINTENANCE: 0 };
    cars.forEach(c => {
      const s = c.status as keyof typeof counts;
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [cars]);

  const totalRevenue = useMemo(() => {
    return sales.reduce((acc, s) => acc + (s.salePrice || 0), 0);
  }, [sales]);

  const carStatusPieData = useMemo(() => {
    return Object.entries(statusMetrics)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [statusMetrics]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      
      {/* Top Level Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Inventory</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalCars}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Vehicles in system</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Available</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{statusMetrics.AVAILABLE}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Ready for sale</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Sold Units</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{statusMetrics.SOLD}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Total turnover</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl">
              <ShoppingCart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Inactive</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{statusMetrics.INACTIVE + statusMetrics.MAINTENANCE}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Internal / Hidden</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <PowerOff className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Financial & Operational Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#00A211] uppercase tracking-widest mb-1">Gross Revenue</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-[#00A211]/10 rounded-2xl">
              <Banknote className="w-6 h-6 text-[#00A211]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalSalesCount}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customers</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalCustomers}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm hover:shadow-md transition-all rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lead Count</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{inquiries.length}</h3>
            </div>
            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl">
              <Activity className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
        </Card>
      </div>

      
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cars">Car Analytics</TabsTrigger>
          <TabsTrigger value="employees">Employee Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
        </TabsList>
        
        
        <TabsContent value="cars" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Car Types</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {carData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Car Locations</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Cars" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Price Ranges</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priceRangeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Cars" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carStatusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {carStatusPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'AVAILABLE' ? '#00A211' :
                            entry.name === 'SOLD' ? '#ff5533' :
                            entry.name === 'INACTIVE' ? '#99aab5' :
                            COLORS[index % COLORS.length]
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        
        <TabsContent value="employees" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Employees by Sales</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeeActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Employees by Inquiries</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeeActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inquiries" fill="#82ca9d" name="Inquiries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Employees by Test Drives</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeeActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="testDrives" fill="#ffc658" name="Test Drives" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Employee Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: 20 },
                        { name: 'Inactive', value: 3 },
                        { name: 'Suspended', value: 2 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#82ca9d" />
                      <Cell fill="#ffc658" />
                      <Cell fill="#8884d8" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        
        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            <Card className="p-4 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Customer Activity Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={customerActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inquiries" fill="#8884d8" name="Inquiries" />
                    <Bar dataKey="testDrives" fill="#82ca9d" name="Test Drives" />
                    <Bar dataKey="purchases" fill="#ffc658" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Customer Preferences - Car Types</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Sedan', value: 45 },
                        { name: 'SUV', value: 30 },
                        { name: 'Truck', value: 15 },
                        { name: 'Hatchback', value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Customer Preferences - Price Range</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'R0-R100k', value: 10 },
                        { name: 'R100k-R200k', value: 35 },
                        { name: 'R200k-R300k', value: 40 },
                        { name: 'R300k+', value: 15 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

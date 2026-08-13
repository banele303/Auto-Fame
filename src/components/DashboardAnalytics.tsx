"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Car, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Eye,
  Phone,
  CreditCard,
  Award,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";

interface DashboardAnalyticsProps {
  userRole?: string;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ userRole = "admin" }) => {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<{ month:string; sales:number; revenue:number }[]>([]);
  const [inventoryData, setInventoryData] = useState<{ category:string; count:number; color:string }[]>([]);
  const [inquiryData, setInquiryData] = useState<{ day:string; inquiries:number; testDrives:number }[]>([]);
  const [topPerformers, setTopPerformers] = useState<{ name:string; sales:number; revenue:number }[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/analytics/summary');
        if (!res.ok) throw new Error('Failed to fetch analytics summary');
        const data = await res.json();
        setStats(data.stats);
        setSalesData(data.salesTrend);
        setInventoryData(data.inventoryDistribution);
        setInquiryData(data.weeklyActivity);
        setTopPerformers(data.topPerformers);
      } catch (e:any) {
        setError(e.message || 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `R${(value/1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `R${(value/1_000).toFixed(1)}k`;
    return `R${value.toFixed(0)}`;
  };

  const statsCards = stats ? [
    { title: 'Total Cars', value: stats.totalCars.toString(), change: '', changeType: 'positive' as const, icon: Car, color:'text-blue-600', bgColor:'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Monthly Sales', value: stats.monthlySales.toString(), change: '', changeType: 'positive' as const, icon: TrendingUp, color:'text-green-600', bgColor:'bg-green-50 dark:bg-green-900/20' },
    { title: 'Revenue (This Month)', value: formatCurrency(stats.monthlyRevenue), change: '', changeType: 'positive' as const, icon: DollarSign, color:'text-emerald-600', bgColor:'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Active Customers', value: stats.activeCustomers.toString(), change: '', changeType: 'positive' as const, icon: Users, color:'text-purple-600', bgColor:'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'Test Drives (Week)', value: stats.weekTestDrives.toString(), change: '', changeType: 'positive' as const, icon: Calendar, color:'text-orange-600', bgColor:'bg-orange-50 dark:bg-orange-900/20' },
    { title: 'Inquiries (Week)', value: stats.weekInquiries.toString(), change: '', changeType: 'positive' as const, icon: Phone, color:'text-cyan-600', bgColor:'bg-cyan-50 dark:bg-cyan-900/20' },
    { title: 'Financing Apps', value: stats.financingApplications.toString(), change: '', changeType: 'positive' as const, icon: CreditCard, color:'text-indigo-600', bgColor:'bg-indigo-50 dark:bg-indigo-900/20' },
    { title: 'Customer Rating', value: `${stats.avgRating}/5`, change: '', changeType: 'positive' as const, icon: Award, color:'text-yellow-600', bgColor:'bg-yellow-50 dark:bg-yellow-900/20' },
  ] : [];

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here&apos;s what&apos;s happening at your dealership.
        </p>
      </div>

      
      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && statsCards.length === 0 && Array.from({length:8}).map((_,i)=>(
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-32 flex flex-col justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
            </CardContent>
          </Card>
        ))}
        {!loading && statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className={`text-sm ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {stat.change && `${stat.change} from last period`}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-[#00acee]" />
                Sales & Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#00acee"
                    fill="#00acee"
                    fillOpacity={0.3}
                  />
                  <Bar yAxisId="left" dataKey="sales" fill="#0099d4" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-[#00acee]" />
                Inventory Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, count }) => `${category}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-[#00acee]" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inquiryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="inquiries" fill="#00acee" name="Inquiries" />
                  <Bar dataKey="testDrives" fill="#0099d4" name="Test Drives" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-[#00acee]" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
    {topPerformers.map((performer, index) => (
                  <div key={performer.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {performer.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {performer.sales} sales
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#00acee]">
      {performer.revenue >= 1_000_000 ? `R${(performer.revenue/1_000_000).toFixed(2)}M` : `R${(performer.revenue/1000).toFixed(0)}k`}
                      </p>
                      <Progress 
                        value={(performer.sales / 15) * 100} 
                        className="w-16 h-2 mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;

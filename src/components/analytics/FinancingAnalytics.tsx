"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Legend,
  Line,
  LineChart,
} from 'recharts';

type FinancingData = {
  monthly: { month: string; applications: number; approved: number; rejected: number }[];
  byLoanRange: { loanRange: string; count: number; percentage: number }[];
  byAgeGroup: { ageGroup: string; count: number; percentage: number }[];
  approvalRateTimeline: { month: string; approvalRate: number }[];
  summary?: { total:number; approved:number; rejected:number; pending:number; approvalRate:number };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function FinancingAnalytics() {
  const [data, setData] = useState<FinancingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monthly');

  useEffect(() => {
    const fetchFinancingAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/financing/analytics');
        if (!res.ok) throw new Error('Failed to fetch financing analytics');
        
  const analyticsData = await res.json();
  setData(analyticsData);
      } catch (error) {
        console.error('Error fetching financing analytics:', error);
  setData({ monthly: [], byLoanRange: [], byAgeGroup: [], approvalRateTimeline: [], summary: { total:0, approved:0, rejected:0, pending:0, approvalRate:0 }});
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancingAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-semibold">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="monthly" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="monthly">Monthly Applications</TabsTrigger>
          <TabsTrigger value="loanRange">Loan Amount Ranges</TabsTrigger>
          <TabsTrigger value="age">Age Groups</TabsTrigger>
          <TabsTrigger value="approval">Approval Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financing Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.monthly}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="applications" name="Total Applications" fill="#8884d8" />
                    <Bar dataKey="approved" name="Approved" fill="#82ca9d" />
                    <Bar dataKey="rejected" name="Rejected" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

  <TabsContent value="loanRange">
          <Card>
            <CardHeader>
        <CardTitle>Applications by Loan Amount Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
          data={data?.byLoanRange}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
          dataKey="count"
          nameKey="loanRange"
                    >
          {data?.byLoanRange.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age">
          <Card>
            <CardHeader>
              <CardTitle>Applications by Age Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.byAgeGroup}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="ageGroup"
                    >
                      {data?.byAgeGroup.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle>Approval Rate Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data?.approvalRateTimeline}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Approval Rate']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="approvalRate"
                      name="Approval Rate"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import FinancingAnalytics from '@/components/analytics/FinancingAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import Link from 'next/link';

export default function FinancingAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6months');
  const [summary, setSummary] = useState<{approvalRate:number; averageLoanAmount:number; averageProcessingDays:number;} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/financing/analytics');
        if(res.ok){
          const j = await res.json();
          setSummary({
            approvalRate: j.summary?.approvalRate ?? 0,
            averageLoanAmount: j.summary?.averageLoanAmount ?? 0,
            averageProcessingDays: j.summary?.averageProcessingDays ?? 0,
          });
        }
      } catch(e){
        // silent fallback
      } finally { setLoading(false); }
    };
    load();
  },[]);
  
  const handleExportData = () => {
    // In a real implementation, this would generate and download a CSV or PDF report
    alert('Export feature would be implemented here');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/admin/financing/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Financing Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financing Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Detailed analysis of financing applications and approval trends
          </p>
        </div>
        
        <div className="flex mt-4 sm:mt-0 space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : `${summary?.approvalRate ?? 0}%`}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Live (last 6 months)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Loan Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : `R${(summary?.averageLoanAmount||0).toLocaleString()}`}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Across retrieved period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : `${summary?.averageProcessingDays ?? 0} days`}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Approved / rejected only</p>
          </CardContent>
        </Card>
      </div>
      
      <FinancingAnalytics />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Reasons for Rejection</CardTitle>
            <CardDescription>Common reasons for financing application rejections</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                  <span>Insufficient credit score</span>
                </div>
                <span className="font-semibold">42%</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                  <span>Debt-to-income ratio too high</span>
                </div>
                <span className="font-semibold">28%</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  <span>Incomplete documentation</span>
                </div>
                <span className="font-semibold">18%</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  <span>Employment history concerns</span>
                </div>
                <span className="font-semibold">8%</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
                  <span>Other reasons</span>
                </div>
                <span className="font-semibold">4%</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}

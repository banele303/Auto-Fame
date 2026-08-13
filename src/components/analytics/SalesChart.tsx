"use client";
import { useState, useEffect } from "react";
import { Chart } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Date utility functions
const getMonthsAgo = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

// Format month/year for display
const formatMonthYear = (date: Date) => {
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
};

const SalesChart = () => {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState('line');
  const [timePeriod, setTimePeriod] = useState('6m');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isDarkTheme = theme === "dark";
  
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      try {
        // Get months range based on selected time period
        const monthsAgo = timePeriod === '3m' ? 3 : 
                         timePeriod === '6m' ? 6 : 
                         timePeriod === '1y' ? 12 : 24;
                         
        const response = await fetch(`/api/analytics/sales?months=${monthsAgo}`);
        if (!response.ok) throw new Error('Failed to fetch sales data');
        
        const data = await response.json();
        setSalesData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        // If error fetching data, set to empty array
        setSalesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSalesData();
  }, [timePeriod]);
  
  // Generate labels (months) for the chart based on time period
  const generateLabels = () => {
    const months = timePeriod === '3m' ? 3 : 
                  timePeriod === '6m' ? 6 : 
                  timePeriod === '1y' ? 12 : 24;
    
    const labels = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      labels.push(formatMonthYear(date));
    }
    
    return labels;
  };
  
  // Process data for chart based on actual data from API
  const processChartData = () => {
    const labels = generateLabels();
    
    // Initialize arrays for sales and revenue data
    const salesByMonth = Array(labels.length).fill(0);
    const revenueByMonth = Array(labels.length).fill(0);
    
    // Map actual sales data to the appropriate months
    salesData.forEach(sale => {
      const saleDate = new Date(sale.saleDate);
      const monthYearStr = formatMonthYear(saleDate);
      const index = labels.indexOf(monthYearStr);
      
      if (index !== -1) {
        salesByMonth[index]++;
        revenueByMonth[index] += sale.salePrice || 0;
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: chartType === 'line' ? 'Sales' : 'Monthly Sales',
          data: salesByMonth,
          borderColor: '#00A211',
          backgroundColor: isDarkTheme ? 'rgba(0, 162, 17, 0.1)' : 'rgba(0, 162, 17, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: chartType === 'line',
        },
        {
          label: 'Revenue (R)',
          data: revenueByMonth,
          borderColor: isDarkTheme ? '#ffa500' : '#ff8c00',
          backgroundColor: isDarkTheme ? 'rgba(255, 165, 0, 0.1)' : 'rgba(255, 140, 0, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: chartType === 'line',
          hidden: false,
          yAxisID: 'y1',
        }
      ]
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkTheme ? '#e5e7eb' : '#1f2937',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDarkTheme ? '#374151' : '#ffffff',
        titleColor: isDarkTheme ? '#e5e7eb' : '#1f2937',
        bodyColor: isDarkTheme ? '#e5e7eb' : '#1f2937',
        borderColor: isDarkTheme ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: isDarkTheme ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: isDarkTheme ? '#9ca3af' : '#4b5563',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkTheme ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: isDarkTheme ? '#9ca3af' : '#4b5563',
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkTheme ? '#ffa500' : '#ff8c00',
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 md:mb-0">
          Sales Performance
        </h3>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="flex space-x-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                chartType === 'line'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                chartType === 'bar'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Bar
            </button>
          </div>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none focus:ring-2 focus:ring-green-500"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
            <option value="2y">Last 2 years</option>
          </select>
        </div>
      </div>
      <div className="h-80">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : salesData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No sales data available for this period.</p>
          </div>
        ) : (
          chartType === 'line' ? (
            <Chart type="line" data={processChartData()} options={chartOptions} />
          ) : (
            <Chart type="bar" data={processChartData()} options={chartOptions} />
          )
        )}
      </div>
    </div>
  );
};

export default SalesChart;

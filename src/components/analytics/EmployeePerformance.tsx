"use client";
import { useState, useEffect } from "react";

const EmployeePerformance = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState("month"); // month, quarter, year
  
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/analytics/employees?timeFrame=${timeFrame}`);
        if (!response.ok) throw new Error('Failed to fetch employee data');
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employee performance data:', error);
        // Set empty array if there's an error
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [timeFrame]);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 md:mb-0">
          Employee Performance
        </h3>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none focus:ring-2 focus:ring-green-500"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : employees.length === 0 ? (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">No employee data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sales</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Deal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {employee.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{employee.sales}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">R{employee.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      R{(employee.revenue / (employee.sales || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{employee.customers}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformance;

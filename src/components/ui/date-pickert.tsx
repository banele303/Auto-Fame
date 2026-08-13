

import React from 'react';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 

interface DatePickerProps {
  label?: string;
  date: Date | null | undefined;
  onDateChange: (date: Date | null) => void;
  disabled?: boolean;
}

export const DatePickert: React.FC<DatePickerProps> = ({ label, date, onDateChange, disabled }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      
      
      
      const [year, month, day] = value.split('-').map(Number);
      
      const selectedDate = new Date(Date.UTC(year, month - 1, day));
      onDateChange(selectedDate);
    } else {
      onDateChange(null);
    }
  };

  const formatDateForInput = (d: Date | null | undefined): string => {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return ""; 
    
    try {
        
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error formatting date:", d, e);
        return ""; 
    }
  };


  return (
    <div className="space-y-1 w-full">
      {label && <Label htmlFor={`date-picker-${label}`}>{label}</Label>}
      <Input
        id={`date-picker-${label}`}
        type="date"
        value={formatDateForInput(date)}
        onChange={handleChange}
        disabled={disabled}
        className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
      />
    </div>
  );
};




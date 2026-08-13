"use client";
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FinancingApplicationForm_MinDebug(){
  const [v,setV]=React.useState('');
  const ref=React.useRef<HTMLInputElement|null>(null);
  return (
    <div className='space-y-4 p-4 border rounded-md'>
      <div>
        <Label htmlFor='dbg1'>Debug Field</Label>
        <Input id='dbg1' value={v} onChange={(e)=>setV(e.target.value)} placeholder='Type here, should NOT lose focus' ref={ref} />
      </div>
      <pre className='text-xs bg-slate-50 p-2 rounded'>value: {v}</pre>
    </div>
  );
}

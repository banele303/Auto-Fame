"use client";
import React from 'react';
import FinancingApplicationForm_MinDebug from '@/components/forms/FinancingApplicationForm_MinDebug';
export default function DebugFocusPage(){
  return (
    <div className='max-w-xl mx-auto py-16'>
      <h1 className='text-2xl font-bold mb-6'>Focus Debug</h1>
      <FinancingApplicationForm_MinDebug />
      <p className='mt-6 text-sm text-slate-500'>If this field works but main form drops focus, the issue is inside large form logic. If this also loses focus, a global listener or provider is stealing focus.</p>
    </div>
  );
}
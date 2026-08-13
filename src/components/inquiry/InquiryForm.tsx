"use client";
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface InquiryFormProps {
  carId?: number | string;
  compact?: boolean; // compact styling for modal / inline usage
  onSuccess?: () => void;
  defaultSubject?: string;
  className?: string;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({ carId, compact, onSuccess, defaultSubject, className }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: defaultSubject || '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload: any = { ...form };
      if (carId) payload.carId = carId;
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let msg = 'Failed to send message';
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      toast.success('Message sent');
      setSent(true);
      onSuccess?.();
    } catch (err:any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className={`rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 text-center ${className || ''}`}> 
        <p className="text-green-700 dark:text-green-300 font-medium mb-2">Message Sent!</p>
        <p className="text-sm text-green-600 dark:text-green-400">We will contact you soon.</p>
        <Button variant="outline" className="mt-4" onClick={() => { setSent(false); setForm(f=>({...f, message:''})); }}>Send Another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className || ''}`}> 
      <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <label htmlFor="inq_name" className="text-xs font-medium text-slate-600 dark:text-slate-300">Full Name</label>
          <Input id="inq_name" name="name" value={form.name} onChange={onChange} required placeholder="John Doe" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="inq_email" className="text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
          <Input id="inq_email" type="email" name="email" value={form.email} onChange={onChange} required placeholder="john@example.com" />
        </div>
        {!compact && (
          <div className="space-y-1.5">
            <label htmlFor="inq_phone" className="text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
            <Input id="inq_phone" name="phone" value={form.phone} onChange={onChange} placeholder="+27 ..." />
          </div>
        )}
        {!compact && (
          <div className="space-y-1.5">
            <label htmlFor="inq_subject" className="text-xs font-medium text-slate-600 dark:text-slate-300">Subject</label>
            <Input id="inq_subject" name="subject" value={form.subject} onChange={onChange} required placeholder="Inquiry about vehicle" />
          </div>
        )}
      </div>
      {compact && (
        <div className="space-y-1.5">
          <label htmlFor="inq_subject_c" className="text-xs font-medium text-slate-600 dark:text-slate-300">Subject</label>
          <Input id="inq_subject_c" name="subject" value={form.subject} onChange={onChange} required placeholder="Inquiry about vehicle" />
        </div>
      )}
      {compact && (
        <div className="space-y-1.5">
          <label htmlFor="inq_phone_c" className="text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
          <Input id="inq_phone_c" name="phone" value={form.phone} onChange={onChange} placeholder="+27 ..." />
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="inq_message" className="text-xs font-medium text-slate-600 dark:text-slate-300">Message</label>
        <textarea id="inq_message" name="message" value={form.message} onChange={onChange} required rows={compact ? 4 : 6} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please provide details..." />
      </div>
      <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">{submitting ? 'Sending...' : (<><Send className="h-4 w-4" /> <span>Send Message</span></>)}</Button>
    </form>
  );
};

export default InquiryForm;

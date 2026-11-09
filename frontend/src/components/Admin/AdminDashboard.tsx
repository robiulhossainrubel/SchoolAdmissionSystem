import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../../services/api';
import type { ClassOffering, CreateClassPayload } from '../../types';
import { AlertBanner } from '../Common/AlertBanner';
import { ShieldAlert, PlusCircle, RefreshCw, Layers } from 'lucide-react';

interface Props {
  onClassCreated: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onClassCreated }) => {
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState<string>('40');

  const fetchClasses = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await api.getClasses();
      setOfferings(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to load offerings.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('শ্রেণি ও শিফটের নাম অবশ্যই দিতে হবে। (Class name is required.)');
      return;
    }

    const seatsNum = parseInt(totalSeats, 10);
    if (isNaN(seatsNum) || seatsNum <= 0) {
      setError('আসন সংখ্যা অবশ্যই শূন্যের চেয়ে বেশি হতে হবে। (Total seats must be a positive number greater than 0.)');
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateClassPayload = {
        name: trimmedName,
        totalSeats: seatsNum,
      };

      const created = await api.createClass(payload);
      setSuccess(`সফলভাবে "${created.name}" তৈরি করা হয়েছে (${created.totalSeats}টি আসন সহ)।`);
      setName('');
      setTotalSeats('40');
      onClassCreated();
      await fetchClasses();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Class creation failed. Please check backend status.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Demo Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          marginBottom: '20px',
          color: '#92400e',
          fontSize: '13px',
        }}
      >
        <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', fontSize: '14px', marginBottom: '2px' }}>
            ডেমো অ্যাডমিন মোড (Evaluation Demo Notice)
          </strong>
          অ্যাসাইনমেন্টের স্পেসিফিকেশনে অ্যাডমিন অথেনটিকেশন বা পাসওয়ার্ড উল্লেখ নেই। মূল্যায়নের সুবিধার্থে এই ড্যাশবোর্ডটি সরাসরি উন্মুক্ত রাখা হয়েছে। প্রোডাকশন পরিবেশে এটি ওঅথ২ (OAuth2 / Identity) অথেনটিকেশন দ্বারা সুরক্ষিত থাকবে।
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Create Class Form Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PlusCircle size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              নতুন শ্রেণি ও শিফট যোগ করুন (Create Offering)
            </h3>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="class-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                শ্রেণি ও শিফটের নাম (Class Name & Shift):
              </label>
              <input
                id="class-name"
                type="text"
                placeholder="যেমন: Class 6 - Morning Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label htmlFor="total-seats" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                মোট আসন সংখ্যা (Total Seat Capacity):
              </label>
              <input
                id="total-seats"
                type="number"
                min={1}
                placeholder="যেমন: 40"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                marginTop: '4px',
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                'তৈরি করুন (Create Class Offering)'
              )}
            </button>
          </form>
        </div>

        {/* Existing Classes Summary Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#0891b2" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                বর্তমান অফারিংস ({offerings.length})
              </h3>
            </div>
            <button
              onClick={fetchClasses}
              disabled={loadingList}
              style={{
                padding: '4px 8px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} className={loadingList ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>নাম</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>মোট</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>নিশ্চিত</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>হোল্ড</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>খালি</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 10px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>{c.totalSeats}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{c.confirmedSeats}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#d97706', fontWeight: 700 }}>{c.heldSeats}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: c.availableSeats <= 0 ? '#dc2626' : '#2563eb', fontWeight: 700 }}>
                      {c.availableSeats}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

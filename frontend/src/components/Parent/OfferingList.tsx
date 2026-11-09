import React, { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../../services/api';
import type { ClassOffering } from '../../types';
import { useStudent } from '../../context/StudentContext';
import { AlertBanner } from '../Common/AlertBanner';
import { RefreshCw, Users } from 'lucide-react';

interface Props {
  refreshTrigger: number;
  onHoldCreated: () => void;
}

export const OfferingList: React.FC<Props> = ({ refreshTrigger, onHoldCreated }) => {
  const { studentId, isValidStudentId, setActiveHold } = useStudent();
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [submittingClassId, setSubmittingClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());

  const fetchOfferings = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setPolling(true);

    try {
      const data = await api.getClasses();
      setOfferings(data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: unknown) {
      if (!isBackground) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load class offerings.');
      }
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, []);

  // Initial fetch and on trigger change
  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings, refreshTrigger]);

  // Periodic Polling every 4 seconds without page reload (Assignment §1.5)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOfferings(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchOfferings]);

  const handleApply = async (offering: ClassOffering) => {
    if (!isValidStudentId) {
      setError('আবেদন করার আগে উপরে শিক্ষার্থীর সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন। (Please enter a valid 17-digit student ID above before applying.)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmittingClassId(offering.id);
    setError(null);

    try {
      const hold = await api.createHold(offering.id, studentId);
      setActiveHold({
        ...hold,
        className: offering.name,
      });
      onHoldCreated();
      // Instantly refresh list counters
      await fetchOfferings(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('আবেদন প্রক্রিয়া ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন। (Application failed. Please try again.)');
      }
    } finally {
      setSubmittingClassId(null);
    }
  };

  return (
    <div>
      {/* Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            ভর্তিযোগ্য শ্রেণি ও শিফট তালিকা (Available Offerings)
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            আগে আবেদন করলে আগে পাবেন (First-Come, First-Served) • স্বয়ংক্রিয় লাইভ আপডেট
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} className={polling ? 'animate-spin' : ''} />
            {lastRefreshed.toLocaleTimeString()} এ আপডেট হয়েছে
          </span>
          <button
            onClick={() => fetchOfferings(false)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            রিফ্রেশ
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && offerings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>শ্রেণি ও আসন তালিকা লোড হচ্ছে...</p>
        </div>
      ) : offerings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <Users size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, color: '#334155' }}>কোনো শ্রেণি বা শিফট পাওয়া যায়নি</h3>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            School Admin ট্যাব থেকে নতুন শ্রেণি ও শিফট যোগ করুন।
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {offerings.map((offering) => {
            const isSoldOut = offering.availableSeats <= 0;
            const isApplying = submittingClassId === offering.id;
            const fillPercentage = offering.totalSeats > 0 
              ? Math.min(100, Math.round(((offering.confirmedSeats + offering.heldSeats) / offering.totalSeats) * 100))
              : 0;

            return (
              <div
                key={offering.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: `1px solid ${isSoldOut ? '#e2e8f0' : '#cbd5e1'}`,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  opacity: isSoldOut ? 0.9 : 1,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      {offering.name}
                    </h3>
                    {isSoldOut ? (
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        SOLD OUT / আসন শেষ
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                        আসন খালি আছে
                      </span>
                    )}
                  </div>

                  {/* Seat Numbers Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '14px 0', textAlign: 'center' }}>
                    <div style={{ padding: '8px 4px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>মোট</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>{offering.totalSeats}</strong>
                    </div>

                    <div style={{ padding: '8px 4px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#166534', fontWeight: 600 }}>নিশ্চিত</span>
                      <strong style={{ fontSize: '16px', color: '#15803d' }}>{offering.confirmedSeats}</strong>
                    </div>

                    <div style={{ padding: '8px 4px', backgroundColor: '#fefce8', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#854d0e', fontWeight: 600 }}>হোল্ড</span>
                      <strong style={{ fontSize: '16px', color: '#a16207' }}>{offering.heldSeats}</strong>
                    </div>

                    <div style={{ padding: '8px 4px', backgroundColor: isSoldOut ? '#fee2e2' : '#eff6ff', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: isSoldOut ? '#991b1b' : '#1d4ed8', fontWeight: 600 }}>খালি</span>
                      <strong style={{ fontSize: '16px', color: isSoldOut ? '#b91c1c' : '#2563eb' }}>{offering.availableSeats}</strong>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                      <span>আসন পূর্ণতা</span>
                      <span>{fillPercentage}%</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          width: `${(offering.confirmedSeats / offering.totalSeats) * 100}%`,
                          backgroundColor: '#16a34a',
                          transition: 'width 0.3s',
                        }}
                        title={`Confirmed: ${offering.confirmedSeats}`}
                      />
                      <div
                        style={{
                          width: `${(offering.heldSeats / offering.totalSeats) * 100}%`,
                          backgroundColor: '#eab308',
                          transition: 'width 0.3s',
                        }}
                        title={`Held: ${offering.heldSeats}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => handleApply(offering)}
                  disabled={isSoldOut || isApplying}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSoldOut ? '#cbd5e1' : '#2563eb',
                    color: isSoldOut ? '#64748b' : '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isSoldOut || isApplying ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s',
                    boxShadow: isSoldOut ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  {isApplying ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      আসন সংরক্ষণ করা হচ্ছে...
                    </>
                  ) : isSoldOut ? (
                    'আসন খালি নেই (Sold Out)'
                  ) : (
                    'আবেদন করুন (Apply for Seat)'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

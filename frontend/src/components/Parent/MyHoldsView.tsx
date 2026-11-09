import React, { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../../services/api';
import type { StudentHold } from '../../types';
import { useStudent } from '../../context/StudentContext';
import { StatusBadge } from '../Common/StatusBadge';
import { AlertBanner } from '../Common/AlertBanner';
import { RefreshCw, FileText, ExternalLink, Calendar, AlertCircle } from 'lucide-react';

interface Props {
  refreshTrigger: number;
  onOpenHoldModal: () => void;
}

export const MyHoldsView: React.FC<Props> = ({ refreshTrigger, onOpenHoldModal }) => {
  const { studentId, isValidStudentId, setActiveHold } = useStudent();
  const [holds, setHolds] = useState<StudentHold[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyHolds = useCallback(async () => {
    if (!isValidStudentId) {
      setHolds([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getMyHolds(studentId);
      setHolds(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('আবেদনের তালিকা লোড করতে সমস্যা হয়েছে। (Failed to load applications.)');
      }
    } finally {
      setLoading(false);
    }
  }, [studentId, isValidStudentId]);

  useEffect(() => {
    fetchMyHolds();
  }, [fetchMyHolds, refreshTrigger]);

  const handleSelectHold = (hold: StudentHold) => {
    setActiveHold({
      holdId: hold.holdId,
      classId: hold.classId,
      className: hold.className,
      studentId: studentId,
      status: hold.status,
      expiresAt: hold.expiresAt,
    });
    onOpenHoldModal();
  };

  if (!isValidStudentId) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
        <AlertCircle size={40} style={{ color: '#d97706', margin: '0 auto 12px' }} />
        <h3 style={{ margin: 0, color: '#92400e' }}>শিক্ষার্থীর জন্ম নিবন্ধন নম্বর প্রয়োজন</h3>
        <p style={{ margin: '8px 0 0', color: '#b45309', fontSize: '14px' }}>
          আপনার আবেদনসমূহ দেখার জন্য উপরে ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর লিখুন।
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            আমার আবেদনসমূহ (My Applications)
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            শিক্ষার্থী আইডি: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{studentId}</strong>
          </span>
        </div>

        <button
          onClick={fetchMyHolds}
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          রিফ্রেশ করুন
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && holds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>আবেদন তথ্য লোড হচ্ছে...</p>
        </div>
      ) : holds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FileText size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, color: '#334155' }}>এই শিক্ষার্থীর কোনো আবেদন পাওয়া যায়নি</h3>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            আসন তালিকা থেকে আপনার পছন্দের শ্রেণি ও শিফটে আবেদন করুন।
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 16px' }}>শ্রেণি ও শিফট</th>
                  <th style={{ padding: '14px 16px' }}>বর্তমান অবস্থা</th>
                  <th style={{ padding: '14px 16px' }}>মেয়াদ (Expires At)</th>
                  <th style={{ padding: '14px 16px' }}>সংরক্ষণ আইডি</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody>
                {holds.map((hold) => {
                  const expiryDate = new Date(hold.expiresAt);
                  const isExpired = hold.status === 'EXPIRED' || (hold.status === 'HELD' && expiryDate.getTime() <= Date.now());

                  return (
                    <tr
                      key={hold.holdId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {hold.className}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={isExpired && hold.status === 'HELD' ? 'EXPIRED' : hold.status} size="sm" />
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} />
                          {expiryDate.toLocaleTimeString()} ({expiryDate.toLocaleDateString()})
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                        {hold.holdId.slice(0, 8)}...
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleSelectHold(hold)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ExternalLink size={12} />
                          বিস্তারিত দেখুন
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

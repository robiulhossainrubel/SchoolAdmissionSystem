import React, { useState } from 'react';
import { useStudent } from '../../context/StudentContext';
import { api, ApiError } from '../../services/api';
import { CountdownTimer } from '../Common/CountdownTimer';
import { StatusBadge } from '../Common/StatusBadge';
import { AlertBanner } from '../Common/AlertBanner';
import { CreditCard, Trash2, CheckCircle2, X } from 'lucide-react';

interface Props {
  onHoldUpdated: () => void;
}

export const HoldModal: React.FC<Props> = ({ onHoldUpdated }) => {
  const { activeHold, setActiveHold, studentId } = useStudent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isClientExpired, setIsClientExpired] = useState(false);

  if (!activeHold) return null;

  const isConfirmed = activeHold.status === 'CONFIRMED';
  const isCancelled = activeHold.status === 'CANCELLED';
  const isExpired = activeHold.status === 'EXPIRED' || isClientExpired;
  const isHeld = activeHold.status === 'HELD' && !isExpired;

  const handleExpire = () => {
    setIsClientExpired(true);
    setActiveHold({
      ...activeHold,
      status: 'EXPIRED',
    });
    onHoldUpdated();
  };

  const handleConfirm = async () => {
    if (!studentId || !activeHold) return;
    setLoading(true);
    setError(null);

    try {
      const result = await api.confirmHold(activeHold.holdId, studentId);
      setActiveHold({
        ...activeHold,
        status: result.status as any,
      });
      setSuccess('ভর্তি ফি সফলভাবে জমা হয়েছে! ভর্তি নিশ্চিত করা হলো। (Admission confirmed successfully!)');
      onHoldUpdated();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Confirmation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!studentId || !activeHold) return;
    if (!confirm('আপনি কি এই আবেদনটি বাতিল করতে চান? (Are you sure you want to cancel this hold?)')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.cancelHold(activeHold.holdId, studentId);
      setActiveHold({
        ...activeHold,
        status: 'CANCELLED',
      });
      setSuccess('আবেদন বাতিল করা হয়েছে এবং আসনটি উন্মুক্ত করা হয়েছে। (Hold cancelled successfully. Seat released.)');
      onHoldUpdated();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Cancellation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveHold(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              চলমান আবেদন বিবরণী (Active Reservation)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {activeHold.className || 'শ্রেণি ও শিফট আসন সংরক্ষণ'}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

        {/* Details Card */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>বর্তমান অবস্থা (Status):</span>
            <StatusBadge status={isExpired ? 'EXPIRED' : activeHold.status} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>শিক্ষার্থীর জন্ম নিবন্ধন:</span>
            <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
              {activeHold.studentId}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>সংরক্ষণ আইডি (Hold ID):</span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
              {activeHold.holdId}
            </span>
          </div>

          {/* Countdown timer for HELD holds */}
          {activeHold.status === 'HELD' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>সময় বাকি (Countdown):</span>
              <CountdownTimer expiresAt={activeHold.expiresAt} onExpire={handleExpire} />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Confirm Button */}
          {isHeld && (
            <button
              onClick={handleConfirm}
              disabled={loading || isExpired}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 20px',
                backgroundColor: isExpired ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isExpired || loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: isExpired ? 'none' : '0 2px 4px rgba(22, 163, 74, 0.25)',
              }}
            >
              <CreditCard size={18} />
              {loading ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'ভর্তি ফি দিন (Pay Fee & Confirm Admission)'}
            </button>
          )}

          {/* Cancel Button */}
          {isHeld && (
            <button
              onClick={handleCancel}
              disabled={loading || isExpired}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 20px',
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isExpired || loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <Trash2 size={16} />
              বাতিল করুন (Cancel Hold & Release Seat)
            </button>
          )}

          {/* Completed State Info */}
          {isConfirmed && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#166534', fontWeight: 600 }}>
              <CheckCircle2 size={24} style={{ margin: '0 auto 6px', display: 'block', color: '#16a34a' }} />
              এই শিক্ষার্থীর ভর্তি সম্পূর্ণভাবে নিশ্চিত করা হয়েছে!
            </div>
          )}

          {isExpired && !isConfirmed && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontWeight: 600 }}>
              সংরক্ষিত সময়ের মেয়াদ শেষ হয়ে গেছে। আসনটি পুনরায় উন্মুক্ত করা হয়েছে।
            </div>
          )}

          {isCancelled && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontWeight: 600 }}>
              আবেদনটি সফলভাবে বাতিল করা হয়েছে।
            </div>
          )}

          <button
            onClick={handleClose}
            style={{
              padding: '10px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};


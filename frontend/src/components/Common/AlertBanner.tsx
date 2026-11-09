import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface Props {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  onDismiss?: () => void;
}

export const AlertBanner: React.FC<Props> = ({ type, message, onDismiss }) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: '#fef2f2',
      border: '#f87171',
      text: '#991b1b',
      icon: <AlertCircle size={18} color="#dc2626" />,
    },
    success: {
      bg: '#f0fdf4',
      border: '#4ade80',
      text: '#166534',
      icon: <CheckCircle size={18} color="#16a34a" />,
    },
    info: {
      bg: '#eff6ff',
      border: '#60a5fa',
      text: '#1e40af',
      icon: <Info size={18} color="#2563eb" />,
    },
    warning: {
      bg: '#fffbeb',
      border: '#fbbf24',
      text: '#92400e',
      icon: <AlertCircle size={18} color="#d97706" />,
    },
  }[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '8px',
        color: styles.text,
        fontSize: '14px',
        fontWeight: 500,
        marginBottom: '16px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {styles.icon}
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: styles.text,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};


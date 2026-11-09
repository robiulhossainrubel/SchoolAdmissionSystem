import React from 'react';
import type { HoldStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  status: HoldStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'HELD':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
          label: 'HELD / অপেক্ষমাণ',
          icon: <Clock size={size === 'sm' ? 12 : 14} className="animate-pulse" />,
        };
      case 'CONFIRMED':
        return {
          bg: '#d1fae5',
          color: '#065f46',
          border: '#a7f3d0',
          label: 'CONFIRMED / নিশ্চিত',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} />,
        };
      case 'EXPIRED':
        return {
          bg: '#fee2e2',
          color: '#991b1b',
          border: '#fecaca',
          label: 'EXPIRED / মেয়াদোত্তীর্ণ',
          icon: <AlertTriangle size={size === 'sm' ? 12 : 14} />,
        };
      case 'CANCELLED':
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          label: 'CANCELLED / বাতিল',
          icon: <XCircle size={size === 'sm' ? 12 : 14} />,
        };
      default:
        return {
          bg: '#f3f4f6',
          color: '#374151',
          border: '#e5e7eb',
          label: normalized,
          icon: null,
        };
    }
  };

  const style = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: '9999px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '11px' : '13px',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {style.icon}
      {style.label}
    </span>
  );
};

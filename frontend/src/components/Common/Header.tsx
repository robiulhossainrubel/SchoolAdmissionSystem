import React from 'react';
import { useStudent } from '../../context/StudentContext';
import { GraduationCap, UserCheck, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  activeTab: 'offerings' | 'my-holds' | 'admin';
  setActiveTab: (tab: 'offerings' | 'my-holds' | 'admin') => void;
}

export const Header: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { studentId, setStudentId, isValidStudentId, validationMessage } = useStudent();

  return (
    <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      {/* Brand Top Bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              School Admission System
            </h1>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              বিদ্যালয় অনলাইন ভর্তি ব্যবস্থা (First-Come, First-Served)
            </span>
          </div>
        </div>

        {/* 17-digit Student ID Input Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '320px', maxWidth: '420px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="student-id-input" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              শিক্ষার্থীর জন্ম নিবন্ধন নম্বর (Student ID):
            </label>
          </div>
          <div style={{ position: 'relative', marginTop: '4px' }}>
            <input
              id="student-id-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={17}
              placeholder="১৭ অঙ্কের জন্ম নিবন্ধন নম্বর লিখুন (e.g. 20152691234567890)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 42px 10px 14px',
                borderRadius: '8px',
                border: `2px solid ${isValidStudentId ? '#10b981' : studentId.length > 0 ? '#f59e0b' : '#cbd5e1'}`,
                outline: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                fontFamily: 'monospace',
                backgroundColor: isValidStudentId ? '#f0fdf4' : '#ffffff',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
            />
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              {isValidStudentId ? (
                <UserCheck size={18} color="#10b981" />
              ) : (
                <AlertCircle size={18} color={studentId ? '#f59e0b' : '#94a3b8'} />
              )}
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              marginTop: '4px',
              fontWeight: 600,
              color: isValidStudentId ? '#059669' : studentId ? '#d97706' : '#64748b',
            }}
          >
            {validationMessage}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('offerings')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'offerings' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'offerings' ? '#1d4ed8' : '#475569',
              fontWeight: activeTab === 'offerings' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={16} />
            আসন ও আবেদন তালিকা (Class Offerings)
          </button>

          <button
            onClick={() => setActiveTab('my-holds')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'my-holds' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'my-holds' ? '#1d4ed8' : '#475569',
              fontWeight: activeTab === 'my-holds' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <UserCheck size={16} />
            আমার আবেদন (My Applications)
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'admin' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'admin' ? '#1d4ed8' : '#64748b',
              fontWeight: activeTab === 'admin' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldAlert size={16} />
            School Admin (ড্যাশবোর্ড)
          </button>
        </div>
      </div>
    </header>
  );
};


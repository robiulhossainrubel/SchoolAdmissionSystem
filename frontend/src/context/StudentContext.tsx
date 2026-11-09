import React, { createContext, useContext, useState } from 'react';
import type { Hold } from '../types';

interface ActiveHoldState extends Hold {
  className?: string;
}

interface StudentContextType {
  studentId: string;
  setStudentId: (id: string) => void;
  isValidStudentId: boolean;
  validationMessage: string;
  activeHold: ActiveHoldState | null;
  setActiveHold: (hold: ActiveHoldState | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STUDENT_ID_KEY = 'sas_student_id';
const ACTIVE_HOLD_KEY = 'sas_active_hold';

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentId, setStudentIdState] = useState<string>(() => {
    return localStorage.getItem(STUDENT_ID_KEY) || '';
  });

  const [activeHold, setActiveHoldState] = useState<ActiveHoldState | null>(() => {
    const saved = localStorage.getItem(ACTIVE_HOLD_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const setStudentId = (id: string) => {
    const trimmed = id.replace(/\D/g, '').slice(0, 17);
    setStudentIdState(trimmed);
    localStorage.setItem(STUDENT_ID_KEY, trimmed);
  };

  const setActiveHold = (hold: ActiveHoldState | null) => {
    setActiveHoldState(hold);
    if (hold) {
      localStorage.setItem(ACTIVE_HOLD_KEY, JSON.stringify(hold));
    } else {
      localStorage.removeItem(ACTIVE_HOLD_KEY);
    }
  };

  const isValidStudentId = /^\d{17}$/.test(studentId);

  const validationMessage = !studentId
    ? 'Enter 17-digit birth registration ID / ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন'
    : studentId.length < 17
    ? `${17 - studentId.length} more digit(s) required / আরও ${17 - studentId.length}টি অঙ্ক বাকি`
    : 'Valid student ID / সঠিক জন্ম নিবন্ধন নম্বর';

  return (
    <StudentContext.Provider
      value={{
        studentId,
        setStudentId,
        isValidStudentId,
        validationMessage,
        activeHold,
        setActiveHold,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

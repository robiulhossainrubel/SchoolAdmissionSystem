import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfferingList } from '../components/Parent/OfferingList';
import { StudentProvider, useStudent } from '../context/StudentContext';
import { api } from '../services/api';
import type { ClassOffering } from '../types';

vi.mock('../services/api', () => ({
  api: {
    getClasses: vi.fn(),
    createHold: vi.fn(),
  },
  ApiError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const mockOfferings: ClassOffering[] = [
  {
    id: 'class-1',
    name: 'Class 1 - Morning',
    totalSeats: 10,
    confirmedSeats: 3,
    heldSeats: 2,
    availableSeats: 5,
  },
  {
    id: 'class-2',
    name: 'Class 2 - Day (Full)',
    totalSeats: 5,
    confirmedSeats: 5,
    heldSeats: 0,
    availableSeats: 0,
  },
];

const WrapperWithStudentId: React.FC<{ studentId?: string; children: React.ReactNode }> = ({ studentId, children }) => {
  return (
    <StudentProvider>
      <InnerInit studentId={studentId}>{children}</InnerInit>
    </StudentProvider>
  );
};

const InnerInit: React.FC<{ studentId?: string; children: React.ReactNode }> = ({ studentId, children }) => {
  const { setStudentId } = useStudent();
  React.useEffect(() => {
    if (studentId) setStudentId(studentId);
  }, [studentId, setStudentId]);
  return <>{children}</>;
};

describe('OfferingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('renders offerings with accurate seat counts and availability badges', async () => {
    vi.mocked(api.getClasses).mockResolvedValue(mockOfferings);

    render(
      <WrapperWithStudentId>
        <OfferingList refreshTrigger={0} onHoldCreated={vi.fn()} />
      </WrapperWithStudentId>
    );

    // Verify offerings loaded
    await waitFor(() => {
      expect(screen.getByText('Class 1 - Morning')).toBeInTheDocument();
      expect(screen.getByText('Class 2 - Day (Full)')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('আসন খালি আছে')).toBeInTheDocument();
    expect(screen.getByText('SOLD OUT / আসন শেষ')).toBeInTheDocument();

    // Check numbers in the grid
    expect(screen.getByText('10')).toBeInTheDocument(); // totalSeats
    expect(screen.getByText('3')).toBeInTheDocument();  // confirmedSeats
    expect(screen.getByText('2')).toBeInTheDocument();  // heldSeats
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);  // availableSeats / totalSeats on class-2
  });

  it('disables apply button when seats are 0 (Sold Out)', async () => {
    vi.mocked(api.getClasses).mockResolvedValue(mockOfferings);

    render(
      <WrapperWithStudentId studentId="20061234567890123">
        <OfferingList refreshTrigger={0} onHoldCreated={vi.fn()} />
      </WrapperWithStudentId>
    );

    await waitFor(() => {
      expect(screen.getByText('Class 2 - Day (Full)')).toBeInTheDocument();
    });

    const soldOutButton = screen.getByRole('button', { name: /আসন খালি নেই \(Sold Out\)/i });
    expect(soldOutButton).toBeDisabled();
  });

  it('shows error banner when apply is clicked without a valid 17-digit student ID', async () => {
    vi.mocked(api.getClasses).mockResolvedValue(mockOfferings);
    const user = userEvent.setup();

    render(
      <WrapperWithStudentId studentId="12345">
        <OfferingList refreshTrigger={0} onHoldCreated={vi.fn()} />
      </WrapperWithStudentId>
    );

    await waitFor(() => {
      expect(screen.getByText('Class 1 - Morning')).toBeInTheDocument();
    });

    const applyButton = screen.getByRole('button', { name: /আবেদন করুন \(Apply for Seat\)/i });
    await user.click(applyButton);

    expect(
      screen.getByText(/আবেদন করার আগে উপরে শিক্ষার্থীর সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন/i)
    ).toBeInTheDocument();
    expect(api.createHold).not.toHaveBeenCalled();
  });

  it('calls api.createHold and triggers onHoldCreated callback on valid application', async () => {
    vi.mocked(api.getClasses).mockResolvedValue(mockOfferings);
    vi.mocked(api.createHold).mockResolvedValue({
      holdId: 'new-hold-1',
      classId: 'class-1',
      studentId: '20061234567890123',
      status: 'HELD',
      expiresAt: '2026-11-09T00:10:00Z',
    });

    const onHoldCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <WrapperWithStudentId studentId="20061234567890123">
        <OfferingList refreshTrigger={0} onHoldCreated={onHoldCreated} />
      </WrapperWithStudentId>
    );

    await waitFor(() => {
      expect(screen.getByText('Class 1 - Morning')).toBeInTheDocument();
    });

    const applyButton = screen.getByRole('button', { name: /আবেদন করুন \(Apply for Seat\)/i });
    await user.click(applyButton);

    expect(api.createHold).toHaveBeenCalledWith('class-1', '20061234567890123');
    expect(onHoldCreated).toHaveBeenCalled();
  });
});

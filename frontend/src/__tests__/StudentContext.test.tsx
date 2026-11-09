import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentProvider, useStudent } from '../context/StudentContext';

const TestComponent = () => {
  const { studentId, setStudentId, isValidStudentId, validationMessage, activeHold, setActiveHold } = useStudent();
  return (
    <div>
      <span data-testid="student-id">{studentId}</span>
      <span data-testid="is-valid">{isValidStudentId ? 'VALID' : 'INVALID'}</span>
      <span data-testid="validation-msg">{validationMessage}</span>
      <span data-testid="active-hold">{activeHold ? activeHold.className : 'NONE'}</span>
      <button onClick={() => setStudentId('20061234567890123')}>Set Valid ID</button>
      <button onClick={() => setStudentId('abc12345')}>Set Alpha ID</button>
      <button onClick={() => setStudentId('12345678901234567890')}>Set 20-digit ID</button>
      <button
        onClick={() =>
          setActiveHold({
            holdId: 'hold-123',
            classId: 'class-1',
            studentId: '20061234567890123',
            status: 'HELD',
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            className: 'Class 1 Morning',
          })
        }
      >
        Set Hold
      </button>
      <button onClick={() => setActiveHold(null)}>Clear Hold</button>
    </div>
  );
};

describe('StudentContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty studentId and invalid status', () => {
    render(
      <StudentProvider>
        <TestComponent />
      </StudentProvider>
    );

    expect(screen.getByTestId('student-id').textContent).toBe('');
    expect(screen.getByTestId('is-valid').textContent).toBe('INVALID');
    expect(screen.getByTestId('validation-msg').textContent).toContain('17-digit');
    expect(screen.getByTestId('active-hold').textContent).toBe('NONE');
  });

  it('validates exactly 17 numeric digits and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <StudentProvider>
        <TestComponent />
      </StudentProvider>
    );

    await user.click(screen.getByText('Set Valid ID'));

    expect(screen.getByTestId('student-id').textContent).toBe('20061234567890123');
    expect(screen.getByTestId('is-valid').textContent).toBe('VALID');
    expect(screen.getByTestId('validation-msg').textContent).toContain('Valid student ID');
    expect(localStorage.getItem('sas_student_id')).toBe('20061234567890123');
  });

  it('filters out non-digit characters', async () => {
    const user = userEvent.setup();
    render(
      <StudentProvider>
        <TestComponent />
      </StudentProvider>
    );

    await user.click(screen.getByText('Set Alpha ID'));

    // 'abc12345' has non-digits stripped -> '12345'
    expect(screen.getByTestId('student-id').textContent).toBe('12345');
    expect(screen.getByTestId('is-valid').textContent).toBe('INVALID');
  });

  it('truncates inputs longer than 17 digits to 17 digits', async () => {
    const user = userEvent.setup();
    render(
      <StudentProvider>
        <TestComponent />
      </StudentProvider>
    );

    await user.click(screen.getByText('Set 20-digit ID'));

    const id = screen.getByTestId('student-id').textContent;
    expect(id).toBe('12345678901234567');
    expect(id?.length).toBe(17);
    expect(screen.getByTestId('is-valid').textContent).toBe('VALID');
  });

  it('manages and persists active hold state', async () => {
    const user = userEvent.setup();
    render(
      <StudentProvider>
        <TestComponent />
      </StudentProvider>
    );

    await user.click(screen.getByText('Set Hold'));
    expect(screen.getByTestId('active-hold').textContent).toBe('Class 1 Morning');
    expect(localStorage.getItem('sas_active_hold')).toContain('hold-123');

    await user.click(screen.getByText('Clear Hold'));
    expect(screen.getByTestId('active-hold').textContent).toBe('NONE');
    expect(localStorage.getItem('sas_active_hold')).toBeNull();
  });

  it('restores studentId and activeHold from localStorage on mount', () => {
    localStorage.setItem('sas_student_id', '99999999999999999');
    localStorage.setItem(
      'sas_active_hold',
      JSON.stringify({
        holdId: 'restored-1',
        classId: 'c-1',
        studentId: '99999999999999999',
        status: 'HELD',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        className: 'Restored Class',
      })
    );

    render(
      <StudentProvider>
        <TestComponent />
      </StudentProvider>
    );

    expect(screen.getByTestId('student-id').textContent).toBe('99999999999999999');
    expect(screen.getByTestId('is-valid').textContent).toBe('VALID');
    expect(screen.getByTestId('active-hold').textContent).toBe('Restored Class');
  });
});

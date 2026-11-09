import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CountdownTimer } from '../components/Common/CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly formatted remaining time (MM:SS)', () => {
    const now = new Date('2026-11-09T10:00:00Z').getTime();
    vi.setSystemTime(now);

    // 10 minutes in the future
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();

    render(<CountdownTimer expiresAt={expiresAt} />);

    expect(screen.getByText(/10:00 বাকি/)).toBeInTheDocument();
  });

  it('counts down second-by-second', () => {
    const now = new Date('2026-11-09T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const expiresAt = new Date(now + 65 * 1000).toISOString(); // 1 minute 5 seconds

    render(<CountdownTimer expiresAt={expiresAt} />);
    expect(screen.getByText(/01:05 বাকি/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds later
    });

    expect(screen.getByText(/01:00 বাকি/)).toBeInTheDocument();
  });

  it('displays expired message and triggers onExpire callback when timer reaches zero', () => {
    const now = new Date('2026-11-09T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const onExpire = vi.fn();
    const expiresAt = new Date(now + 2000).toISOString(); // 2 seconds

    render(<CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />);
    expect(screen.getByText(/00:02 বাকি/)).toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/00:00 \(মেয়াদ শেষ \/ Expired\)/)).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('triggers onExpire immediately if already expired on mount', () => {
    const now = new Date('2026-11-09T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const onExpire = vi.fn();
    const pastExpiresAt = new Date(now - 10000).toISOString(); // 10s in past

    render(<CountdownTimer expiresAt={pastExpiresAt} onExpire={onExpire} />);

    expect(screen.getByText(/00:00 \(মেয়াদ শেষ \/ Expired\)/)).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});

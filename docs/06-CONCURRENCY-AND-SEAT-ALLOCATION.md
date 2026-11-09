# Concurrency and Seat Allocation — Critical

## Invariant

For every offering:

confirmedSeats + unexpiredHeldSeats <= totalSeats

## Hold transaction

For POST /classes/{classId}/holds:

1. Begin PostgreSQL transaction.
2. Lock the offering row using SELECT ... FOR UPDATE.
3. Capture nowUtc after acquiring the lock.
4. Mark expired HELD rows as EXPIRED where ExpiresAtUtc <= nowUtc.
5. Count CONFIRMED rows.
6. Count active HELD rows.
7. If total count reaches capacity, return HTTP 409.
8. Check duplicate active hold for the student.
9. Insert new HELD record.
10. Set expiry to nowUtc + configured hold duration.
11. Commit.
12. Return the hold.

The offering row lock serializes competing requests for the same offering.

## Confirm transaction

1. Begin transaction.
2. Acquire locks in a consistent order.
3. Verify student ownership.
4. Verify status is HELD.
5. Verify expiry has not passed.
6. Change status to CONFIRMED.
7. Set ConfirmedAtUtc.
8. Commit.

## Cancel transaction

1. Verify student ownership.
2. Lock records consistently.
3. Permit cancellation only from allowed states.
4. Change HELD to CANCELLED.
5. Commit.

## Never do these
- Do not use in-memory locks as the only protection.
- Do not count capacity outside the transaction.
- Do not insert after an unlocked capacity check.
- Do not depend on a background worker for expiry correctness.
- Do not allow concurrent API instances to oversell seats.

Use real PostgreSQL integration tests.

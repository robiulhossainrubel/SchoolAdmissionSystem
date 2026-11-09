# Test Strategy

## Required test layers
- Domain unit tests.
- API integration tests.
- PostgreSQL-backed integration tests.
- Frontend component or end-to-end tests where practical.

## Functional tests
1. Create valid offering.
2. Reject invalid capacity.
3. Reject blank name.
4. List offerings.
5. Create hold.
6. Reject invalid student ID.
7. Return 409 when sold out.
8. Confirm valid hold.
9. Reject confirmation after expiry.
10. Cancel hold.
11. Verify cancellation releases capacity.
12. Verify student ownership.
13. List only the student's holds.

## Mandatory concurrency test
Use real PostgreSQL.

1. Create an offering with capacity 10.
2. Launch 100 simultaneous hold requests.
3. Use 100 distinct valid student IDs.
4. Exactly 10 should return 201.
5. Remaining requests should return 409.
6. Verify confirmed + active held seats never exceed 10.
7. Verify no unexpected 5xx errors.

Do not use EF Core InMemory as a replacement for the concurrency test.

Document actual test commands and outcomes.

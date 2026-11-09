# Domain and Database

## AdmissionClass

Represents one class/shift offering.

Suggested columns:
- Id: UUID primary key.
- Name: varchar, required.
- TotalSeats: integer, greater than zero.
- CreatedAtUtc: timestamp with time zone.

## AdmissionHold

Suggested columns:
- Id: UUID primary key.
- AdmissionClassId: UUID foreign key.
- StudentId: varchar(17).
- Status: HELD, CONFIRMED, EXPIRED, CANCELLED.
- CreatedAtUtc.
- ExpiresAtUtc.
- ConfirmedAtUtc: nullable.
- CancelledAtUtc: nullable.

## Indexes and constraints
- CHECK TotalSeats > 0.
- Index (AdmissionClassId, Status, ExpiresAtUtc).
- Index (StudentId, CreatedAtUtc).
- Foreign key from AdmissionHold to AdmissionClass.
- Enforce one active hold per student/offering transactionally.

## Capacity calculation
confirmedSeats = count(CONFIRMED)
heldSeats = count(HELD where ExpiresAtUtc > nowUtc)
availableSeats = max(0, totalSeats - confirmedSeats - heldSeats)

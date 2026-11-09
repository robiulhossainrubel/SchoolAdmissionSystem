# Product Requirements

## Objective
Build a School Admission System with temporary seat reservations and simulated admission payment.

## Roles

### Parent
- No login screen.
- Identify student using 17-digit birth registration ID.
- View available class/shift offerings.
- View available, held, and confirmed seats.
- Hold a seat temporarily.
- Confirm admission.
- Cancel a hold.
- View the student's holds.

### School Admin
- Create class/shift offerings.
- Define total seat capacity.
- View offerings and seat counts.

## Business rules
1. First Come, First Served.
2. No lottery.
3. Each offering has limited capacity.
4. A valid HELD record consumes one seat.
5. CONFIRMED records consume one seat.
6. EXPIRED and CANCELLED records do not consume seats.
7. Expired holds release capacity.
8. Confirmation simulates successful payment.
9. A sold-out offering returns HTTP 409.
10. Concurrent requests must never oversell capacity.

## Required endpoints
- POST /classes
- GET /classes
- GET /classes/{classId}
- POST /classes/{classId}/holds
- GET /holds/{holdId}
- POST /holds/{holdId}/confirm
- DELETE /holds/{holdId}
- GET /me/holds

## Acceptance criteria
- Admin can create an offering.
- Parent can view offerings and capacity.
- Parent can create a hold.
- Parent can confirm a valid hold.
- Parent can cancel a hold.
- Expired holds release seats.
- Parent can see their holds.
- Invalid student IDs are rejected.
- Sold-out requests return 409.
- Concurrency tests prove no overselling.
- Docker Compose starts all services.

## Out of scope
- Real payment gateway.
- Lottery.
- Parent password authentication.

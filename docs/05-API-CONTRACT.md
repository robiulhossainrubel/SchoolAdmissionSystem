# API Contract

Base URL: http://localhost:8080

## 1. Create class/shift offering

POST /classes

Request:
```json
{
  "name": "Grade 1 - Morning",
  "totalSeats": 40
}
```

Response: 201 Created

```json
{
  "id": "uuid",
  "name": "Grade 1 - Morning",
  "totalSeats": 40
}
```

## 2. List offerings

GET /classes

Response:
```json
[
  {
    "id": "uuid",
    "name": "Grade 1 - Morning",
    "totalSeats": 40,
    "heldSeats": 3,
    "confirmedSeats": 12,
    "availableSeats": 25
  }
]
```

## 3. Get offering

GET /classes/{classId}

Return one offering with capacity counters.

## 4. Create hold

POST /classes/{classId}/holds

Header:
X-Student-Id: 12345678901234567

Request body may be empty or `{}`.

Response: 201 Created

```json
{
  "holdId": "uuid",
  "classId": "uuid",
  "studentId": "12345678901234567",
  "status": "HELD",
  "expiresAt": "2026-11-09T10:10:00Z"
}
```

Return 409 if sold out.

## 5. Get hold

GET /holds/{holdId}

Return hold details and status.

## 6. Confirm hold

POST /holds/{holdId}/confirm

Header:
X-Student-Id: 12345678901234567

Payment is simulated as successful.

Response:
```json
{
  "holdId": "uuid",
  "status": "CONFIRMED"
}
```

Reject expired or invalid state transitions.

## 7. Cancel hold

DELETE /holds/{holdId}

Header:
X-Student-Id: 12345678901234567

Return 204 No Content on success.

## 8. List student's holds

GET /me/holds

Header:
X-Student-Id: 12345678901234567

Return holds for the supplied student.

## Validation
- Student ID must contain exactly 17 digits.
- Unknown class/hold: 404.
- Invalid request: 400.
- Sold out or invalid state: 409.
- Unexpected errors must not expose stack traces.

# Assumptions

These are implementation assumptions where the assignment does not define all details.

1. Hold duration defaults to 10 minutes and is configurable.
2. Student identity is a 17-digit birth registration ID supplied through X-Student-Id.
3. A student can have at most one active hold for the same offering.
4. One class record represents one selectable class/shift offering because the specified create API only contains name and totalSeats.
5. Payment is simulated as successful.
6. Timestamps are stored in UTC.
7. Hold statuses: HELD, CONFIRMED, EXPIRED, CANCELLED.
8. Active HELD and CONFIRMED records consume seats.
9. Expired and cancelled holds do not consume seats.
10. Expiration must be enforced during database operations. A background cleanup worker is optional.
11. Admin authentication is not specified. A demo admin interface may be implemented, but it must be documented as not production-secure.
12. Academic year is not included unless clarified.
13. API host port is 8080.
14. Frontend host port is 5173.

These assumptions must be updated if the assignment owner provides clarification.

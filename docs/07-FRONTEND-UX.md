# Frontend UX

## Parent screens
1. Admission landing page.
2. Student birth registration ID input.
3. Offering list and seat counters.
4. Hold confirmation screen.
5. Hold expiry countdown.
6. Confirm and cancel actions.
7. Student hold history.

## Admin screens
1. Admin offering creation form.
2. Offering list.
3. Capacity counters.

## UX requirements
- Responsive desktop/mobile layout.
- Accessible labels.
- Loading and error states.
- Disable duplicate submission while request is pending.
- Refresh capacity after hold/confirm/cancel.
- Clearly show HELD, CONFIRMED, EXPIRED, CANCELLED and SOLD OUT.

## Configuration
API base URL:
http://localhost:8080

Frontend UI:
http://localhost:5173

Use VITE_API_BASE_URL for frontend configuration.
Do not expose the student ID in public URLs.

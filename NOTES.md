# Notes

## Key Decisions

- Kept the app split into a separate Express API and React frontend.
- Used explicit equipment selection for cleaning records instead of guessing.
- Kept the dashboard minimal because there is no dedicated dashboard endpoint in the backend.
- Used live backend data for all major UI pages instead of hardcoded mock content.
- Captured audit `changedBy` from the frontend form so audit entries are attributable to a real user/value.

## Tradeoffs

- The backend currently exposes cleaning records per equipment, not a single global records endpoint.
  Because of that, the frontend dashboard derives its summary from existing API calls.
- The UI favors clarity and minimalism over a heavier enterprise layout.
- Record pagination is now wired in on the frontend for the cleaning-records view, using the backend page metadata.

## Left Out Deliberately

- Authentication / current-user identity.
- Docker setup.
- A dedicated dashboard API endpoint.
- Advanced analytics and complex charts.

## If I Had More Time

- Add a global cleaning-record aggregation endpoint on the backend.
- Add more tests around frontend form behavior.
- Add a small seed script and deployment-ready setup docs.

# Website guide

This guide describes the current frontend routes and role flows. A route is a URL. A section is a screen inside a role dashboard; Admin, Teacher, Sales, and Support sections are selected with a `?section=` query so they can be bookmarked and reopened.

## Shared application flow

1. `src/routes/__root.tsx` provides React Query, `AuthProvider`, `PlatformStoreProvider`, global styles, and the route outlet.
2. `src/hooks/use-auth.tsx` restores the current user from the stored token or handles sign-in/sign-out.
3. `src/lib/auth.ts` maps roles to home routes. `src/lib/api.ts` sends API requests and handles token refresh.
4. `src/components/app-shell.tsx` provides the sidebar, mobile navigation, notifications, account identity, and role-aware redirects.
5. `src/hooks/use-platform-store.tsx` loads and updates shared platform data by role.

The frontend's access checks are for user experience. The API must enforce authorization, package status, and data ownership as well.

## Public and account routes

| URL | Purpose |
|---|---|
| `/` | Public landing page with academy introduction, package links, teacher cards, schedules, FAQs, and sign-in/register links. |
| `/packages/basic` | Public Basic package catalogue. |
| `/packages/calls` | Public Calls package catalogue. |
| `/login` | Sign in with phone or email and password; redirects to the role's home route. |
| `/register` | Student self-registration. Staff users are created by Admin. |
| `/forgot-password` | Request a password-reset email. |
| `/reset-password?token=…` | Set a new password using the emailed token. |

## Student routes

| URL | Purpose and state |
|---|---|
| `/dashboard` | Student overview, scores, ranking, and learning status. |
| `/placement` | Placement questionnaire and onboarding. Students who have not completed placement are sent here. |
| `/subscribe` | Package and subscription flow for students who need an active subscription. |
| `/sessions` | Individual Calls sessions, balances, and bookings. Booking currently directs students to Support. |
| `/wallet` | Session/subscription balance and payment information. |
| `/free-lectures` | Calls-only free lectures assigned to the student; other students receive the Calls-only message. |
| `/lectures` | Weekly lectures and attendance. Hidden from Calls-only students. |
| `/courses` | Course materials. Hidden from Calls-only students. |
| `/homework` | View and submit homework. Hidden from Calls-only students. |
| `/exams` | Take assigned exams and view submissions/results. Hidden from Calls-only students. |
| `/certificates` | Student certificates. |
| `/progress` | Score, attendance, ranking, and skill progress. |
| `/plan` | Planned personalized learning plan. Data is not connected yet. |
| `/conversation` | UI prototype; messages are local to the open page and are not sent to an AI service. Recording is disabled. |
| `/chats` | Student messaging area. |
| `/scenarios` | Planned scenario practice; content is not connected yet. |
| `/mistakes` | Planned error review and practice; data is not connected yet. |

Package access is based on active subscriptions. A regular-group member must have an active `basic` category subscription and must not have an active `calls` category subscription. The package's `packageType` (time subscription or session bundle) is separate and does not change this group rule. Calls students use individual Calls sessions.

## Teacher route

`/teacher` is the Teacher dashboard. Its section is stored in the URL query, for example `/teacher?section=profile`.

- `students` — assigned students and progress.
- `profile` — photo and bio editor. Photo uses the existing upload/profile API. Bio storage depends on the API accepting and returning `bio`.
- `sessions` — availability and individual bookings.
- `schedule` — teacher schedule.
- `attendance` — attendance and absence entry.
- `materials` — course materials.
- `exams` — exams and results.
- `homework` — create/review homework.
- `chat` — student conversations.
- `reports` — student reports.
- `analytics` — teacher activity and student metrics.

## Admin route

`/admin` is the Admin dashboard. Example bookmark: `/admin?section=groups`.

- `overview` — platform summary and shortcuts.
- `teachers`, `students`, `sales`, `support` — staff/student directories and management.
- `add-user` — create staff users.
- `courses` — upload and manage educational materials.
- `exams`, `results` — create exams and review student submissions.
- `placement`, `placement-results` — configure placement questions and view outcomes.
- `packages`, `bookings`, `sales-report`, `leads` — packages, payment/booking review, reporting, and lead assignment.
- `certificates` — issue/manage certificates.
- `schedules` — recurring weekly timetable for a regular group/basic-package class. It records the weekday, start/end time, teacher, optional group, online/in-person location, and optional fixed meeting URL. It describes when the class repeats; it does not book an individual Calls session or record student attendance. Attendance is entered separately in the attendance section. Teacher availability for individual Calls bookings is managed separately.
- `sessions` — Calls bookings and related individual-session management.
- `groups` — regular groups for active Basic-package students only; Calls subscribers and students without an active Basic package cannot be added. Existing invalid memberships are flagged for removal.
- `free-lectures` — select Calls students and enter lecture details. The create button stays disabled because the current API contract supports `groupId`, not direct student targeting. The frontend does not create hidden groups for Calls students.
- `analytics`, `guide` — platform analytics and the in-app guide.

## Sales route

`/sales` uses `?section=` to select:

- `leads` — potential customers and lead status.
- `calls` — sales call log.
- `subscriptions` — subscription records.
- `stats` — sales and subscription reporting.

## Support route

`/support` uses `?section=` to select:

- `students` — student lookup and support actions.
- `tickets` — support requests/complaints.
- `chat` — support conversations.
- `schedules` — weekly schedules.
- `sessions` — Calls sessions.
- `groups` — regular student groups.
- `free-lectures` — free-lecture management.
- `attendance` — attendance tools.
- `irregular` — student follow-up.

## API and frontend limitations

- Account creation, authentication, subscription status, schedules, content, and reporting rely on the API. A frontend-only change can improve validation and make invalid actions harder to choose, but cannot guarantee data integrity against direct API requests.
- Group membership must also be rejected by the API when a student has an active Calls subscription.
- Individual free-lecture assignment needs an API contract that accepts a student identifier and returns lectures scoped to that student. The current `groupId` contract cannot safely represent this while keeping Calls students out of regular groups.
- Teacher bio needs API support in the profile update and public-teacher responses to persist and appear on the public page.
- `screens.tsx` currently contains screens for multiple roles. Split it into role/domain modules in small reviewed steps, preserving shared UI and API behavior.

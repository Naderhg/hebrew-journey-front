# Frontend roadmap

## Current frontend capabilities

- Public landing page, role-based login, student registration, password reset, and role dashboards.
- Student placement, package and subscription screens, student learning pages, sessions, wallet, and free-lecture view.
- Admin, Teacher, Sales, and Support sections for user, content, scheduling, and reporting workflows.
- Frontend group picker only admits students with an active Basic-category subscription and excludes active Calls subscribers. Existing invalid memberships can be identified and removed in the group UI.
- Dashboard sections can be linked/bookmarked using `?section=…`.
- Local demo student preview is available only in development.

## Frontend work to prioritize

1. Gradually split `src/components/screens.tsx` into Student, Teacher, Admin, Sales, and Support modules.
2. Add shared form patterns for validation, loading, empty, success, and error states.
3. Connect the personalized plan, scenarios, and mistake-review screens to real data or label them as planned until available.
4. Connect conversation practice to the intended service; keep voice controls disabled until recording and submission work end to end.
5. Add accessible keyboard/focus states and review RTL layout on mobile and desktop.
6. Keep the route guide and setup instructions current when routes or role access rules change.

## Requires API support

- Enforce role, package, and group-membership rules on the server; frontend checks alone can be bypassed.
- Support direct student targeting for free lectures so Calls students can be assigned individually without being added to regular groups.
- Accept and return the teacher `bio` field from profile and public-teacher endpoints.
- Confirm unique email/phone validation and consistent error responses for registration and staff creation.

## Quality checks

- Existing scripts: `npm run lint` and `npm run build`.
- Add a test runner and automated flows for login/role redirects, student subscription gates, group eligibility, and student-specific lecture visibility when the project owner approves the test setup.

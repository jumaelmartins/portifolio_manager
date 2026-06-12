# Portfolio Manager Frontend Foundation Design

**Date:** 2026-06-12  
**Status:** Approved for implementation planning  
**Roadmap milestone:** Frontend administrative foundation

## 1. Objective

Create the first functional frontend milestone for Portfolio Manager. The
delivery establishes the frontend architecture and design system, implements
the complete authentication flow, provides the authenticated administrative
shell and dashboard, and delivers a real end-to-end project CRUD integrated
with the existing NestJS API and PostgreSQL database.

This milestone must look and behave like a production-oriented open-source
product while staying within the capabilities of the current data model.

## 2. Scope

### Included

- Next.js frontend application under `frontend/`.
- Dark-first design system based on the existing design specification.
- High-definition brand assets derived from the supplied logo:
  - Reconstructed vector SVG.
  - Transparent 2048x2048 PNG.
  - Variants suitable for dark backgrounds.
  - Multi-resolution favicon.
- Complete authentication flow:
  - Local sign-in.
  - Account registration.
  - Email verification with six-digit code.
  - Verification email resend.
  - Google OAuth.
  - Sign-out.
- Authenticated administrative shell:
  - Responsive sidebar.
  - Top header.
  - User menu.
  - Public preview link.
  - Desktop, tablet, and mobile navigation behavior.
- Dashboard based only on data available from the current backend.
- Functional project management:
  - List projects.
  - Search and filter by category and technology.
  - Create a project.
  - Edit a project.
  - Delete a project with confirmation.
  - Select or upload a cover image.
  - Associate one category.
  - Associate multiple technologies.
- Shared loading, empty, error, confirmation, and success-feedback states.
- Focused backend corrections required for secure frontend integration.

### Excluded

- Project publication status.
- Visibility controls.
- Featured projects.
- Slugs.
- SEO metadata.
- Project galleries.
- Markdown editor.
- Full media-library management page.
- Public profile management.
- A complete public portfolio.
- Roadmap, FAQ, suggestions, changelog, and settings functionality.
- Analytics and fabricated dashboard data.
- Refresh-token architecture.

Excluded modules may appear in navigation only as disabled entries marked
`Soon`. They must not lead to non-functional or simulated product pages.

## 3. Technical Architecture

### 3.1 Frontend stack

- Next.js with App Router and TypeScript.
- Tailwind CSS for design tokens and layout styling.
- shadcn/ui primitives for accessible interface components.
- Lucide icons.
- TanStack Query for server-state fetching, caching, invalidation, and
  mutation lifecycle handling.
- React Hook Form with Zod for form state and validation.
- Vitest and React Testing Library for focused unit and component tests.
- Playwright for critical browser flows.

Dependency versions will be selected during implementation using the current
stable releases compatible with each other.

### 3.2 Application boundary

The browser communicates with Next.js Route Handlers under the frontend's
`/api` namespace. These handlers form a small backend-for-frontend layer and
forward authenticated requests to NestJS.

The BFF is responsible for:

- Reading the session token from an `HttpOnly` cookie.
- Adding the NestJS bearer token server-side.
- Normalizing known API errors into a stable frontend contract.
- Preventing the browser from directly handling the JWT.
- Clearing invalid sessions after authentication failures.

The BFF must remain thin. Business rules and resource authorization stay in
NestJS.

### 3.3 Session handling

After successful local or Google authentication, Next.js stores the JWT in a
cookie with these properties:

- `HttpOnly`.
- `SameSite=Lax`.
- `Path=/`.
- `Secure` in production.
- Expiration aligned with the JWT lifetime.

No access token is stored in `localStorage`, `sessionStorage`, or
client-readable cookies.

Next.js middleware provides early routing protection for administrative
pages. NestJS remains the final authorization authority for every protected
request.

## 4. Route Structure

Application routes:

```text
/
/login
/register
/verify-email
/auth/google/callback
/dashboard
/projects
/projects/new
/projects/[id]/edit
```

The root route redirects authenticated users to `/dashboard` and other users
to `/login`.

Frontend BFF routes mirror only the operations needed by this milestone:

```text
/api/auth/login
/api/auth/register
/api/auth/verify-email
/api/auth/resend-verification
/api/auth/google/callback
/api/auth/logout
/api/session
/api/dashboard
/api/projects
/api/projects/[id]
/api/categories
/api/technologies
/api/images
/api/uploads
```

## 5. Authentication Flows

### 5.1 Registration and verification

1. The user submits username, email, password, and password confirmation.
2. The BFF calls `POST /users`.
3. NestJS returns the email and opaque verification token generated for this
   challenge. It never returns the six-digit code.
4. The frontend moves to `/verify-email` with the email and verification token
   stored in short-lived server-managed verification context.
5. The user submits the six-digit code received by email.
6. The BFF calls `POST /auth/verify-email` with the opaque token and code.
7. Successful verification sends the user to sign-in.
8. The user can resend a code through `POST /auth/resend-verification`. A
   successful resend replaces the server-managed context with the new opaque
   token and still never exposes the emailed code.

Password guidance must reflect the backend's actual constraints before
submission.

### 5.2 Local sign-in

1. The user submits email and password.
2. The BFF calls `POST /auth/login`.
3. On success, the BFF stores the access token in the session cookie.
4. The user is redirected to `/dashboard`.
5. If NestJS returns `EMAIL_NOT_VERIFIED`, the frontend directs the user to
   verification and preserves the email address.

### 5.3 Google OAuth

1. The user starts Google authentication from the login page.
2. The flow passes through NestJS and Google.
3. NestJS returns a minimal HTML response containing a self-submitting `POST`
   form to the configured frontend BFF callback. The JWT is carried in the
   form body, never in the URL.
4. The BFF validates the handoff, creates the `HttpOnly` session cookie, and
   redirects to `/dashboard`.

The handoff page must not load third-party resources, must use a restrictive
Content Security Policy, and must not persist the token in browser history or
client storage.

### 5.4 Sign-out and expiration

Sign-out clears the frontend session cookie. A normalized `401` response from
the BFF also clears the cookie and redirects the user to `/login`, preserving
the intended destination when useful.

## 6. Administrative Shell

The shell follows the approved visual references and design-system
specification:

- Dark professional background.
- Fixed desktop sidebar approximately 260px wide.
- 64px top header.
- Green primary actions and cyan informational accents.
- Subtle borders, minimal shadows, and restrained transitions.
- Inter for interface text and JetBrains Mono for technical values.

Navigation groups:

```text
Overview
- Dashboard

Content
- Projects
- Experience (Soon)
- Education (Soon)
- Courses (Soon)
- Technologies (Soon)
- Categories (Soon)
- Custom Sections (Soon)
- Media Library (Soon)

Community
- Roadmap (Soon)
- FAQ (Soon)
- Suggestions (Soon)
- Changelog (Soon)

System
- Public API (Soon)
- Audit Logs (Soon)
- Settings (Soon)
```

On tablet and mobile, the sidebar becomes an accessible drawer. Keyboard focus
must be trapped while open and restored after closing.

The global search control is visual-only in this milestone and must be labeled
as unavailable or disabled rather than suggesting a working global search.

## 7. Dashboard

The dashboard uses real data from project, category, and technology endpoints.
It includes:

- Total projects.
- Total categories.
- Total technologies.
- Projects with cover images.
- Projects without cover images.
- Recently updated projects.
- Recent content activity inferred from available `created_at` and
  `updated_at` values.
- Quick actions for creating a project and opening the project list.

The dashboard must not show publication, suggestion, roadmap, traffic, API
request, or uptime metrics because those contracts do not exist in the current
backend.

The frontend BFF may aggregate existing endpoints into one dashboard response
to avoid duplicating orchestration in client components.

## 8. Project Management

### 8.1 List page

The project list follows the visual hierarchy of the supplied reference while
using only supported fields:

- Page heading and primary `New Project` action.
- Summary cards based on real project data.
- Search by title or description.
- Category filter.
- Technology filter.
- Table or responsive card list containing:
  - Cover thumbnail.
  - Title.
  - Shortened description.
  - Category.
  - Technologies.
  - Last update.
  - Edit and delete actions.
- Empty state with a create action.
- Delete confirmation dialog.

Search and filters may run client-side for the initial data volume. Their
state should be reflected in URL search parameters so the view is shareable
and survives navigation.

### 8.2 Project editor

The create and edit routes share one form composition with:

- Title.
- Description.
- Category.
- Multi-select technologies.
- Cover image.
- Repository URL.
- Live demo URL.

Layout:

- Main form area on the left.
- Compact context panel on the right for cover, links, and save actions.
- Single-column layout on smaller screens.

The form preserves entered data after API failures and focuses the first
invalid field after validation.

### 8.3 Cover image flow

The editor displays images belonging to the authenticated user. The user can:

- Select an existing image.
- Upload a valid image.
- See upload progress and failure feedback.
- Use the newly uploaded image without leaving the editor.

Supported frontend validation must match the backend. Initial accepted formats
are JPEG, PNG, and GIF with a maximum size of 5 MB. The limit is enforced in
both layers rather than only in the browser.

### 8.4 Technology association

The existing Prisma many-to-many relationship between projects and
technologies is used. Project create, read, and update contracts must include
technology IDs and return technology summaries.

The frontend must not create technologies inline in this milestone.

## 9. Backend Integration Corrections

The following backend changes are part of this milestone because the current
contracts cannot safely support the approved frontend:

- Enable configurable CORS for the frontend and OAuth flow.
- Add environment configuration for the frontend URL.
- Ensure project list, detail, update, and delete operations are scoped to the
  authenticated user, with administrator access only where explicitly
  intended.
- Apply JWT and active-user guards consistently to project deletion and other
  project mutations.
- Derive project ownership from the authenticated JWT instead of accepting a
  trusted `f_userId` from the browser.
- Add project technology IDs to create and update DTOs.
- Return technologies in project list and detail queries.
- Correct the upload ownership condition so regular users can upload only to
  their own account and administrators can act where allowed.
- Validate that an uploaded file exists before using it.
- Add a backend file-size limit and consistent MIME validation.
- Expose uploaded files through a stable HTTP URL instead of leaking local
  filesystem paths.
- Adjust Google OAuth redirection to the configured frontend callback and
  use a self-submitting `POST` handoff so credentials never enter the browser
  URL.
- Return the opaque verification token from registration and resend responses
  while keeping the six-digit code restricted to email delivery.
- Remove authentication debug logging from normal request paths.

These changes do not add new product fields such as status, visibility, SEO,
or gallery support.

## 10. Brand Asset Strategy

The supplied `Logo.png` is a visual source rather than a clean master asset.
Its checkerboard is baked into the bitmap and the mark includes rasterized
lighting and depth effects.

For reliable UI use, the mark will be manually reconstructed as a clean,
vector-friendly logo while preserving:

- The interlocking white `P` and green `M` geometry.
- The hexagonal outer silhouette.
- The green brand accent.
- Recognition at sidebar and favicon sizes.

Deliverables:

```text
frontend/public/brand/logo-mark.svg
frontend/public/brand/logo-mark-dark.svg
frontend/public/brand/logo-mark-2048.png
frontend/public/brand/logo-lockup.svg
frontend/src/app/favicon.ico
frontend/src/app/icon.png
frontend/src/app/apple-icon.png
```

The main UI version favors flat geometry and restrained depth so it remains
legible at small sizes. The high-resolution PNG may retain subtle depth but
must have a genuinely transparent background.

## 11. Design System

Core tokens follow `portfolio-manager-design-system-spec.md`:

- Main background: `#09090B`.
- Secondary background: `#111113`.
- Card surface: `#18181B`.
- Elevated surface: `#1F1F23`.
- Default border: `#2A2A30`.
- Primary text: `#FAFAFA`.
- Secondary text: `#A1A1AA`.
- Primary green: `#22C55E`.
- Primary hover: `#16A34A`.
- Informational cyan: `#38BDF8`.
- Card radius: 14px.
- Button and input radius: 10px.
- Standard transition: 150ms ease.

Reusable components include:

- Button variants.
- Input, textarea, select, and multi-select.
- Card.
- Badge.
- Table and responsive row card.
- Dialog and confirmation dialog.
- Dropdown menu.
- Toast.
- Skeleton.
- Empty state.
- Error state.
- File uploader.
- Project form fields.

Components must expose visible focus states, appropriate labels, keyboard
operation, and non-color status cues.

## 12. Error Handling

The BFF returns a stable error shape:

```ts
type ApiError = {
  status: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
```

Behavior:

- `400` and validation errors appear near relevant fields.
- `401` clears the session and starts sign-in recovery.
- `403` communicates missing permission without hiding the event.
- `404` shows a resource-specific not-found state.
- `409` preserves form state and explains the conflict.
- `5xx` shows retry feedback and logs technical context server-side.
- Network failures do not discard form input.

Raw backend errors, stack traces, tokens, and filesystem paths must never be
rendered to users.

## 13. Testing Strategy

### Frontend unit and component tests

- Zod schemas match backend constraints.
- Session-cookie helpers use correct attributes.
- BFF error normalization.
- Protected-route behavior.
- Project list filtering.
- Project form validation and error preservation.
- Upload validation.
- Empty, loading, and error states.

### Backend tests

- Project ownership isolation for list, detail, update, and delete.
- Project technology association during create and update.
- Unauthorized deletion rejection.
- Upload ownership rules for regular users and administrators.
- Upload type and size validation.
- Google callback target configuration.

### Integration tests

- BFF forwards authenticated requests correctly.
- Expired or invalid sessions are cleared.
- Project response normalization includes category, technologies, and image
  URL.
- API error statuses remain meaningful through the BFF.

### Browser tests

Playwright covers:

- Registration to email-verification entry.
- Verification and resend behavior with controlled test fixtures.
- Local sign-in and sign-out.
- Google callback handling without requiring a live Google account.
- Project create, list, edit, cover upload, and delete.
- Protected-page redirect.
- Basic desktop and mobile navigation.

## 14. Completion Criteria

The milestone is complete when:

- The frontend builds and lints without errors.
- Focused frontend and backend tests pass.
- Playwright critical flows pass against a real NestJS instance and test
  PostgreSQL database.
- A regular user cannot read or mutate another user's projects or images.
- Authentication tokens are not readable by browser JavaScript or left in the
  visible URL.
- Dashboard metrics are derived from real supported data.
- Project CRUD supports category, technologies, cover image, repository URL,
  and live URL end to end.
- The interface is usable at desktop, tablet, and mobile widths.
- Loading, empty, error, validation, and success states are implemented.
- Logo, high-resolution PNG, and favicon assets are present and used by the
  application.
- No excluded future feature is represented as functional.

## 15. Implementation Sequence

The subsequent implementation plan should preserve this dependency order:

1. Correct and test backend contracts required by the frontend.
2. Scaffold Next.js and establish quality tooling.
3. Create brand assets and design tokens.
4. Implement BFF session and authentication routes.
5. Build authentication screens and flows.
6. Build the responsive administrative shell.
7. Implement dashboard aggregation and UI.
8. Implement project list and filters.
9. Implement project editor, technologies, and cover upload.
10. Add browser tests and complete end-to-end verification.

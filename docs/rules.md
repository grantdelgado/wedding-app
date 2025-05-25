# Project Rules and Guidelines

## 1. Project Overview
Unveil is a modern, mobile-first app designed to help couples communicate effortlessly with their wedding guests, stay organized across their wedding weekend, and preserve shared memories for years to come. It's built for hosts and guests alike—with real-time messaging, media sharing, and a post-wedding time capsule experience.

The core purpose of Unveil is to simplify wedding communication and memory sharing—before, during, and after the event. Hosts can send updates, manage schedules, and collect media. Guests can stay informed, upload photos, and revisit memories over time.

This project is being developed as a clean, production-grade MVP.

## 2. Coding Style Guide

### JavaScript/TypeScript
- **Formatting:** Automated code formatting is enforced by **Prettier**. Configuration is in `.prettierrc.js`. Key settings include:
    - Semicolons: `true`
    - Trailing Commas: `all`
    - Single Quotes: `true`
    - Print Width: `80` characters
    - Tab Width: `2` spaces
    - Arrow Parens: `always`
    - End of Line: `lf`
  Run `pnpm run format` to format the codebase.
- **Linting:** Code quality and adherence to best practices are enforced by **ESLint**. Configuration is in `eslint.config.mjs`, extending `next/core-web-vitals` and `next/typescript`. It's integrated with Prettier via `eslint-config-prettier` to prevent rule conflicts.
  Run `pnpm run lint` to check for issues and `pnpm run lint:fix` to automatically fix them.
- **Naming Conventions:**
    - Variables and functions: `camelCase`
    - Classes and Components (React/Next.js): `PascalCase`
    - Constants: `UPPER_SNAKE_CASE`
    - Files: `kebab-case.ts` or `kebab-case.tsx`. Component files within Next.js `app` router directories should follow Next.js conventions (e.g., `page.tsx`, `layout.tsx`).
- **Type Safety:** Strive for strong type safety using TypeScript. Avoid `any` where possible. Utilize utility types and interfaces effectively.
- **Modularity:** Write small, focused functions and components.
- **Comments:** Use JSDoc-style comments for functions and complex logic. Explain *why* something is done, not just *what* is being done.

### CSS/Styling (Tailwind CSS)
- **Utility-First:** Embrace Tailwind's utility-first approach. Avoid custom CSS where a utility class can achieve the same result.
- **Readability:** Keep class strings readable. For very long class strings on a single element, consider breaking them onto multiple lines or abstracting into a component.
- **Theming:** Utilize `tailwind.config.js` for theme customizations (colors, spacing, fonts) rather than arbitrary values inlined in components.
- **`@apply`:** Use `@apply` sparingly, primarily for grouping common utility patterns that are reused frequently and cannot be easily componentized.

### General
- **Maximum Line Length:** `80` characters (enforced by Prettier).
- **Imports:** Organize imports: 1. React/Next.js imports, 2. External library imports, 3. Internal absolute imports (`@/components/...`), 4. Relative imports (`../...`). ESLint can help enforce this.

## 3. Directory Structure
The project follows a structure typical for Next.js applications using the App Router, with clear separation of concerns:
- **`/app`**: Core application routes, layouts, and pages (App Router).
- **`/components`**: Reusable UI components.
    - **`/components/ui`**: Components from shadcn/ui.
    - **`/components/custom`**: Project-specific custom components.
- **`/lib`**: Utility functions, helper scripts, Supabase client configuration, and other shared logic.
- **`/public`**: Static assets (images, fonts, etc.).
- **`/styles`**: Global styles (e.g., `globals.css`).
- **`/types`**: TypeScript type definitions, especially for shared data structures or Supabase types (`supabase.types.ts`).
- **`/docs`**: Project documentation, including this `rules.md` file.
- **`/reference`**: Architectural snapshots and decision logs (`schema.sql`, `session-log.md`, `decisions.md`, `questions.md`).

## 4. Commit Message Conventions
Follow the **Conventional Commits** specification. This makes for an explicit commit history, which is easier to manage and can be used for automated changelog generation.
The basic format is:
`type(optional scope): subject`

- **`type`**: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`.
- **`scope`**: Optional, a noun describing a section of the codebase (e.g., `auth`, `guest-list`, `ui`).
- **`subject`**: Concise description of the change in imperative mood (e.g., "add user login form").

Example: `feat(auth): implement password reset functionality`
Example: `fix(media): correct image upload aspect ratio`
Example: `docs: update rules.md with commit conventions`

## 5. Testing Strategy
A comprehensive testing strategy is crucial for a production-grade application.
- **Unit Tests:**
    - **Tool:** Jest with React Testing Library.
    - **Location:** Co-located with the component/function they are testing (e.g., `MyComponent.test.tsx` next to `MyComponent.tsx`) or in a `__tests__` subdirectory.
    - **Focus:** Test individual functions, components, and hooks in isolation. Mock dependencies where necessary.
- **Integration Tests:**
    - **Tool:** Jest/React Testing Library, potentially Cypress for end-to-end style integration tests involving multiple components or services.
    - **Location:** A dedicated `tests/integration` directory.
    - **Focus:** Test interactions between multiple components or modules, and interactions with Supabase (mocked or using a test instance).
- **End-to-End (E2E) Tests:**
    - **Tool:** Cypress or Playwright.
    - **Location:** A dedicated `tests/e2e` directory.
    - **Focus:** Test full user flows through the application as a user would experience them.
- **Coverage:** Aim for high test coverage, particularly for critical business logic and UI components. Configure Jest to generate coverage reports.

## 6. Dependency Management
- **Package Manager:** `pnpm` (as indicated by `pnpm-lock.yaml` and usage of `pnpm add`).
- **`package.json` and `pnpm-lock.yaml`**: Always commit both files. `pnpm-lock.yaml` ensures reproducible builds.
- **Updating Dependencies:**
    - Regularly review and update dependencies to incorporate new features, bug fixes, and security patches.
    - Use `pnpm outdated` to check for outdated packages.
    - Use `pnpm update <package-name>` or `pnpm install <package-name>@latest` for updates.
    - Test thoroughly after updating dependencies.
- **Security:** Use `pnpm audit` to identify and fix security vulnerabilities in dependencies.

## 7. Deployment Process
- **Platform:** Vercel.
- **CI/CD:** Vercel provides automatic deployments on pushes/merges to the main branch (e.g., `main` or `master`).
- **Environment Variables:** Manage environment variables (Supabase keys, etc.) through Vercel's project settings. Do not commit sensitive keys to the repository. Use `.env.local` for local development, which should be in `.gitignore`.
- **Build Command:** `npm run build` (standard for Next.js).
- **Preview Deployments:** Utilize Vercel's preview deployments for every pull request to test changes before merging to production.
- **Production Branch:** Typically `main`.

## 8. Branching Strategy
Adopt a simple and effective branching strategy like **GitHub Flow**:
1.  **`main` branch:** Always deployable. Never push directly to `main`.
2.  **Feature Branches:** Create a new branch from `main` for every new feature, bug fix, or improvement.
    - Naming: `type/descriptive-name` (e.g., `feat/user-profile-page`, `fix/login-bug`).
3.  **Pull Requests (PRs):** Once work on a feature branch is complete, open a Pull Request against `main`.
    - PRs should include a clear description of the changes.
    - PRs trigger preview deployments on Vercel.
4.  **Code Review:** PRs must be reviewed and approved by at least one other team member (or by the project lead if solo).
5.  **Merge:** Once approved and all checks pass (linters, tests, preview deployment), merge the PR into `main`. Squash and merge or rebase and merge can be used depending on team preference for commit history cleanliness.
6.  **Delete Branch:** Delete the feature branch after merging.

## 9. Code Review Process
- **Purpose:** Ensure code quality, consistency, and knowledge sharing.
- **Guidelines:**
    - Reviewers should provide constructive, actionable feedback.
    - Authors should be receptive to feedback and address comments.
    - Focus on:
        - Correctness: Does the code do what it's supposed to do?
        - Readability & Maintainability: Is the code easy to understand and modify?
        - Performance: Are there any obvious performance bottlenecks?
        - Security: Are there any potential security vulnerabilities?
        - Adherence to `rules.md`: Does the code follow the established guidelines?
    - Automate what can be automated (linting, formatting, tests) to allow reviewers to focus on higher-level concerns.
- **Approval:** At least one approval is required before merging a PR.

## 10. Documentation
- **`README.md`**: High-level overview of the project, setup instructions, tech stack. Keep this up-to-date.
- **`docs/rules.md`**: This document. The living guide for development practices.
- **Code Comments (JSDoc):** Document non-obvious logic, function parameters, and return values directly in the code.
- **Component Documentation:** For complex or highly reusable custom components, consider adding a small Markdown file in their directory or using a tool like Storybook in the future.
- **API Documentation (if applicable):** If exposing an API beyond Supabase, use tools like Swagger/OpenAPI.
- **Architectural Decisions:** Log significant architectural decisions and their rationale in `reference/decisions.md`.
- **Session Log:** Maintain a development log in `reference/session-log.md` for tracking progress and changes.
- **Open Questions:** Keep track of unresolved issues or questions in `reference/questions.md`.

---
This document is a living guide. It should be updated as the project evolves and new conventions are established. 
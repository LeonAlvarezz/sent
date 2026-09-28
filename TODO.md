# Feature Backlog & Missing Features

- [x] **User Avatar Simplification**
  - Replace hardcoded external GitHub avatar (`https://avatars.githubusercontent.com/...`) with simple provided avatar / fallback.
  - Ensure consistent initials, icon fallback, and user profile image handling across sidebar and user components.

- [ ] **Direct SEO Partner Status Update in Table**
  - Replace static status `<Tag>` in SEO Partners data table with interactive `<Select>` / `<NativeSelect>`.
  - Enable instant inline status updates directly from table rows without opening edit modal.

- [ ] **Access Control & Permissions Gating**
  - Restrict Quick Outreach (`/outreach`) and User List (`/users`) visibility and access strictly to `super_admin`.
  - Enforce permissions across navigation items, route loaders/guards, and backend API endpoints.

# Feature Backlog & Missing Features

- [x] **User Avatar Simplification**
  - Replace hardcoded external GitHub avatar (`https://avatars.githubusercontent.com/...`) with simple provided avatar / fallback.
  - Ensure consistent initials, icon fallback, and user profile image handling across sidebar and user components.

- [x] **Direct SEO Partner Status Update in Table**
  - Replace static status `<Tag>` in SEO Partners data table with interactive `<Select>` / `<NativeSelect>`.
  - Enable instant inline status updates directly from table rows without opening edit modal.

- [x] **Access Control & Permissions Gating**
  - Restrict User List (`/users`) visibility and access strictly to `super_admin`.
  - Grant `admin` access to SEO (Partners, Quick Outreach), Bulk Email, and Mail Settings.
  - Grant standard `user` access to Bulk Email (Audiences, Bulk Send, Queue) and Settings.
  - Enforce permissions across navigation items, route loaders/guards, and backend API endpoints.


- Integrated Khmer player movement, attack, dash and death animations.
- Built the Angkor exterior and playable temple interior; improved jungle coverage and terrain blending.
- Fixed food pickup and blank HUD issues, randomized enemy loot, updated audio and resolved progression merge conflicts.
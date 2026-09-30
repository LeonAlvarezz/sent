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

- [x] **Competitor Backlink Discovery & Partner Outreach (DataForSEO)**
  - Integrate DataForSEO Backlinks API (`/v3/backlinks/referring_domains/live`) in `apps/backend`.
  - Add backend endpoint `POST /api/seo-partners/competitor-backlinks` to extract linking partner domains, DR, and anchor text.
  - Add "Competitor Spy / Import" modal in `apps/starter` SEO Partner module to search competitor domain and preview/import partners directly into `seo_partner` table.
  - Feed imported competitor link partners directly into `SeoPartnerOutreachDrawer` for auto-scraping emails and 1-click AI pitching.
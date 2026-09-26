# Z3 Admin Template & Architecture

A modern, high-performance monorepo admin template built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **TanStack Router**, and **Headless UI v2**, powered by **Bun** and **Turborepo**.

---

## 🏗️ Monorepo Architecture

```
z3-admin/
├── apps/
│   ├── starter/           # React 19 + TanStack Router frontend client
│   └── backend/           # Express 5 + Drizzle ORM + Better Auth backend API
├── packages/
│   ├── core/              # Core framework, UI components, layout, and styling (@z3/admin-core)
│   ├── types/             # Shared Valibot schemas, contracts, and TypeScript models (@z3/types)
│   ├── create-z3-admin/   # Scaffolding CLI for generating Mock/Fullstack projects
│   ├── eslint-config/     # Shared ESLint configuration (@z3/eslint-config)
│   └── typescript-config/ # Shared TypeScript base configurations (@z3/typescript-config)
├── docker-compose.yml     # Local PostgreSQL 16 container definition
└── package.json           # Monorepo root scripts & workspace configuration
```

- **Package Manager**: [Bun](https://bun.sh) (uses `workspace:*` dependency protocol).
- **Monorepo Build System**: [Turborepo](https://turbo.build) for parallel builds and caching.
- **Frontend App (`apps/starter`)**: [React 19](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS v4](https://tailwindcss.com), [TanStack Router](https://tanstack.com/router) (file-based routing), and [TanStack Query](https://tanstack.com/query).
- **Backend API (`apps/backend`)**: [Express 5](https://expressjs.com), [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL, [Better Auth](https://www.better-auth.com), and [Scalar API Reference](https://scalar.com) (`/docs`).
- **Core Library (`packages/core`)**: Headless UI v2 primitives, compound sidebar & workspace tabs, and centralized OKLCH theme tokens.
- **Type Library (`packages/types`)**: End-to-end schema validation using [Valibot](https://valibot.dev) shared between backend and frontend.

---

## 🎨 Design System & Styling

### Tailwind CSS v4 & Semantic Design Tokens

- Managed centrally in `@z3/admin-core` ([`packages/core/src/styles/main.css`](file:///Users/leonhong/Personal%20Project/z3-admin/packages/core/src/styles/main.css)).
- Uses **OKLCH color space** for high-contrast, accessible light & dark modes:
  - `--color-primary`, `--color-secondary`, `--color-accent`, `--color-muted`, `--color-destructive`.
  - Custom sidebar dark charcoal tokens (`#171a23`, `#232836`, `#3b82f6`).

### Offline Icon Bundling

- Powered by `unplugin-icons` and `@iconify/json`.
- All 150,000+ Iconify icons (Lucide, Solar, BoxIcons, Tabler, etc.) are bundled at build time with **0 runtime network requests**.

---

## 🧩 UI Components (`@z3/admin-core`)

| Component                               | Description                                                                                                                                                                                                  |
| :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`AdminLayout`**                       | Top-level layout shell wrapping sidebar, header, command palette, and main scroll container.                                                                                                                 |
| **`SideBar`**                           | Collapsible sidebar supporting both **Convenience Props API** and **Compound Components API**.                                                                                                               |
| **`NavItem`**                           | Renders TanStack Router `<Link>` with active route styling, `<NavItem.Action>` slots, and **2-level nested sub-menu navigation** (accordion in expanded mode, Headless UI Popover flyout in collapsed mode). |
| **`CommandSearch`**                     | Interactive command palette modal (`Cmd+K`) supporting auto route indexing, search filtering, and pluggable action registration.                                                                             |
| **`Select`**                            | Feature-rich select & combobox component supporting searchable filtering, multi-select tag chips, async remote data, grouped options, custom renderers, and compound elements.                               |
| **`NativeSelect`**                      | Lightweight native `<select>` dropdown wrapper with consistent design tokens.                                                                                                                                |
| **`Input` / `InputPassword`**           | Accessible form input wrappers with `startIcon`, `endIcon`, password visibility toggle, and `focus-within` styling.                                                                                          |
| **`Field` / `FieldSet` / `FieldLabel`** | Form layout wrappers with automatic required red asterisk indicator and error integration.                                                                                                                   |
| **`Modal` / `ConfirmModal`**            | Accessible dialogs built on Headless UI Dialog with smooth backdrop transitions, compound slots (`Header`, `Body`, `Footer`), and destructive/warning confirm dialogs.                                       |
| **`DataTable`**                         | High-performance table component powered by `@tanstack/react-table` with compound toolbar, search, column visibility toggle, pagination, and text truncation tooltips.                                       |
| **`WorkspaceTabs`**                     | Multi-tab workspace manager with Zustand persistence, tab reordering, close actions, overflow dropdown, and right-click context menu.                                                                        |
| **`ContextMenu`**                       | Viewport-aware popup context menu with portal rendering and keyboard dismiss listeners.                                                                                                                      |
| **`Drawer`**                            | Slide-out sheet panel for side drawers and overlays.                                                                                                                                                         |
| **`Tooltip`**                           | Accessible floating tooltip with portal positioning, automatic overflow-only detection (`showWhenTruncated`), and hover/focus triggers.                                                                      |
| **`Pagination`**                        | Page navigation controls with page numbers, jump buttons, and responsive item counts.                                                                                                                        |
| **`Keyboard`**                          | Keycap component supporting modifier symbols (`⌘`, `⌥`, `⇧`, `ctrl`, `k`).                                                                                                                                   |
| **`Avatar`**                            | User profile avatar with fallback initials and image error handling.                                                                                                                                         |
| **`Toaster` / `toast`**                 | Vibrant Split Hero Glass Pillar notifications with `success`, `error`, `warning`, `info`, and promise toast support.                                                                                         |
| **`ChartContainer` / `ChartTooltip`**   | Accessible responsive chart container wrappers built on Recharts with semantic theme token integration.                                                                                                      |
| **`ThemeSwitch` / `ThemeToggle`**       | Theme mode switchers for toggling dark/light mode.                                                                                                                                                           |

---

## 🧭 Navigation & Router Architecture

`@z3/admin-core` is natively integrated with **TanStack Router** using **File-Based Routing** (`@tanstack/router-plugin`). `<NavItem>` directly renders TanStack's `<Link to={item.path}>` with `activeProps` for automatic active route highlights and route preloading.

### 🌿 Nested Navigation (Sub-menus)

`NavItemConfig` supports 2-level nested sub-navigation via the optional `items` field:

```ts
export const navGroups: NavGroupConfig[] = [
  {
    title: "Platform",
    items: [
      { label: "Dashboard", path: "/", icon: DashboardIcon },
      {
        label: "Shop",
        path: "/shop",
        icon: ShopIcon,
        items: [
          { label: "Products", path: "/shop/products", icon: ProductIcon },
          { label: "Categories", path: "/shop/categories", icon: CategoryIcon },
        ],
      },
    ],
  },
];
```

- **Expanded Mode**: Displays an interactive accordion sub-menu with rotatable chevron, active route highlighting, and automatic auto-expansion when a child route is active.
- **Collapsed Mode**: Displays a floating Headless UI `Popover` flyout sub-menu on hover/click.

### 1. Convenience Props API (Fast Setup)

For 90% of standard admin apps, pass `navGroups`, `user`, and `onSignOut` directly to `<AdminLayout>`:

```tsx
import { AdminLayout } from "@z3/admin-core";
import { Outlet } from "@tanstack/react-router";
import { navGroups } from "./config/navigation";

export default function App() {
  return (
    <AdminLayout
      title="ZeroUI Admin"
      navGroups={navGroups}
      user={{
        name: "Leon Alvarez",
        email: "leon@zeroui.com",
      }}
      onSignOut={() => alert("Signed out successfully!")}
    >
      <Outlet />
    </AdminLayout>
  );
}
```

### 2. Compound Components API (Custom Sidebar)

For applications requiring custom widgets (such as organization switchers or storage progress bars), compose `<SideBar>` compound components:

```tsx
import { AdminLayout, SideBar } from "@z3/admin-core";
import { Outlet } from "@tanstack/react-router";
import ShieldIcon from "~icons/solar/shield-bold";

export function CustomApp() {
  return (
    <AdminLayout
      sidebar={
        <SideBar>
          {/* Custom Header */}
          <SideBar.Header title="Acme Enterprise" />

          {/* Navigation */}
          <SideBar.Nav groups={navGroups} />

          {/* Custom Footer with Org Switcher & Storage Meter */}
          <SideBar.Footer>
            <div className="px-3 py-2">
              <div className="rounded-lg bg-accent/40 p-2 text-xs flex items-center gap-2">
                <ShieldIcon className="size-4 text-primary" />
                <span className="font-semibold">Acme Corp (PRO)</span>
              </div>
            </div>
            <SideBar.UserMenu
              user={{ name: "Leon Alvarez", email: "leon@acme.com" }}
              onSignOut={() => alert("Signed out!")}
            />
          </SideBar.Footer>
        </SideBar>
      }
    >
      <Outlet />
    </AdminLayout>
  );
}
```

---

## 🔍 Command Search Palette (Cmd+K)

`@z3/admin-core` includes a built-in, accessible Command Search palette powered by `@headlessui/react` (`Dialog` and `Combobox`). It opens via global keyboard shortcut (`Cmd+K` / `Ctrl+K`) or by clicking the sidebar search bar.

### Features

- **Auto Route Indexing**: Automatically indexes all routes from `navGroups` / `navItems` with category breadcrumbs (e.g. `Shop > Products`).
- **System Actions**: Built-in dark/light mode toggle and sign-out actions.
- **Keyboard Navigation**: Native arrow key navigation (`↑`, `↓`), selection (`Enter`), and exit (`Esc`).

### Pluggable Custom Commands API

You can extend the command search with custom actions in two ways:

#### 1. Layout-Scoped (via `AdminLayout` props)

Pass custom command items or groups to `<AdminLayout />`:

```tsx
import { AdminLayout } from "@z3/admin-core";
import PlusIcon from "~icons/solar/add-circle-bold";

export function App() {
  return (
    <AdminLayout
      navGroups={navGroups}
      commandItems={[
        {
          id: "create-invoice",
          label: "Create New Invoice",
          category: "Actions",
          icon: <PlusIcon className="size-4" />,
          onSelect: () => openCreateInvoiceModal(),
          shortcut: ["cmd", "n"],
        },
      ]}
    >
      <Outlet />
    </AdminLayout>
  );
}
```

#### 2. Component-Scoped (via `useRegisterCommands()` hook)

Dynamically register actions inside any route or component. Commands automatically register when mounted and clean up when unmounted:

```tsx
import { useRegisterCommands } from "@z3/admin-core";
import DownloadIcon from "~icons/solar/download-bold";

export function ProductsPage() {
  useRegisterCommands([
    {
      id: "export-products-csv",
      label: "Export Products to CSV",
      category: "Product Actions",
      icon: <DownloadIcon className="size-4" />,
      onSelect: () => handleExportCSV(),
      shortcut: ["shift", "e"],
    },
  ]);

  return <div>Products Management</div>;
}
```

---

## 🔽 Select Component (`@z3/admin-core`)

`<Select>` is a fully accessible, high-performance dropdown and combobox component built on `@headlessui/react` v2. It eliminates the limitations of native `<select>` elements and custom dropdowns by unifying search filtering, multi-select tag chips, async remote data loading, grouped options, and compound markup.

### 🌟 Key Highlights

- **Single & Multi-Select**: Seamless switching with `multiple={true}` and chip badges with remove buttons.
- **Searchable Combobox**: Live client-side filtering across labels, descriptions, and custom keywords (`searchable={true}`).
- **Async Remote Data**: Built-in debounced fetching (`loadOptions`) with automatic spinner indicators.
- **Rich Option Items**: Support for leading icons (`icon`), subtitles (`description`), and search `keywords`.
- **Compound Components**: Build custom menus using `<Select.Option>`, `<Select.Group>`, `<Select.Label>`, and `<Select.Separator>`.
- **Design Token Integration**: Native OKLCH dark/light theme support, `input-focus` glow rings, and smooth scroll fade masks.
- **Accessible & Form Ready**: Compatible with `<Field>`, `<FieldLabel>`, `<FieldError>`, and `@tanstack/react-form`.

---

### 1. Basic Single Select

Supports structured option objects (`SelectOption<T>`) or primitive strings/numbers:

```tsx
import { useState } from "react";
import { Select, type SelectOption } from "@z3/admin-core";

const fruitOptions: SelectOption<string>[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
  { value: "grape", label: "Grape", disabled: true },
];

export function BasicSelectDemo() {
  const [fruit, setFruit] = useState("apple");

  return (
    <Select
      options={fruitOptions}
      value={fruit}
      onChange={(val) => setFruit(val)}
      placeholder="Select a fruit..."
      clearable
    />
  );
}
```

> **Tip:** You can also pass primitive arrays directly: `options={["Active", "Pending", "Archived"]}`.

---

### 2. Searchable Combobox Mode

Enable `searchable={true}` to turn the select trigger into a live-filtering search input with instant keyboard autocomplete:

```tsx
import { Select } from "@z3/admin-core";

const countryOptions = [
  {
    value: "us",
    label: "United States",
    description: "North America",
    keywords: ["usa", "america"],
  },
  {
    value: "de",
    label: "Germany",
    description: "Europe",
    keywords: ["deutschland", "berlin"],
  },
  {
    value: "jp",
    label: "Japan",
    description: "Asia",
    keywords: ["tokyo", "nihon"],
  },
  {
    value: "id",
    label: "Indonesia",
    description: "Southeast Asia",
    keywords: ["jakarta", "bali"],
  },
];

export function SearchableSelectDemo() {
  return (
    <Select
      searchable
      clearable
      options={countryOptions}
      placeholder="Search countries by name, continent, or keyword..."
      onChange={(value, option) => console.log("Selected:", value, option)}
    />
  );
}
```

---

### 3. Multi-Select (Tag / Chip Mode)

Enable `multiple={true}` to allow selecting multiple values. Selected items appear as removable tag chips:

```tsx
import { useState } from "react";
import { Select } from "@z3/admin-core";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "billing", label: "Billing Manager" },
];

export function MultiSelectDemo() {
  const [roles, setRoles] = useState<string[]>(["editor", "viewer"]);

  return (
    <Select
      multiple
      searchable
      clearable
      options={roleOptions}
      value={roles}
      onChange={(val) => setRoles(val)}
      placeholder="Assign roles..."
    />
  );
}
```

---

### 4. Async Remote Options (`loadOptions`)

Fetch options on-the-fly from a backend API or search endpoint. Includes automatic debouncing (default: 250ms) and loading spinner:

```tsx
import { Select } from "@z3/admin-core";

export function AsyncSelectDemo() {
  return (
    <Select
      searchable
      placeholder="Search users from API..."
      debounceMs={300}
      loadOptions={async (query) => {
        const response = await fetch(
          `/api/users?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        return data.users.map((user: any) => ({
          value: user.id,
          label: user.name,
          description: user.email,
        }));
      }}
      onChange={(userId) => console.log("Selected User ID:", userId)}
    />
  );
}
```

---

### 5. Grouped Options & Icons

Group related options and render custom leading icons for each item or the select trigger:

```tsx
import { Select, type SelectGroup } from "@z3/admin-core";
import AppleIcon from "~icons/solar/apple-bold";
import CupIcon from "~icons/solar/cup-bold";

const groupedMenu: SelectGroup[] = [
  {
    group: "Fresh Fruits",
    options: [
      {
        value: "apple",
        label: "Honeycrisp Apple",
        icon: <AppleIcon className="size-4 text-red-500" />,
      },
      { value: "banana", label: "Cavendish Banana", description: "Organic" },
    ],
  },
  {
    group: "Beverages",
    options: [
      {
        value: "coffee",
        label: "Espresso Roast",
        icon: <CupIcon className="size-4 text-amber-600" />,
      },
      { value: "tea", label: "Green Tea" },
    ],
  },
];

export function GroupedSelectDemo() {
  return (
    <Select options={groupedMenu} placeholder="Choose menu item..." clearable />
  );
}
```

---

### 6. Form Integration with `<Field>` & Validation

Wrap `<Select>` inside `@z3/admin-core`'s `<Field>` or connect with `@tanstack/react-form`:

```tsx
import { Field, FieldLabel, FieldError, Select } from "@z3/admin-core";

export function FormSelectExample({ field }: { field: any }) {
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <Field required>
      <FieldLabel>Product Category</FieldLabel>
      <Select
        searchable
        options={[
          { value: "electronics", label: "Electronics" },
          { value: "apparel", label: "Apparel & Fashion" },
          { value: "home", label: "Home & Garden" },
        ]}
        value={field.state.value}
        onChange={(val) => field.handleChange(val)}
        invalid={isInvalid}
        placeholder="Select category..."
      />
      {isInvalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
    </Field>
  );
}
```

---

### 7. Compound Components API

For fully customized menus, you can declare options directly as JSX children:

```tsx
import { Select } from "@z3/admin-core";

export function CustomCompoundSelect() {
  return (
    <Select defaultValue="medium" placeholder="Select priority...">
      <Select.Group>
        <Select.Label>Ticket Priority</Select.Label>
        <Select.Option value="low">🟢 Low Priority</Select.Option>
        <Select.Option value="medium">🟡 Medium Priority</Select.Option>
        <Select.Option value="high">🔴 High Priority</Select.Option>
      </Select.Group>
      <Select.Separator />
      <Select.Group>
        <Select.Label>Urgent Escalation</Select.Label>
        <Select.Option value="critical">🔥 Critical Incident</Select.Option>
      </Select.Group>
    </Select>
  );
}
```

---

### 8. API Reference

#### `SelectProps<T>`

| Prop                    | Type                                 | Default                 | Description                                                   |
| :---------------------- | :----------------------------------- | :---------------------- | :------------------------------------------------------------ |
| `options`               | `RawSelectOption<T>[]`               | `[]`                    | Array of options, groups, or primitive strings/numbers.       |
| `value`                 | `any`                                | `undefined`             | Controlled selected value (or array of values if `multiple`). |
| `defaultValue`          | `any`                                | `undefined`             | Initial value for uncontrolled usage.                         |
| `onChange`              | `(value: any, option?: any) => void` | `undefined`             | Callback fired when selection changes.                        |
| `searchable`            | `boolean`                            | `false`                 | Enables combobox input mode for live keyword filtering.       |
| `multiple`              | `boolean`                            | `false`                 | Enables multi-select mode with tag badges.                    |
| `clearable`             | `boolean`                            | `false`                 | Displays a clear button (`x`) when a value is selected.       |
| `loadOptions`           | `(query: string) => Promise<...>`    | `undefined`             | Async function to fetch options dynamically on query change.  |
| `debounceMs`            | `number`                             | `250`                   | Debounce delay in ms for `loadOptions`.                       |
| `loading` / `isLoading` | `boolean`                            | `false`                 | Shows a loading spinner in the trigger.                       |
| `placeholder`           | `string`                             | `"Select an option..."` | Placeholder text when no value is selected.                   |
| `startIcon`             | `ReactNode`                          | `undefined`             | Leading icon slot inside the trigger input.                   |
| `endIcon`               | `ReactNode`                          | `<ChevronDownIcon />`   | Trailing icon slot.                                           |
| `sizeVariant`           | `"sm" \| "md" \| "lg"`               | `"md"`                  | Trigger height and typography size variant.                   |
| `invalid`               | `boolean`                            | `false`                 | Applies destructive error border and ring styling.            |
| `disabled`              | `boolean`                            | `false`                 | Disables interaction and dims the component.                  |
| `filterOption`          | `(opt, query) => boolean`            | `undefined`             | Custom filter function for client-side search.                |
| `renderOption`          | `(opt, state) => ReactNode`          | `undefined`             | Custom render function for dropdown items.                    |
| `renderValue`           | `(val, selectedOpt) => ReactNode`    | `undefined`             | Custom render function for the trigger's selected value.      |
| `containerClassName`    | `string`                             | `undefined`             | Tailwind classes for the outer wrapper `div`.                 |
| `className`             | `string`                             | `undefined`             | Tailwind classes for the select trigger button/input.         |
| `dropdownClassName`     | `string`                             | `undefined`             | Tailwind classes for the floating dropdown menu.              |

#### `SelectOption<T>`

| Property      | Type                   | Description                                               |
| :------------ | :--------------------- | :-------------------------------------------------------- |
| `value`       | `T` (required)         | Unique value of the option.                               |
| `label`       | `ReactNode` (required) | Primary title displayed for the option.                   |
| `description` | `ReactNode`            | Secondary subtitle or helper text.                        |
| `icon`        | `ReactNode`            | Leading icon element for the option.                      |
| `disabled`    | `boolean`              | Prevents selection if `true`.                             |
| `keywords`    | `string[]`             | Additional search search terms used for client filtering. |

---

## 🗄️ Database & Container (`docker-compose.yml`)

The backend requires a PostgreSQL database managed through **Drizzle ORM**. A turnkey PostgreSQL 16 Alpine container configuration is provided at the repository root ([`docker-compose.yml`](file:///Users/leonhong/Personal%20Project/z3-admin/docker-compose.yml)).

### Quick Database Commands

```bash
# Start PostgreSQL container in background (port 5432)
bun docker:up
# or: docker compose up -d

# Run Drizzle database migrations
bun db:migrate

# Seed initial admin & standard accounts
bun db:seed

# Inspect database schema with Drizzle Studio
bun --cwd apps/backend studio

# Reset database (drops all tables & enum types)
bun db:reset

# Stop PostgreSQL container
bun docker:down
# or: docker compose down
```

---

## 🔑 Default Seed Accounts

Running `bun db:seed` provisions three pre-configured accounts from [`apps/backend/src/db/seed.ts`](file:///Users/leonhong/Personal%20Project/z3-admin/apps/backend/src/db/seed.ts) with Better Auth credentials:

| Role              | Role Value (`USER_ROLE`) | Email                    | Password   | Permissions & Capabilities                                               |
| :---------------- | :----------------------- | :----------------------- | :--------- | :----------------------------------------------------------------------- |
| **Super Admin**   | `superAdmin`             | `superadmin@example.com` | `12345678` | Full unrestricted access, role promotion/demotion, system configurations |
| **Admin**         | `admin`                  | `admin@example.com`      | `12345678` | User management, product/order catalog administration                    |
| **Standard User** | `user`                   | `user@example.com`       | `12345678` | Standard authenticated profile access                                    |

---

## ⚡ Backend API & Interactive Documentation (`apps/backend`)

The backend is built with **Express 5**, **Better Auth**, and **Drizzle ORM**, following a clean Controller / Service / Repository pattern.

- **Server Port**: `3333` (configurable via `.env`)
- **API Base URL**: `http://localhost:3333/api`
- **Interactive Scalar API Docs**: Open [http://localhost:3333/docs](http://localhost:3333/docs) in your browser while the backend is running to view live OpenAPI 3.0 specs, test endpoints, and inspect payload schemas.

---

## 🛠️ Development & Quickstart

### Option A: Create New Project via CLI (Recommended)

Generate a clean new project with interactive choice between **Mock Data (Frontend Only)** and **Fullstack Monorepo**:

```bash
# With Bun (recommended)
bun create z3-admin my-admin

# With NPM / NPX
npx create-z3-admin my-admin

# With PNPM
pnpm create z3-admin my-admin
```

---

### Option B: Clone & Setup Wizard

```bash
# 1. Clone repository and install dependencies
git clone https://github.com/LeonAlvarezz/admin-template.git
cd admin-template
bun install

# 2. Run interactive setup wizard (configures .env and DB based on your mode)
bun run setup
```

---

### Option C: Manual Setup

#### 1. Frontend-Only Mode (Mock Data)
No Docker, PostgreSQL, or backend required. Runs with stateful in-memory CRUD:

```bash
cp apps/starter/.env.example apps/starter/.env
# Set VITE_ENABLE_MOCK=true in apps/starter/.env
bun run dev:mock
```

#### 2. Fullstack Mode (Express API + Drizzle ORM + PostgreSQL)

```bash
# 1. Configure environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/starter/.env.example apps/starter/.env

# 2. Start PostgreSQL container & run migrations
bun docker:up
bun db:migrate
bun db:seed

# 3. Run full stack in parallel
bun run dev
```

### Running Applications & Verification

```bash
# Run standalone frontend (Mock mode)
bun run dev:mock

# Run full stack in parallel (Backend on :3333, Frontend on :5173)
bun run dev

# Or run individual apps:
bun run dev:backend     # Backend API
bun run dev:frontend    # Frontend UI
```

### 4. Verification & Quality Checks

```bash
# Type check all packages and applications
bun run check-types

# Lint codebase
bun run lint

# Run all tests
bun run test

# Build all applications for production
bun run build
```

---

## Production Containers

Build both images from the repository root. The frontend API URL is public build-time configuration:

```bash
docker build \
  -f apps/starter/Dockerfile \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t z3-admin-frontend .

docker build \
  -f apps/backend/Dockerfile \
  -t z3-admin-backend .
```

Deploy the frontend and backend on HTTPS origins such as `https://admin.example.com` and `https://api.example.com`. Configure the backend with:

```dotenv
NODE_ENV=production
PORT=3333
CORS_ORIGINS=https://admin.example.com
TRUST_PROXY_HOPS=1
```

`CORS_ORIGINS` accepts a comma-separated list of exact origins. Do not use `*` with credentialed requests. `TRUST_PROXY_HOPS=1` assumes one controlled reverse proxy that overwrites forwarded headers; use `0` when the API is directly exposed.

The frontend sends requests with credentials, and Better Auth uses the same validated `CORS_ORIGINS` allowlist. Keep production cookie attributes aligned with the deployed HTTPS domains. Sibling subdomains are cross-origin but same-site; unrelated top-level domains require an explicit `SameSite=None; Secure` and CSRF review.

Run migrations as a separate release step before starting the new backend image:

```bash
bun run db:migrate
```

Health endpoints:

- Backend: `GET /api/health-check`

TLS certificates, HSTS policy, DNS, secrets, image publishing, and rollout orchestration belong to the deployment platform and are intentionally outside these images.

---

## 📄 License

MIT

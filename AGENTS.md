# Repository Guidelines & Coding Rules

## 1. Component Reusability & Pre-Coding Protocol (MANDATORY)

Before generating or refactoring any front-end UI code, agents **MUST** inspect `@z3/admin-core` (`packages/core/src/components/ui` and `packages/core/src/components`) to verify whether a reusable UI component already exists.

### Rules of Engagement

1. **Pre-Coding Discovery Step**:
   - Check `packages/core/src/index.ts` and `packages/core/src/components/ui` before creating any UI elements.
   - Do **NOT** default to raw HTML elements (`<button>`, `<input>`, `<select>`, `<table...>`, raw dialog/modal divs, custom `<label>`, custom tooltips, etc.) when a component exists in `@z3/admin-core`.

2. **Reuse Existing Components**:
   - **Buttons**: Use `<Button>` from `@z3/admin-core` instead of `<button>`.
   - **Text Inputs**: Use `<Input>` or `<Input.Password>` / `<InputPassword>` from `@z3/admin-core` instead of `<input type="text|password">`.
   - **Dropdown / Select**: Use `<NativeSelect>` from `@z3/admin-core` instead of `<select>`.
   - **Checkboxes**: Use `<Checkbox>` from `@z3/admin-core` instead of `<input type="checkbox">`.
   - **Forms & Fields**: Use `<Field>`, `<FieldSet>`, `<FieldGroup>`, `<FieldLabel>`, `<FieldError>` from `@z3/admin-core` instead of raw `<label>` or standard field wrapper `div`s.
   - **Tables**: Use `<DataTable>` compound components (`DataTable`, `DataTable.Toolbar`, `DataTable.ColumnHeader`, `DataTable.Pagination`, `DataTable.ViewOptions`) from `@z3/admin-core` instead of raw `<table>` or custom table structures.
   - **Dialogs & Sheets**: Use `<Drawer>` from `@z3/admin-core` instead of raw fixed overlays or custom drawer divs.
   - **Tooltips**: Use `<Tooltip>` from `@z3/admin-core` instead of custom inline hover titles or tooltips.
   - **Pagination**: Use `<Pagination>` from `@z3/admin-core` instead of custom page number lists.
   - **Keyboard Shortcuts**: Use `<Keyboard>` from `@z3/admin-core` instead of raw `<kbd>`.
   - **Avatars**: Use `<Avatar>` from `@z3/admin-core` instead of custom image wrappers for user profiles.
   - **Notifications**: Use `toast` / `<Toaster>` from `@z3/admin-core` instead of custom inline alerts or native `alert()`.
   - **Charts**: Use `<ChartContainer>`, `<ChartTooltip>`, `<ChartTooltipContent>` from `@z3/admin-core`.
   - **Skeletons & Loading States**: Use `<Skeleton>` from `@z3/admin-core` instead of ad-hoc animated pulse divs. For tables, pass `loading` directly to `<DataTable>`.

3. **Extending Components (No Fragmented Custom Code)**:
   - If an existing `@z3/admin-core` component lacks a required prop, size, variant, or feature, **extend the component in `@z3/admin-core`** first.
   - Do **NOT** bypass `@z3/admin-core` by writing inline HTML primitives or duplicating component logic inside feature modules in `apps/starter`.

4. **Styling & Token Consistency**:
   - Always use theme tokens from `packages/core/src/styles/main.css` (`bg-accent`, `text-accent-foreground`, `bg-card`, `bg-popover`, `border-border`, etc.).
   - Preserve hover/focus state conventions standardized across `@z3/admin-core` (`bg-accent text-accent-foreground`).

---

## 2. Utility Functions & Helpers Protocol (MANDATORY)

To prevent fragmented, duplicated, and scattered utility functions across feature directories:

### Rules of Engagement

1. **Zero Scattered Utils**:
   - **NEVER** create ad-hoc helper files (e.g. `utils/`, `helpers.ts`, `format.ts`) inside feature folders in `apps/starter/src/modules/`.
   - **NEVER** write inline `new Intl.NumberFormat(...)`, `new Intl.DateTimeFormat(...)`, ad-hoc slugifiers, clipboard functions, or custom class joiners inside page components.

2. **Pre-Coding Utils Discovery**:
   - Always check `packages/core/src/utils/index.ts` and the **Utils Reference Map** below before creating any helper functions.
   - Import shared utilities directly from `@z3/admin-core` (e.g. `import { cn, formatCurrency, formatDate, copyToClipboard } from "@z3/admin-core"`).

3. **Centralized Utility Extension**:
   - If a new general utility or formatter is needed, add it to `packages/core/src/utils/` (`formatters.ts`, `string.ts`, `dom.ts`, etc.) and export it from `packages/core/src/utils/index.ts` and `packages/core/src/index.ts`.
   - Add the newly created utility to the **Utils Reference Map** in this file (`AGENTS.md`).

---

## 3. UI & Component Design Conventions (MANDATORY)

To prevent recurring design inconsistencies across views:

### Rules of Engagement

1. **Modal Header & Footer (Zero Divider Borders)**:
   - **NEVER** add `border-t` or `border-b` dividers to `<ModalHeader>` or `<ModalFooter>`.
   - Maintain clean vertical spacing via padding only (e.g. `<ModalHeader className="pb-3">` and `<ModalFooter className="pt-3 flex justify-end gap-2">`).
   - Canonical reference: `apps/starter/src/modules/seo-partner/components/seo-partner-modal.tsx`.

2. **Table Properties Button & Toolbar (Detached Shell)**:
   - The "Properties" button (`DataTable.ViewOptions` / column toggle) and table toolbar actions must remain **detached** from the table container.
   - **NEVER** package the Properties button or table toolbar inside a box sharing the table's card background (`bg-card` with borders). Always place it in an unbordered, detached toolbar row (`<DataTable.Toolbar>` or detached row above `<DataTable>`).

3. **Empty State Description Copy (Ultra-Concise)**:
   - When rendering empty guidance screens, placeholder states, or zero-result tables, descriptions must **NEVER** be wordy or overly verbose.
   - Strict limit: **Max 1 paragraph, strictly 2 lines or fewer**. Be direct, action-oriented, and punchy.

4. **Never Use Native `<button>` Primitives (Strict Rule)**:
   - **NEVER** use raw HTML `<button>` elements anywhere in feature pages, components, dialogs, or tables.
   - **ALWAYS** import and use `<Button>` from `@z3/admin-core` with standardized variants (`default`, `outline`, `ghost`, `secondary`, `destructive`) and sizes (`sm`, `md`, `lg`).

---

## Workspace Quick Reference Map

### UI Components (`@z3/admin-core`)

| UI Primitives & Core Components               | Export Path (`@z3/admin-core`)                                     | Source File                                          |
| :-------------------------------------------- | :-------------------------------------------------------------- | :--------------------------------------------------- |
| `<Button>`                                    | `import { Button } from "@z3/admin-core"`                          | `packages/core/src/components/ui/button.tsx`         |
| `<Input>`, `<InputPassword>`                  | `import { Input, InputPassword } from "@z3/admin-core"`            | `packages/core/src/components/ui/input.tsx`          |
| `<Textarea>`                                  | `import { Textarea } from "@z3/admin-core"`                        | `packages/core/src/components/ui/textarea.tsx`       |
| `<Checkbox>`                                  | `import { Checkbox } from "@z3/admin-core"`                        | `packages/core/src/components/ui/checkbox.tsx`       |
| `<NativeSelect>`                              | `import { NativeSelect } from "@z3/admin-core"`                    | `packages/core/src/components/ui/native-select.tsx`  |
| `<Select>`, `<Select.Option>`                 | `import { Select } from "@z3/admin-core"`                          | `packages/core/src/components/ui/select.tsx`         |
| `<Field>`, `<FieldSet>`, `<FieldLabel>`       | `import { Field, FieldSet, FieldLabel } from "@z3/admin-core"`     | `packages/core/src/components/ui/field.tsx`          |
| `<Tooltip>`                                   | `import { Tooltip } from "@z3/admin-core"`                         | `packages/core/src/components/ui/tooltip.tsx`        |
| `<DataTable>`                                 | `import { DataTable } from "@z3/admin-core"`                       | `packages/core/src/components/ui/data-table/`        |
| `<Drawer>`                                    | `import { Drawer } from "@z3/admin-core"`                          | `packages/core/src/components/ui/drawer.tsx`         |
| `<Pagination>`                                | `import { Pagination } from "@z3/admin-core"`                      | `packages/core/src/components/ui/pagination.tsx`     |
| `<Keyboard>`                                  | `import { Keyboard } from "@z3/admin-core"`                        | `packages/core/src/components/ui/keyboard.tsx`       |
| `<Avatar>`, `<Avatar.Simple1>`, `<Avatar.Simple2>`, `AVATAR_1`, `AVATAR_2` | `import { Avatar, AVATAR_1, AVATAR_2 } from "@z3/admin-core"`     | `packages/core/src/components/ui/avatar.tsx`         |
| `<Toaster>`, `toast`                          | `import { Toaster, toast } from "@z3/admin-core"`                  | `packages/core/src/components/ui/toaster.tsx`        |
| `<ChartContainer>`, `<ChartTooltip>`          | `import { ChartContainer, ChartTooltip } from "@z3/admin-core"`    | `packages/core/src/components/ui/chart.tsx`          |
| `<CommandSearch>`                             | `import { CommandSearch } from "@z3/admin-core"`                   | `packages/core/src/components/ui/command-search.tsx` |
| `<ContextMenu>`                               | `import { ContextMenu } from "@z3/admin-core"`                     | `packages/core/src/components/ui/context-menu.tsx`   |
| `<WorkspaceTabs>`                             | `import { WorkspaceTabs } from "@z3/admin-core"`                   | `packages/core/src/components/workspace-tabs.tsx`    |
| `<Modal>`, `<Modal.Header>`, `<Modal.Footer>` | `import { Modal, ModalHeader, ModalFooter } from "@z3/admin-core"` | `packages/core/src/components/ui/modal.tsx`          |
| `<ConfirmModal>`                              | `import { ConfirmModal } from "@z3/admin-core"`                    | `packages/core/src/components/ui/confirm-modal.tsx`  |
| `<Tag>`                                       | `import { Tag } from "@z3/admin-core"`                             | `packages/core/src/components/ui/tag.tsx`            |
| `<NumberStepper>`, `<Stepper>`                | `import { NumberStepper, Stepper } from "@z3/admin-core"`          | `packages/core/src/components/ui/number-stepper.tsx` |
| `<NotFound>`                                  | `import { NotFound } from "@z3/admin-core"`                        | `packages/core/src/components/ui/not-found.tsx`      |
| `<Unauthorized>`                              | `import { Unauthorized } from "@z3/admin-core"`                    | `packages/core/src/components/ui/unauthorized.tsx`   |
| `<ErrorState>`                                | `import { ErrorState } from "@z3/admin-core"`                      | `packages/core/src/components/ui/error-state.tsx`     |
| `<Switch>`                                    | `import { Switch } from "@z3/admin-core"`                          | `packages/core/src/components/ui/switch.tsx`         |
| `<Skeleton>`                                  | `import { Skeleton } from "@z3/admin-core"`                        | `packages/core/src/components/ui/skeleton.tsx`       |
| `<Card>`, `<Card.Header>`, `<Card.Content>`   | `import { Card } from "@z3/admin-core"`                            | `packages/core/src/components/ui/card.tsx`           |
| `<Upload>`, `<FileUpload>`                    | `import { Upload, FileUpload } from "@z3/admin-core"`              | `packages/core/src/components/ui/Upload.tsx`         |
| `<SideBar>`, `<NavItem>`                      | `import { SideBar, NavItem } from "@z3/admin-core"`                | `packages/core/src/components/sidebar.tsx`           |
| `<Collapsible>`                               | `import { Collapsible } from "@z3/admin-core"`                     | `packages/core/src/components/ui/collapsible.tsx`    |

### Shared Utilities & Helpers (`@z3/admin-core`)

| Utility Function                   | Description                                           | Example Usage                                                | Source File                             |
| :--------------------------------- | :---------------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------- |
| `cn(...classes)`                   | Tailwind CSS class merge + conditional joiner         | `cn("p-4", isDark && "bg-black")`                            | `packages/core/src/utils/cn.ts`         |
| `formatCurrency(val, opts?)`       | Localized currency formatting (USD, EUR, etc.)        | `formatCurrency(129.99, { currency: "USD" })`                | `packages/core/src/utils/formatters.ts` |
| `formatNumber(val, opts?)`         | Localized number formatting with notation (e.g. 1.2K) | `formatNumber(12500, { notation: "compact" })`               | `packages/core/src/utils/formatters.ts` |
| `formatDate(date, opts?, locale?)` | Localized date formatting                             | `formatDate(new Date(), { month: "short", day: "numeric" })` | `packages/core/src/utils/formatters.ts` |
| `formatRelativeTime(date, base?)`  | Relative human-readable time ("5 mins ago")           | `formatRelativeTime("2026-08-24T10:00:00Z")`                 | `packages/core/src/utils/formatters.ts` |
| `formatFileSize(bytes, dec?)`      | Human-readable file sizes ("1.5 MB")                  | `formatFileSize(1548576)`                                    | `packages/core/src/utils/formatters.ts` |
| `slugify(text)`                    | Converts text to URL-friendly slug                    | `slugify("Wireless Noise Canceling")`                        | `packages/core/src/utils/string.ts`     |
| `capitalize(text)`                 | Capitalizes first letter of string                    | `capitalize("active")`                                       | `packages/core/src/utils/string.ts`     |
| `truncate(text, max, suffix?)`     | Truncates string with trailing ellipsis               | `truncate(productName, 30)`                                  | `packages/core/src/utils/string.ts`     |
| `countWords(text)`                 | Counts words in a string by whitespace delimiters     | `countWords("Hello world")`                                  | `packages/core/src/utils/string.ts`     |
| `copyToClipboard(text)`            | Asynchronous clipboard copy with fallback             | `await copyToClipboard("SKU-12345")`                         | `packages/core/src/utils/dom.ts`        |
| `normalizeAccept(accept)`          | Normalizes file presets, extensions, and array inputs | `normalizeAccept(["image", ".pdf"])`                         | `packages/core/src/utils/file.ts`       |
| `filterNavByRole(groups, role?)`   | Filters navigation groups and nested items by role    | `filterNavByRole(navGroups, user?.role)`                      | `packages/core/src/utils/navigation.ts` |
| `hasRequiredRole(role, allowed?)`  | Checks if user role satisfies allowed roles           | `hasRequiredRole(user?.role, ["super_admin"])`                | `packages/core/src/utils/navigation.ts` |

### Shared Hooks (`@z3/admin-core`)

| Hook                                                | Description                                                                                                  | Example Usage                                                                                                                                           | Source File                                    |
| `useTableQuery(opts?)`                              | Unified client/server table pagination & filter coordinator with automatic page reset and URL synchronization | `const table = useTableQuery({ mode: "server", defaultPageSize: 10 }); const { data } = useEmails(table.queryParams); return <DataTable {...table.paginationProps(data?.meta)} />` | `packages/core/src/hooks/use-table-query.ts`   |
| `useQueryFilters(opts?)` / `useTableFilters(opts?)` | Bidirectional URL search query and filter state management with debounced search and clean parameter pruning | `const { filters, searchValue, setSearchValue, setFilter, resetFilters, isFiltered } = useQueryFilters({ defaultValues: { search: "", role: "all" } })` | `packages/core/src/hooks/use-query-filters.ts` |
| `useDebounce(val, delay?)`                          | Debounces any rapidly changing value by specified milliseconds (default 300ms)                               | `const debouncedSearch = useDebounce(searchTerm, 300)`                                                                                                  | `packages/core/src/hooks/use-debounce.ts`      |
| `useActiveUrl()`                                    | Detects active path and matches route patterns with router/location fallback                                 | `const { isActivePath } = useActiveUrl()`                                                                                                               | `packages/core/src/hooks/active-url.ts`        |
| `useTheme()`                                        | Manages dark/light theme state and root document attribute                                                   | `const { theme, toggleTheme } = useTheme()`                                                                                                             | `packages/core/src/hooks/theme.tsx`            |

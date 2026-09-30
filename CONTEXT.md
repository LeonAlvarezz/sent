# Outreach & Email Engine (Sent)

Outreach automation and contact management platform supporting rapid 1-to-1 personalized SEO outreach and bulk audience campaigns.

## Language

**Contact**:
An individual recipient identified by an email address and contextual attributes.
_Avoid_: Lead, target person, prospect person

**Contact List**:
A named collection of Contacts imported via file (CSV/spreadsheet) or added manually.
_Avoid_: Audience bucket, contact group, address book

**Quick Outreach**:
An assisted 1-to-1 workflow where a user inputs prospect context to generate an AI draft and send immediately.
_Avoid_: Manual email, single blast

**Bulk Campaign**:
A 1-to-many scheduled batch delivery of templated emails across an entire Contact List.
_Avoid_: Mass blast, bulk blast

**Sender Identity**:
The authenticated mailbox (SMTP or Google/Microsoft OAuth) used to dispatch emails.
_Avoid_: Mail account, from-address config

**Outreach Draft**:
A message generated via AI or template awaiting user review before dispatch.
_Avoid_: Mail copy, pre-send

**Contact Scraper**:
An internal crawler that inspects target domains, contact pages, and mailto links to extract candidate emails.
_Avoid_: Harvester, bot

**Enrichment Provider**:
A third-party fallback service (e.g. Hunter, Apollo) queried when page scraping yields no verified contact.
_Avoid_: Data vendor, email finder

**Pitch Angle**:
The contextual hook or collaboration proposal (e.g. resource link, broken link replacement) provided to the AI draft generator.
_Avoid_: Prompt note, email reason

**Delivery Queue**:
An asynchronous worker pipeline that regulates outbound message dispatch and enforces rate boundaries.
_Avoid_: Mail spool, blast engine

**Drip Interval**:
A randomized time delay applied between consecutive dispatches from a single Sender Identity.
_Avoid_: Sleep time, pause delay

**Daily Limit**:
The maximum volume of outgoing emails allowed for a Sender Identity within a rolling 24-hour window.
_Avoid_: Send quota, mailbox threshold

**Custom Attribute**:
A dynamic key-value field attached to a Contact from file import columns or scraping data, available for template interpolation.
_Avoid_: Metadata field, extra property, tag

**Reply Detection**:
A background process monitoring inbound mailbox messages to correlate replies to outbound threads and update Contact status.
_Avoid_: Inbox scraper, incoming mail check

**Follow-up Rule**:
A time-delayed condition (e.g. 7 days without reply) triggering either an alert notification or an automated follow-up dispatch.
_Avoid_: Chaser, auto-reminder

**Follow-up Action**:
The resolution mechanism when a follow-up rule matures: either an interactive user Alert or an Auto-Send dispatch.
_Avoid_: Follow-up trigger

**Pitch Profile**:
A saved configuration of value propositions, target assets, tone rules, and few-shot examples used to condition AI draft generation.
_Avoid_: Prompt template, AI persona, pitch preset

## UI & Layout Conventions

**Modal Headers & Footers**:
- No top/bottom divider borders (`border-t`, `border-b`).
- Vertical spacing via padding only (`pb-3`, `pt-3`) per `apps/starter/src/modules/seo-partner/components/seo-partner-modal.tsx`.

**Table Properties Button**:
- The "Properties" button (`DataTable.ViewOptions` / column toggle) must be detached from the table container.
- Do not box the toolbar into the same background (`bg-card`) as the table.

**Empty State Descriptions**:
- Concise copy only: maximum 1 paragraph, strictly 2 lines or fewer.
- Avoid long explanatory paragraphs.

**Buttons**:
- Never use native `<button>` primitives anywhere.
- Always use the `<Button>` component from `@z3/admin-core` with appropriate variants (`default`, `outline`, `ghost`, etc.).


# Dynamic JSONB Custom Attributes for Contacts

Contact imports come from varied sources (Ahrefs backlink CSVs with SEO metrics, Apollo/Hunter lead exports, customer B2B sheets). Rather than rigid relational schemas or complex EAV tables, we store domain-specific columns in a Postgres `attributes: jsonb` field on `contacts`. This permits frictionless arbitrary CSV header mapping and variable interpolation (`{{attribute_name}}`) in templates.

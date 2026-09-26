# Hybrid Outbound Email Dispatch Adapter

We support two distinct outreach paradigms: high-touch 1-to-1 cold SEO outreach (requiring personal mailbox inbox placement) and 1-to-many bulk audience delivery (requiring high throughput and queue management). We decided to implement an abstract `EmailSender` adapter supporting both personal inboxes (SMTP / Google OAuth) and transactional ESP APIs (e.g. Resend / SES), rather than coupling to a single provider.

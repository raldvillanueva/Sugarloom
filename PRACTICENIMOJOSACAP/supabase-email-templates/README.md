# Supabase auth emails

The login code, the password-reset code and the sign-up confirmation are
sent by **Supabase**, not by `js/server.js` or the Vercel function — so
they aren't built in `js/order-email.js` and editing code won't change
them. They come from templates stored in the Supabase dashboard, and
these files are what goes in those boxes.

## Putting them in

Supabase dashboard → **Authentication** → **Emails** → *Templates*, then
for each one paste the file over whatever is in the Message body and
Save:

| File | Template in the dashboard | Sent when |
|---|---|---|
| `magic-link.html` | **Magic Link** | `signInWithOtp()` — the code at sign-in (`js/login.js`) *and* the code when resetting a password (`js/forgot.js`) |
| `confirm-signup.html` | **Confirm signup** | `auth.signUp()` — the link a new customer follows (`js/login.js`) |

Subject lines are a separate field above the body:

- Magic Link → `Your SugarLoomPh verification code`
- Confirm signup → `Confirm your SugarLoomPh account`

Both templates are one template in the dashboard but two journeys on the
site, which is why the Magic Link copy says *verification code* rather
than *sign-in code* — the same email has to make sense to someone
resetting their password.

## The placeholders

Supabase substitutes these when it sends; leave them exactly as written,
spaces inside the braces included.

- `{{ .Token }}` — the six digits
- `{{ .ConfirmationURL }}` — the confirm link
- `{{ .Email }}` — the address it was sent to

## Why the HTML looks dated

Inline styles on nested tables, `&#127850;` instead of a cookie
character, no `<style>` block. Gmail strips stylesheets, Outlook renders
through Word and ignores flexbox and grid, and emoji in a raw `.html`
file depend on the charset surviving the paste. The order email in
`js/order-email.js` is written the same way for the same reason.

## What this does *not* change

The sender still reads **Supabase Auth &lt;noreply@mail.app.supabase.io&gt;**.
That address belongs to Supabase's built-in mail service and no template
can change it — it needs custom SMTP under *Authentication → Emails →
SMTP Settings*, pointed at the same Gmail account the order emails use.
Worth knowing before you do: the built-in service is also rate-limited
to a handful of messages per hour, which is fine for a demo and not for
a launch.

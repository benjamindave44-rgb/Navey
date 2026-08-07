# Running Navey

Written for whoever is looking after this next — including a version of you
with no memory of today. Plain language first, file paths second.

## Where things live

| Thing | Where | What it does |
| --- | --- | --- |
| The website | Vercel | Rebuilds and deploys on every push |
| Data, logins, photos | Supabase | Postgres database + file storage |
| The code | GitHub | Also runs the site health check |

## Is the site healthy?

Three answers, in order of effort:

1. **A robot checks on every push.** GitHub opens the homepage, Explore, a real
   shop page and a real city page, and confirms a shop is actually on the shop
   page — not just that the page answered. **If anything breaks, GitHub emails
   the repository owner.** No news is good news.

   It used to also run every 15 minutes on a timer. That timer is switched off:
   every page it opened was rendered fresh on the server, so the monitor was
   spending the hosting allowance the site itself needs. Turn it back on
   (uncomment the `schedule:` lines in `.github/workflows/smoke.yml`) once the
   public pages are cached or the plan is paid. You can always run it by hand
   from the repository's Actions tab.
2. **`/admin/diagnostics`** (sign in as admin). Runs the shop-page database
   query in widening slices and shows which slice fails. Built after an outage
   where every shop page was dead and the error was hidden behind a reference
   number. If shop pages ever look wrong, open this first.
3. **Instant error alerts.** Set `ERROR_WEBHOOK_URL` in Vercel to a Discord or
   Slack webhook and any server error is messaged to you with the real reason.
   Optional; silent if unset.

Run the health check yourself any time: `npm run smoke`.

## Things you will want to change

**Add a tag** (e.g. "Ramen", "Lechon") — one database row, no deploy:

```sql
insert into public.tags (label, icon, tag_group, sort_order)
values ('Ramen', '🍜', 'Food & Drink', 417);
```

Groups: `Vibe`, `Setting`, `Good for`, `Food & Drink`, `Practical`, `Standout`.
`sort_order` decides the position within a group. The icon is the emoji itself.
A new tag stays hidden from browsing until a listing carries it, then it
appears everywhere — including its own page at `/tag/ramen`.

**Add a city** — nothing to do. Add a listing with a new city and
`/city/that-city` appears, sitemapped and linked from the homepage.

**Add a neighbourhood** — fill the "Neighbourhood" field on a listing (BGC,
Poblacion, Salcedo Village). `/area/<city>/<neighbourhood>` appears on its
own, linked from the city page above it. The field suggests districts already
in use; take the suggestion rather than retyping, or the same place ends up
spelled two ways and split across two pages.

The city is in the address on purpose: district names are not unique here.
Makati has a Poblacion and so does Nasugbu, and a bare `/area/poblacion`
would merge two different places into one page.

**Add a kind of place** (e.g. "Bar") — one entry in `src/lib/categories.ts`.
It carries the label and the term search engines are told, together. This was
once copied across eight files; do not scatter it again.

**Change the look** — `src/app/globals.css`:
- `--background` is the page colour. Yellow is the brand, but as a full canvas
  it fights the photos, so it is a warm off-white with the yellow concentrated
  in the header, footer, buttons and the newsletter band.
- `.navey-arch` / `.navey-arch-card` are the corner shapes for every photo
  surface. Currently square. Raising them again is fine, but check that
  captions sitting in the bottom corners survive it — a large radius once ate
  the hero caption.

**Change the logo** — replace `public/navey-icon.png`, then run
`node scripts/make-icons.mjs`. It rebuilds every size with the brand
background and no transparency. Do not hand-crop these: a transparent icon is
what iOS turns black.

**Change upload limits** — `src/lib/upload-limits.ts`. Read by the browser and
the server so they cannot disagree.

## Limits worth knowing

- **Uploads cannot exceed ~4MB per submission.** This is Vercel's, not ours,
  and cannot be raised in settings. Photos are shrunk in the browser first;
  PDFs are not, which is why a long PDF menu fails while photos of the same
  pages succeed. The real fix is uploading straight to Supabase and bypassing
  the server — a moderate piece of work, not yet done.
- **The free Vercel plan includes 4 hours of server time per month**, and the
  project pauses when that runs out. Nearly every public page here is marked
  `force-dynamic`, meaning it is rebuilt for each visitor instead of being
  reused, so anything that opens pages repeatedly — a monitor on a timer, a
  crawler, a load test — costs real allowance. Check Usage → Fluid Active CPU
  in Vercel before adding anything that runs on a schedule.
- **Leaked-password protection is off.** It needs a paid Supabase plan. Turn
  it on when you upgrade: Authentication → Policies.
- **Tag and city pages only exist where there is content.** Deliberate. A page
  promising pastries and listing none is worse than no page.

## Before changing code

```
npm test          # rules for opening hours, slugs, duplicate matching
npx tsc --noEmit  # types
npm run build     # the real check
```

`npm test` and the health check both run automatically on every push.

## Traps that have already bitten once

- **A failed database query used to look like a missing page.** Shop pages
  404'd for every visitor because of an unrelated schema change. Queries now
  throw on error rather than pretending the row is absent, so a fault shows an
  error page and keeps the address valid instead of telling Google the shop is
  gone.
- **`review_reports` links reviews to profiles**, which gives PostgREST two
  routes between them. Any query embedding a review's author must name the
  relationship (`profiles!reviews_user_id_fkey`) or the whole request fails.
- **Opening hours are picked from a list, never typed.** Free text produced
  both `7:00AM` and `6:00 AM`, and anything unparseable is silently dropped
  from what search engines read.
- **The forms and the server both enforce limits.** When you change one, change
  the shared definition, not the copy nearest to hand.

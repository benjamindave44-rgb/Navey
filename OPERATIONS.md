# Running Navey

Written for whoever is looking after this next — including a version of you
with no memory of today. Plain language first, file paths second.

## Where things live

| Thing | Where | What it does |
| --- | --- | --- |
| The website | Vercel | Rebuilds and deploys on every push |
| Data, logins, photos | Supabase | Postgres database + file storage |
| The code | GitHub | Also runs the site health check |

## Did it actually deploy?

**Check Vercel's Deployments list. Nothing else answers this question.**

Between 27 August and 22 September, four production deployments in a row
failed, and the site went on serving the build from 21 August. It looked
completely healthy the entire time, because it *was* healthy — it was simply a
month old.

The health check below did not catch it and could not have. It opens
`www.navey.co` and tests whatever is live, so a green run proves the live site
works, not that the code you just wrote is on it. Treating a passing health
check as proof of a deploy is the specific mistake that hid this for a month.
After any deploy, look at the Deployments list and confirm the top row says
**Ready** against the commit you expected.

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

## Deploy order for migrations 0039 and 0040

**Run the migrations before deploying the code that needs them.** Not the other
way round, and not at the same time.

The app now selects `wifi`, `instagram`, `spot_price_anchors` and the rest. Ask
PostgREST for a column that does not exist and it returns an error, not a null:
listing pages would throw and every grid would render empty. Columns with no
code reading them, by contrast, are completely harmless — so the safe order is
database first, code second, and there is no window where the site is broken.

```
supabase/migrations/0039_practical_amenities_and_contacts.sql
supabase/migrations/0040_one_tap_reactions.sql
```

Both are additive and re-runnable (`if not exists` throughout, policies dropped
before being created). Nothing is renamed or deleted, so nothing existing can
break. Apply them in the Supabase dashboard's SQL editor, or with the CLI.

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

**Fill in the practical fields** — admin listing form, no deploy. Wifi, power
outlets, laptops, aircon, outdoor seating and parking are chips: tap once to
set, tap the same chip again to clear. **Blank is a real answer and the right
one when you have not checked** — the listing shows nothing rather than claiming
there is no wifi, which would send somebody elsewhere and cost the shop a
customer. Two of these also drive filters on Explore: "Can work here" means good
wifi *and* at least a few outlets, and "Aircon" means aircon confirmed present.

**The Instagram handle is the highest-value field on that form.** Every coffee
shop in the country is on Instagram, and without it a listing is a dead end —
the visitor reads it and goes to search Instagram themselves. Paste the handle
or the whole profile URL; either is reduced to a handle on the way in.

**Prices**: two or three real items off the menu board. "₱₱" is true of most of
Metro Manila and tells nobody anything; "Latte ₱170" is the actual answer, and
it is the one thing Google Maps has never shown. A row needs both a name and a
price or it is dropped.

**"Details confirmed"** stamps today's date and the listing says "Details
checked September 2026". Untick it to remove the line. This is the cheapest
credibility on the site — a directory is only worth opening if its hours are
true.

**Photos and menus** are not on the admin form; they live in the owner editor,
and there is now a **Photos & Menu** button at the top of each admin listing
page that opens it. Listings created from the admin are recorded as submitted by
the admin, which is what makes that editor accessible for them.

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
- **City, tag and neighbourhood lists are up to a minute stale.** They are held
  in memory for 60 seconds (`src/lib/memo.ts`) because every page reads them
  and almost nothing changes them. Add a listing in a brand-new city and the
  listing appears at once, but the city may take a minute to show up under
  "Browse by City". Only these public reference lists are cached — never
  anything belonging to a signed-in person.
- **The free Vercel plan includes 4 hours of server time per month**, and the
  project pauses when that runs out. Most public pages are now cached, so a
  repeat visit costs close to nothing — but Explore is not, and it is the page
  crawlers hammer. Check Usage → Fluid Active CPU before adding anything that
  runs on a schedule. A bot once spent three quarters of a month's allowance in
  two days on `/explore?city=<somewhere with no listings>`.
- **Leaked-password protection is off.** It needs a paid Supabase plan. Turn
  it on when you upgrade: Authentication → Policies.
- **Tag and city pages only exist where there is content.** Deliberate. A page
  promising pastries and listing none is worse than no page.

## Parked, in rough order of value

Not urgent, not forgotten.

1. **Google Search Console** — half done. The verification meta tag is wired up
   and reads `GOOGLE_SITE_VERIFICATION` from the environment, so the token can
   be pasted into Vercel's project settings without touching code. It is baked
   at build time, so it only appears after the next deployment. **Verifying by
   DNS TXT record instead needs no deployment at all** and is the cheaper route:
   Search Console offers "Domain" verification, which wants one TXT record on
   `navey.co` at the registrar. Do that and the env var is unnecessary.
2. **Narrow the firewall rule on `/explore`.** It currently challenges every
   request to that path, and a challenge is something only a browser can pass —
   so Googlebot cannot read Explore at all. Adding a second condition (Query
   String · is not empty) keeps the flood blocked, since the flood carried
   `?city=...`, and lets the plain page through. Dashboard change, no deploy.
   Filtered URLs are already `noindex, follow` with a canonical pointing at
   `/explore`, so nothing is lost in search by keeping them challenged.
3. **Caching `/explore` properly** needs Next 16's Cache Components
   (`cacheComponents` in `next.config.ts`). That is not a small switch: turning
   it on removes `revalidate` and `dynamic` support from every page that uses
   them — nine of them here — and each has to be rewritten with `"use cache"`.
   Worth doing, as its own piece of work, not bundled with anything.
4. **The new amenity fields are admin-only.** Wifi, outlets, laptops, aircon,
   parking, contacts and prices are all editable from the admin listing form.
   The owner dashboard's Amenities tab still only covers noise, seating, music
   and lighting. Harmless — `updateAmenities` writes only its own four columns,
   so it cannot clobber the new ones — but a business owner cannot yet fill them
   in themselves.
5. **Direct-to-storage uploads**, to lift the ~4MB submission ceiling.
6. **Map clustering.** Pins already overlap in BGC and it worsens per listing.
7. **Chains and branches.** There is no model for one brand with eight
   locations, and retrofitting one at 200 listings is far harder than deciding
   it at 50. The decision is a product one: one page listing its branches, or
   one listing each.
8. **Leaked-password protection**, when the Supabase plan is paid.
9. **The scheduled health check is still switched off.** It was turned off
   because every page it opened was rendered fresh; now that they are cached,
   the reason is gone and the hourly timer in `.github/workflows/smoke.yml`
   can be uncommented. Left off deliberately rather than switched back on
   quietly — it is a recurring cost, and those get agreed first here. The check
   now treats a 429 on `/explore` as a note rather than a failure, so it no
   longer reports the firewall rule as an outage.

**Visitor analytics is now on** (`@vercel/analytics`, mounted in
`src/app/layout.tsx`). Worth knowing what it costs, given this year: the beacon
goes to Vercel's own collector, not to a function of ours, so it does not touch
the CPU or invocation allowances that ran out in August. It has its own separate
monthly event quota on the free plan. Roughly a kilobyte of script. Removing it
is deleting two lines from the layout.

Listing content still to fill in: 8 listings have no neighbourhood, Sage Day
Coffee has no tags, two listings have no description, and Auro Chocolate Cafe
and Outpost Market are filed under Taguig with a Bangkal address — Bangkal is
in Makati.

## The public pages are cached

Every public page except Explore and a single collection is now built once and
shared, rather than rebuilt for each visitor. Those two read the query string,
which is different for everybody, so they cannot be.

What this means when you change something:

- **Publishing refreshes the listing you changed**, immediately
  (`src/lib/publish.ts`). Everything else — homepage, city, tag, neighbourhood
  — catches up within a minute or two.
- **Never make that call refresh everything.** It used to run
  `revalidatePath("/", "layout")`, which threw away all ~100 pages after every
  admin action, from 23 call sites. Adding a coffee shop became the single most
  expensive thing anyone could do here: ISR writes went from 946 to 68,000 in a
  fortnight. A hand-written list of paths can be incomplete, but that is safe —
  anything omitted corrects itself on the page's own timer. Rebuilding
  everything is not.
- **A day is the fallback** for changes made straight in the database rather
  than through the site. It was five minutes, which meant every page on the
  site could be rebuilt 288 times a day just by being crawled.
- **Social preview images are prerendered** (`opengraph-image.tsx`). Drawing a
  1200x630 picture is expensive, and these had no caching at all, so every
  visit from a Facebook or Messenger crawler redrew one. They need
  `generateStaticParams` as well as `revalidate`: without the page list the
  route stays render-on-demand whatever the revalidate says.
- **Nothing on a public page may depend on who is looking.** That is the rule
  that keeps this working. Who is signed in (`src/lib/use-viewer.ts`) and which
  spots they saved (`src/lib/use-saved-spots.ts`) are both worked out in the
  browser. If you add something per-person to a public page, either do it in a
  client component the same way, or that page goes back to being rebuilt for
  every visitor — and the reason will not be obvious later.
- **Nothing on a public page may depend on what time it is, either.** Same rule,
  different axis, and it was missed the first time. The Open/Closed badge was
  worked out on the server and baked into pages that are rebuilt weekly, so it
  could tell a visitor a shop was open six days after that stopped being true.
  Anything that changes by the hour — open state, "closes in 40 min" — is now
  computed in the browser from the hours carried into the page
  (`src/components/OpenBadge.tsx`). The server value is used for the first paint
  only.
- **A public action must not refresh a cached page.** `toggleSaveSpot` used to
  revalidate `/`, `/explore` and `/profile` on every tap of a heart. Two of
  those are rendered per request anyway so it achieved nothing; the homepage is
  cached, so any visitor could rebuild it by tapping. Same fault as the
  `publishChanges` one below, but triggerable by strangers rather than admins.
- **A build that runs while the database is unreachable can bake empty pages.**
  The five-minute refresh heals it; the health check reads page contents rather
  than status codes, so a lasting one would be caught.

## The rule that keeps the hosting bill at zero

`src/proxy.ts` runs before a page is served, and it is billed as its own
invocation — separately from whatever it sits in front of. It used to run on
every request, which meant a page already built and waiting in the CDN still
woke a server up to be handed over: caching the site saved nothing, because
the meter was read before the cached page was ever reached. A crawler asking
for the homepage three times a second cost the same as real admin work.
126,000 invocations in twelve hours, on a site with no visitors.

Its `matcher` now lists only pages belonging to a signed-in person. **Anything
not on that list is served by the CDN with no server involvement at all, and
cannot cost anything however often it is requested.**

So: **never add a public page to that matcher.** If a public page needs to
know who is looking, do it in the browser — `src/lib/use-viewer.ts` and
`src/lib/use-saved-spots.ts` are the two examples, and the browser refreshing
its own session is exactly what makes leaving public pages out safe.

Bot defence has three layers, in order of how much they actually stop:

1. **Vercel Firewall rules** (dashboard, not code) — the only layer that
   enforces anything. Currently: GPTBot denied, `/explore` challenged. The
   free plan allows 3 rules, 1 rate limit, 10 IP blocks.
2. **The matcher above** — makes the requests that do get through free.
3. **`src/app/robots.ts`** — a polite request. Honoured by well-behaved
   crawlers, ignored by the rest.

Note that Vercel's Attack Challenge Mode does **not** stop verified bots —
GPTBot walked through it for twelve hours. Use a firewall rule for those.

## Before changing code

```
npm test          # rules for opening hours, slugs, duplicate matching
npx tsc --noEmit  # types
npm run build     # the real check
```

`npm test` and the health check both run automatically on every push.

## Traps that have already bitten once

- **The link-preview pictures are drawn by Satori, not a browser.** Satori
  implements a subset of CSS and refuses anything ambiguous instead of guessing.
  Its strictest rule: **any element with more than one child must state its
  `display`**. A div holding `{city}` and `{price}` side by side, with no
  display, broke four deployments in a row over a month — and before that, while
  the pictures were drawn on demand, it was merely an invisible broken preview,
  because nobody looks at their own link previews. The drawing now lives in
  `src/lib/og-image.ts`, written with `createElement` rather than JSX precisely
  so the number of children is impossible to miscount, and `scripts/og.test.mts`
  draws every variant for real on `npm test`. If you edit those pictures, run
  the tests — a type check cannot see this class of fault.
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

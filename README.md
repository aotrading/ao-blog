# AO Trading Blog

Existing Astro static site at https://blog.aotrading.io/, deployed by
`.github/workflows/astro.yml` to GitHub Pages. Editorial principle: restraint
signals confidence; hype signals doubt. Prioritize education, evidence,
transparent methodology, documented claims, and clear risk communication.

## Architecture and reconnaissance

- Four published Markdown articles live in `src/content/blog/`. The content
  schema validates metadata; `src/lib/posts.ts` filters drafts in production.
- `src/pages/blog/[...slug].astro` renders articles through `BlogPost.astro`.
  Existing canonical/social metadata, BlogPosting structured data, sitemap,
  RSS, redirects, table of contents, and risk disclaimers are retained.
- Pagefind indexes article titles only (`data-pagefind-body` on the heading).
  Search shows titles, with at most eight results.
- Duplicate results came from overlapping asynchronous searches and article
  requests appending into the same list. Input changes now invalidate previous
  work; results render once in relevance order, with duplicate URLs removed.
  Clear, empty, loading and error states are handled.
- CTA variants, platform icons, social defaults, and two per-article slots
  already existed. They are reused; no article assignments were added.
- Analytics and Consent Mode already exist. Newsletter integration did not
  exist; a configurable, inactive component is now available.

## Development and validation

Use Node.js >=22.12 and `npm ci` to install the locked dependencies.

```sh
npm test
npm run build
npm exec -- pagefind --site dist
npm run preview
```

The deployment workflow already runs Astro followed by Pagefind. Local
`npm run build` alone does not create the Pagefind index; the title index
embedded in the page keeps search usable in development and when Pagefind is
unavailable. For development use `npm run dev -- --background`, as specified
in `AGENTS.md`.

Tests use Node's built-in runner and VM modules to reproduce delayed search
responses without network timing or additional dependencies. No new runtime
dependencies or deployment changes are required.

## Per-article CTAs (D1 / D3)

`Cta.astro` owns presentation; `PlatformIcon.astro` owns optional icons;
`src/lib/ctas.ts` owns existing social URLs and default labels. Each article
supports one `ctaPrimary` object and one `ctaSecondary` object. Omitted slots
render nothing. Both remain optional until editorial selection.

Example syntax only, **not** an assignment recommendation:

```yaml
ctaPrimary:
  platform: twitter
  title: "Editor-approved title"
  description: "Editor-approved supporting copy"
  label: "Editor-approved action"
  href: "https://example.com/editor-selected-destination"
ctaSecondary:
  title: "Editor-approved secondary title"
  description: "Editor-approved supporting copy"
  label: "Read more"
  href: "/editor-selected-page/"
```

Platforms: `twitter`, `instagram`, `newsletter`, `discord`, `youtube`. The
optional platform supplies an icon and default label. Known social platforms
can use existing URL defaults; explicit `href` always wins. Newsletter requires
an explicit URL. Empty text and invalid URL schemes fail content validation.
Destinations are not hardcoded into the component.

Editorial priority: X / Twitter and Instagram are top tier, followed by
newsletter, Discord free trial, then YouTube. This guides the editor; it is
not an automatic category mapping. A Discord invite does not specify free-trial
terms: supply the approved trial destination and copy when selected.

## Newsletter preparation (D2)

`NewsletterSignup.astro` accepts a `config` prop or defaults to
`NEWSLETTER_CONFIG` in `src/lib/newsletter.ts`. That default is intentionally
`null`: nothing appears until configured and placed.

Two provider-independent options are supported:

- `mode: 'link'`: title, description, label and `href` for a hosted signup page.
  Reuses `Cta.astro` and its `variant` prop.
- `mode: 'form'`: title, description, label, public HTTPS `action`, provider's
  `emailField` name, and approved `consentText`. Optional `hiddenFields` holds
  public fields such as a list identifier; optional `privacyHref` supplies the
  actual policy URL. Uses a labelled required email input and native HTML POST,
  without client JavaScript or local email storage.

After configuring, place it deliberately in a page or MDX article:

```mdx
import NewsletterSignup from '../../components/NewsletterSignup.astro';

<NewsletterSignup variant="secondary" />
```

This import is relative to an MDX file in `src/content/blog/`. Placement is
independent of the frontmatter slots. Coordinate with the editor to maintain
the intended one-primary/one-secondary CTA policy. A frontmatter newsletter
CTA can instead link directly to an approved hosted signup URL.

Manual decisions: provider, hosted page versus native POST, exact URL and public
field names, approved signup/consent copy, privacy link if applicable, and
placement. Native POST requires an endpoint that handles validation,
confirmation, errors and redirects itself. Providers requiring API credentials,
custom JavaScript, CAPTCHA or a server handler need an adapter once selected.
Never put secrets in static-site config. No provider has been selected, no
emails are collected, and no success state is fabricated. Confirm opt-in and
error behavior with the actual provider before publishing an enabled form.

## Google Analytics (C2)

`BaseHead.astro` reads `PUBLIC_GA_ID` at build time; the Actions workflow already
passes that repository variable through. Verified during this work: the
variable is `G-P5C668KRT7`, and the live homepage loads Google's tag with that
same ID. No Measurement ID or implementation replacement is needed.

Manual verification: confirm the intended GA4 web stream and a visit in
Realtime/DebugView. Verify Accept, Decline, reload and Cookie settings behavior.
One existing issue in source: CookieConsent reads a stored choice to hide the
banner but does not reapply it on subsequent page loads, while BaseHead resets
consent to denied. Resolve this separately before treating consent verification
as complete; Analytics code was left unchanged under the C2 scope.

## Intentionally pending

- Editorial assignment of one primary and one secondary CTA per article.
- Newsletter provider configuration, placement and live signup testing.
- GA account-side reporting checks and the saved-consent issue above.

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_NAMES } from './lib/categories';
import { CTA_PLATFORMS } from './lib/ctas';

// A CTA slot on a post. It needs somewhere to go: an explicit href or one of
// the known platforms (whose URLs live in lib/ctas.ts).
const cta = z
	.object({
		platform: z.enum(CTA_PLATFORMS).optional(),
		href: z.string().optional(),
		label: z.string().optional(),
		title: z.string().optional(),
		description: z.string().optional(),
	})
	.refine((value) => Boolean(value.href ?? value.platform), {
		message: 'A CTA needs an href or a platform',
	})
	.optional();

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// Describes the hero image for screen readers and search engines
			heroImageAlt: z.string().default(''),
			// Every post is published by the team by default
			author: z.string().default('AO Team'),
			// Drafts are hidden from the live site (wired up in Step 4.2)
			draft: z.boolean().default(false),
						// Manually curated; controls the "Popular questions" section on the home page
			featured: z.boolean().default(false),
						// Fixed set of categories; a typo here fails the build
			category: z.enum(CATEGORY_NAMES),
			// Optional end-of-post calls to action, resolved via lib/ctas.ts
			ctaPrimary: cta,
			ctaSecondary: cta,
		}),
});

export const collections = { blog };

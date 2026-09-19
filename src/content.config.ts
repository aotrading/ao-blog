import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_NAMES } from './lib/categories';

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
			// Drafts are hidden from the live site (wired up in Step 4.2)
			draft: z.boolean().default(false),
						// Fixed set of categories; a typo here fails the build
			category: z.enum(CATEGORY_NAMES),
		}),
});

export const collections = { blog };

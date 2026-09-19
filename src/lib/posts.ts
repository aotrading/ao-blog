import { getCollection } from 'astro:content';

// Single source of truth for "which posts are visible".
// In production builds, drafts are excluded. In `npm run dev`, they are
// shown so you can preview them.
export async function getPublishedPosts() {
	const posts = await getCollection('blog', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
// Estimated reading time in whole minutes (about 200 words per minute).
// Fenced code blocks are excluded, since people skim them.
export function readingTime(body: string | undefined): number {
	const text = (body ?? '').replace(/```[\s\S]*?```/g, ' ');
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}
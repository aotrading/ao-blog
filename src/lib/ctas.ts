// Single source of truth for CTAs and social destinations.
// The content schema (ctaPrimary/ctaSecondary), the Cta component, and the
// footer social links all read from here.

export const CTA_PLATFORMS = ['twitter', 'instagram', 'newsletter', 'discord', 'youtube'] as const;
export type CtaPlatform = (typeof CTA_PLATFORMS)[number];

// Accept explicit web destinations and local paths, but not script schemes
// or protocol-relative URLs. Used by the content schema and signup component.
export function isCtaHref(value: string): boolean {
	if (!value || value !== value.trim() || /[\s\\]/.test(value)) return false;
	if (value.startsWith('/') && !value.startsWith('//')) return true;
	try {
		const url = new URL(value);
		return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname);
	} catch {
		return false;
	}
}

// Confirmed account URLs (footer + CTA defaults share these).
export const SOCIAL_LINKS = {
	discord: 'https://discord.gg/aotrading',
	youtube: 'https://www.youtube.com/@AOTrading',
	instagram: 'https://www.instagram.com/AOTradingGroup',
	twitter: 'https://twitter.com/AOTradingGroup',
} as const;
export type SocialPlatform = keyof typeof SOCIAL_LINKS;

export const SOCIAL_ORDER: SocialPlatform[] = ['discord', 'youtube', 'instagram', 'twitter'];

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
	discord: 'Discord',
	youtube: 'YouTube',
	instagram: 'Instagram',
	twitter: 'X (Twitter)',
};

const DEFAULT_LABELS: Record<CtaPlatform, string> = {
	twitter: 'Follow on X',
	instagram: 'Follow on Instagram',
	newsletter: 'Join the newsletter',
	discord: 'Join the Discord',
	youtube: 'Subscribe on YouTube',
};

// What a post's frontmatter may configure for each CTA slot.
export interface CtaConfig {
	platform?: CtaPlatform;
	href?: string;
	label?: string;
	title?: string;
	description?: string;
}

export interface ResolvedCta {
	href: string;
	label: string;
	title?: string;
	description?: string;
	platform?: CtaPlatform;
}

// Fill in defaults from the platform and drop CTAs that have nowhere to go.
// Newsletter has no destination until the signup (D2) exists, so it always
// requires an explicit href.
export function resolveCta(config: CtaConfig): ResolvedCta | null {
	if (config.platform === 'newsletter' && !config.href) return null;

	const href =
		config.href ?? (config.platform ? SOCIAL_LINKS[config.platform as SocialPlatform] : undefined);
	if (!href) return null;

	return {
		href,
		label: config.label ?? (config.platform ? DEFAULT_LABELS[config.platform] : 'Read more'),
		title: config.title,
		description: config.description,
		platform: config.platform,
	};
}

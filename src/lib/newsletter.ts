import { isCtaHref } from './ctas.ts';

interface SignupContent {
	title: string;
	description: string;
	label: string;
}

export type NewsletterConfig = SignupContent & (
	| { mode: 'link'; href: string }
	| {
		mode: 'form';
		// A public HTTPS endpoint accepting a native HTML POST (no API keys).
		action: string;
		emailField: string;
		consentText: string;
		hiddenFields?: Record<string, string>;
		privacyHref?: string;
	}
);

// Deliberately inactive until the provider and signup copy are approved.
// Import NewsletterSignup in an MDX article or page to place it editorially.
export const NEWSLETTER_CONFIG: NewsletterConfig | null = null;

export function validateNewsletter(config: NewsletterConfig): void {
	for (const value of [config.title, config.description, config.label]) {
		if (!value.trim()) throw new Error('Newsletter title, description and label are required');
	}
	if (config.mode === 'link') {
		if (!isCtaHref(config.href)) throw new Error('Newsletter signup needs a valid web URL or local path');
		return;
	}
	if (!config.action.startsWith('https://') || !isCtaHref(config.action)) {
		throw new Error('Newsletter form action must be an absolute public HTTPS endpoint');
	}
	if (!config.emailField.trim() || !config.consentText.trim()) {
		throw new Error('Newsletter form needs the provider email field and approved consent text');
	}
	if (Object.hasOwn(config.hiddenFields ?? {}, config.emailField)) {
		throw new Error('Newsletter hidden fields must not override the email field');
	}
	if (config.privacyHref !== undefined && !isCtaHref(config.privacyHref)) {
		throw new Error('Newsletter privacy link must be a valid web URL or local path');
	}
}

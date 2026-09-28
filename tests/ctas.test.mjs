import assert from 'node:assert/strict';
import test from 'node:test';
import { isCtaHref, resolveCta, SOCIAL_LINKS } from '../src/lib/ctas.ts';
import { NEWSLETTER_CONFIG, validateNewsletter } from '../src/lib/newsletter.ts';

test('CTA content and destinations can be overridden independently per slot', () => {
	assert.equal(resolveCta({ platform: 'twitter' }).href, SOCIAL_LINKS.twitter);
	const custom = { platform: 'instagram', href: '/custom/', title: 'Title', description: 'Description', label: 'Read' };
	assert.deepEqual(resolveCta(custom), custom);
	assert.equal(resolveCta({ platform: 'newsletter' }), null);
	assert.equal(resolveCta({}), null);
	assert.equal(resolveCta({ platform: 'newsletter', href: '/signup/' }).href, '/signup/');
});

test('CTA URLs accept web URLs and local paths, rejecting invalid destinations', () => {
	for (const href of ['https://example.com/signup', '/signup/#form', 'http://localhost:4321/']) assert.equal(isCtaHref(href), true, href);
	for (const href of ['', ' ', '//example.com', '/\\example.com', 'javascript:alert(1)', 'https://', 'https://example.com/a b']) assert.equal(isCtaHref(href), false, href);
});

test('newsletter remains unconfigured; link and native form adapters accept explicit configuration', () => {
	assert.equal(NEWSLETTER_CONFIG, null);
	const content = { title: 'Newsletter', description: 'Editorial copy', label: 'Subscribe' };
	assert.doesNotThrow(() => validateNewsletter({ ...content, mode: 'link', href: '/signup/' }));
	const form = { ...content, mode: 'form', action: 'https://example.com/subscribe', emailField: 'EMAIL', consentText: 'Approved copy' };
	assert.doesNotThrow(() => validateNewsletter(form));
	assert.throws(() => validateNewsletter({ ...form, action: '/subscribe' }), /HTTPS/);
	assert.throws(() => validateNewsletter({ ...form, action: 'http://example.com' }), /HTTPS/);
	assert.throws(() => validateNewsletter({ ...form, emailField: '' }), /email field/);
	assert.throws(() => validateNewsletter({ ...form, consentText: '' }), /consent text/);
	assert.throws(() => validateNewsletter({ ...form, hiddenFields: { EMAIL: 'override' } }), /override/);
});

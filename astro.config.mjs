// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.aotrading.io',
	integrations: [mdx(), sitemap()],
	// Pre-rename post URLs. Static output emits meta-refresh pages for these,
	// since GitHub Pages cannot serve 301s.
	redirects: {
		'/blog/RM': '/blog/risk-management-in-trading/',
		'/blog/Signals': '/blog/crypto-trading-signals-guide/',
		'/blog/SL': '/blog/stop-loss-slippage/',
		'/blog/Verify': '/blog/verify-signal-provider-track-record/',
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Manrope',
			cssVariable: '--font-manrope',
			weights: [400, 500, 700],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.local(),
			name: 'Crucial',
			cssVariable: '--font-crucial',
			fallbacks: ['Georgia', 'serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/Crucial-Medium.woff2'],
						weight: 500,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/Crucial-MediumItalic.woff2'],
						weight: 500,
						style: 'italic',
						display: 'swap',
					},
				],
			},
		},
	],
});
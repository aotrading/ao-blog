// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.aotrading.io',
	integrations: [mdx(), sitemap()],
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
						src: ['./src/assets/fonts/crucial-medium.woff2'],
						weight: 500,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/crucial-mediumitalic.woff2'],
						weight: 500,
						style: 'italic',
						display: 'swap',
					},
				],
			},
		},
	],
});
// Single source of truth for categories.
// The content schema and the category pages both read from here.
export const CATEGORY_NAMES = ['Education', 'Market Analysis'] as const;
export type CategoryName = (typeof CATEGORY_NAMES)[number];

export const categories: { name: CategoryName; slug: string; description: string }[] = [
	{
		name: 'Education',
		slug: 'education',
		description: 'Guides and explainers on trading concepts, tools, and risk management.',
	},
	{
		name: 'Market Analysis',
		slug: 'market-analysis',
		description: 'Commentary on market conditions, price action, and the events driving them.',
	},
];
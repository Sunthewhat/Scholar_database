import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		colors: {
			white: '#FDFDFD',
			grey: '#CFCFCF',
			softblack: '#959595',
			black: '#1C1C1C',
			green: '#53BA81',
			red: '#E26767',
			violet: {
				1: '#A18AC4',
				2: '#8E76B3',
				3: '#7255A7',
				gd0: '#FAFAFF',
				gd100: '#C3B0DC',
				circle3: '#A18AC4BF',
				circle2: '#A18AC466',
				circle1: '#A18AC44A',
			},
		},
	},
	plugins: [],
};
export default config;

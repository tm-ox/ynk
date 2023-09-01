/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		colors: {
			primary: 'rgb(var(--color-primary) / <alpha-value>)',
			hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
			secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
			tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
			prim: "#ee00ee",
			sec: "#f0f0f0",
			ter: "#15192f",
			hov: "#ff3dff",
			success: "#02231158",
			danger: "#160016",
			warning: "#794939",
			info: "#170170169",
			light: "#25545149",
			dark: "#5338200",
		},
		extend: {
			fontFamily: {
				body: ["Pathway Extreme", "sans;"],
				display: ["BioRhyme Expanded", "serif;"],
				displayCon: ["BioRhyme", "serif;"],
			},
		},
	},
	plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		colors: {
			primary: "#ee00ee",
			secondary: "#f0f0f0",
			tertiary: "#160016",
			hover: "#ff3dff",
			success: "#02231158",
			danger: "#11809134",
			warning: "#794939",
			info: "#170170169",
			light: "#25545149",
			dark: "#5338200",
		},
		extend: {
			fontFamily: {
				display: ["BioRhyme Expanded", "serif;"],
				body: ["BioRhyme", "serif;"],
			},
		},
	},
	plugins: [],
}

module.exports = {
	// mode: 'jit',
	purge: {
		content: [
			'./src/**/*.js',
			'./src/**/*.jsx',
			'./src/**/*.ts',
			'./src/**/*.tsx',
			'./src/**/*.html',
			'./src/**/*.vue',
			'./src/components/Tutorial.vue',
		],
	},
	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {
			colors: {
				main: {
					darkest: '#252436',
					darker: '#2c2b3f',
					dark: '#3d3c5a',
					DEFAULT: '#56547f',
					light: '#9592de',
					lighter: '#bab7ec',
					lightest: '#e6e8ff',
				},
				purple: {
					750: 'rgb(200, 37, 200)',
				},
			},
			fontFamily: {
				sans: [
					'Open Sans',
					'system-ui',
					'BlinkMacSystemFont',
					'-apple-system',
					'Segoe UI',
					'Roboto',
					'Oxygen',
					'Ubuntu',
					'Cantarell',
					'Droid Sans',
					'Helvetica Neue',
					'sans-serif',
				],
				mono: [
					'Jetbrains Mono',
					'Menlo',
					'Monaco',
					'Consolas',
					'Liberation Mono',
					'Courier New',
					'monospace',
				],
				'web-safe-mono': [
					'Menlo',
					'Monaco',
					'Consolas',
					'Liberation Mono',
					'Courier New',
					'monospace',
				],
			},

			margin: {
				px: '1px',
				'1/10': '10%',
			},
			width: {
				'1/10': '10%',
			},
			minWidth: {
				2: '.75rem',
				24: '6rem',
				md: '24rem',
				lg: '32rem',
			},
			height: {
				'1/2': '50%',
				'1/3': '33.33333%',
			},
			minHeight: {
				24: '6rem',
			},
			maxHeight: {
				full: '100%',
				'without-header': 'calc(100vh - 2.5rem)', // 100% minus h-10 which is the header height
				'without-double-header': 'calc(100vh - 5rem)', // double header (top bar bottom menu present)
			},
			borderWidth: {
				3: '3px',
			},
			borderRadius: {
				'4xl': '3rem',
			},
			rotate: {
				270: '270deg',
			},
			boxShadow: {
				'active-glow': '0 2px 20px -3px rgba(139, 92, 246, 0.63)',
			},
			animation: {
				'fade-in': 'fade-in 1s ease-out',
				'slide-in': 'slide-in 1s cubic-bezier(.23,1,.32,1)',
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
			},
		},
	},
	variants: {
		extend: {
			backgroundColor: ['responsive', 'hover', 'focus', 'active'],
			borderColor: ['responsive', 'hover', 'focus'],
			opacity: ['responsive', 'hover', 'group-hover'],
			fontWeight: ['responsive', 'hover', 'focus'],
			boxShadow: ['responsive', 'hover', 'focus'],
			textColor: ['responsive', 'hover', 'focus'],
			scale: ['responsive', 'active', 'group-hover'],
		},
	},
	plugins: [],
};

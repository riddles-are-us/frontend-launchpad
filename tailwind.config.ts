import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Pixel-style neon colors
				pixel: {
					green: 'hsl(var(--pixel-green))',
					magenta: 'hsl(var(--pixel-magenta))',
					cyan: 'hsl(var(--pixel-cyan))',
					red: 'hsl(var(--pixel-red))',
					yellow: 'hsl(var(--pixel-yellow))',
					blue: 'hsl(var(--pixel-blue))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				pixel: '0px'
			},
			fontFamily: {
				mono: 'var(--font-mono)',
				pixel: 'var(--font-mono)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-rainbow': 'var(--gradient-rainbow)'
			},
			boxShadow: {
				'pixel': '0 0 10px hsl(var(--pixel-green) / 0.5)',
				'glow': '0 0 20px hsl(var(--primary) / 0.8)',
				'glow-sm': '0 0 10px hsl(var(--primary) / 0.5)',
				'glow-lg': '0 0 30px hsl(var(--primary) / 0.8)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pixel-pulse': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.7',
						transform: 'scale(1.05)'
					}
				},
				'pixel-bounce': {
					'0%, 20%, 53%, 80%, 100%': {
						transform: 'translate3d(0, 0, 0)'
					},
					'40%, 43%': {
						transform: 'translate3d(0, -8px, 0)'
					},
					'70%': {
						transform: 'translate3d(0, -4px, 0)'
					},
					'90%': {
						transform: 'translate3d(0, -2px, 0)'
					}
				},
				'glow': {
					'from': {
						filter: 'drop-shadow(0 0 5px hsl(var(--primary)))'
					},
					'to': {
						filter: 'drop-shadow(0 0 20px hsl(var(--primary))) drop-shadow(0 0 35px hsl(var(--primary)))'
					}
				},
				'fadeIn': {
					'from': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'to': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slideInRight': {
					'from': {
						transform: 'translateX(100%)'
					},
					'to': {
						transform: 'translateX(0)'
					}
				},
				'scaleIn': {
					'from': {
						transform: 'scale(0.9)',
						opacity: '0'
					},
					'to': {
						transform: 'scale(1)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pixel-pulse': 'pixel-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'pixel-bounce': 'pixel-bounce 1s infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'fadeIn': 'fadeIn 0.3s ease-out',
				'slideInRight': 'slideInRight 0.3s ease-out',
				'scaleIn': 'scaleIn 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

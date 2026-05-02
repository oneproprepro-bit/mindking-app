---
name: Light Alchemy
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#3c494b'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#6c797c'
  outline-variant: '#bbc9cc'
  surface-tint: '#006874'
  primary: '#006874'
  on-primary: '#ffffff'
  primary-container: '#26c6da'
  on-primary-container: '#004e57'
  inverse-primary: '#45d8ed'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#5a5f68'
  on-tertiary: '#ffffff'
  tertiary-container: '#b0b5bf'
  on-tertiary-container: '#42474f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#98f0ff'
  primary-fixed-dim: '#45d8ed'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#dee2ed'
  tertiary-fixed-dim: '#c2c6d1'
  on-tertiary-fixed: '#171c23'
  on-tertiary-fixed-variant: '#424750'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
typography:
  h1:
    fontFamily: Nunito
    fontSize: 34px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Nunito
    fontSize: 26px
    fontWeight: '700'
    lineHeight: '1.3'
  h3:
    fontFamily: Nunito
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-padding: 24px
  gutter: 16px
---

## Brand & Style

This design system is defined by "Light Alchemy"—a visual language that blends the ethereal quality of a digital sanctuary with the tactile premium feel of a high-end physical product. The brand personality is nurturing yet majestic, designed to evoke a sense of calm wonder and cinematic immersion for children.

The aesthetic utilizes a sophisticated mix of **Glassmorphism** and **Minimalism**. It relies on translucent layers and pearlescent finishes to create depth without clutter. The goal is to move away from the "flat" cartoonishness typical of child-focused apps, instead offering a "Cinematic Sanctuary" that feels like a precious digital heirloom. Every interaction should feel like a soft glow, guiding the user through a meditative journey.

## Colors

The palette is anchored by **Cyan** and **Liquid Gold**, set against a backdrop of **Iridescent White**. 

- **Primary (Cyan):** Used for interactive states and calming focus elements. It represents the "Mind" and clarity.
- **Secondary (Gold):** Reserved for achievement, progress (XP), and "Alchemical" transformations. It should feel metallic and rare.
- **Surface (Iridescent White):** Not a flat hex, but a dynamic base. Use the provided background gradient to simulate light hitting a pearl.
- **Accents:** Use pearlescent gradients that shift subtly between very pale violet, cyan, and white to create a holographic feel on glass surfaces.

## Typography

This design system uses a dual-font approach to balance playfulness with modern precision. 

**Nunito Bold** is the voice of the app. Its rounded terminals feel friendly and safe, but when set with tight tracking in high-contrast cyan or gold, it takes on a premium "storyhook" quality. 

**Manrope** provides the functional balance. It is a highly legible, clean sans-serif used for all body copy, instructions, and labels to ensure the interface remains sophisticated and doesn't feel overly juvenile. Maintain generous line-heights to ensure a "breathable" reading experience.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with high internal margins to reinforce the "Sanctuary" vibe. Content should never feel cramped; negative space is treated as a design element that promotes focus.

Use a 4-column mobile grid with 24px side margins. Elements should float within the Iridescent White canvas, often separated by large vertical gaps (40px+) to allow the cinematic background gradients to breathe. All content blocks should be vertically centered where possible to mimic theatrical framing.

## Elevation & Depth

Depth in this design system is achieved through **Cinematic Glassmorphism** and tiered shadows.

1.  **Backdrop Blur:** All cards and overlays must use a `backdrop-filter: blur(20px)` with a high-transparency white fill (15-25% opacity).
2.  **Ultra-Thin Borders:** Containers feature a 0.5px to 1px solid border. Use a gradient stroke (White to Transparent) to simulate light catching the edge of a glass pane.
3.  **Deep Soft Shadows:** Instead of harsh blacks, use shadows tinted with the primary Cyan or a deep Slate. Use high blur radii (30px-50px) and very low opacity (10%) to create a "floating" effect rather than a "heavy" one.
4.  **Z-Axis:** Progress bars and active buttons sit on the highest plane, emitting a soft outer glow (`box-shadow` with spread) rather than a traditional drop shadow.

## Shapes

The shape language is dominated by **Pill-shapes** and hyper-rounded enclosures. This removes all visual "friction," reinforcing the safety and wellness aspect of the brand.

Standard buttons, input fields, and tags are fully pill-shaped (radius: 999px). Large content cards use a `rounded-xl` (1.5rem / 24px) setting to maintain a soft but structured appearance. Avoid all sharp corners; even 1.5px stroke icons should have rounded caps and joins.

## Components

### Buttons
Primary buttons are pill-shaped with a cyan-to-teal gradient. They feature a "subtle glow" effect—a soft outer shadow matching the button's hue. Secondary buttons are "Frosted Glass" with a 1px white border.

### Liquid Gold XP Bar
The progress bar is a signature element. The container is a recessed frosted glass track. The fill is a multi-stop "Liquid Gold" linear gradient that appears to shimmer. Add a small "sparkle" SVG at the leading edge of the progress fill to enhance the magical feel.

### Bottom Navigation
A minimalist frosted glass bar docked to the bottom. It contains four 1.5px stroke SVG line icons:
- **House:** Home/Sanctuary.
- **Flame:** Energy/Activity.
- **Wind/Waves:** Breathing/Meditation.
- **Heart Sanctuary:** Profile/Favorites.
Active states are indicated by the icon transitioning to Gold with a tiny 4px dot below it.

### Cards
Cards are the primary content vehicle. They must be semi-transparent with a subtle "Pearlescent" sheen. Content inside cards should be strictly aligned with generous padding (24px) to keep the premium feel.

### Input Fields
Pill-shaped with a very light cyan-tinted background (5% opacity). On focus, the ultra-thin border should transition from white to gold.
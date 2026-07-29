# SkillSphere Frontend Architecture & Component Documentation

## Overview
SkillSphere is a modern, responsive, and highly aesthetic React application built with Vite and Tailwind CSS. The platform features dynamic layer-by-layer scrolling, custom historic-modern SVG iconography (like the Armillary Sphere logo), and a robust dual-theme (Light/Dark mode) system.

---

## Project Structure
- `index.html`: The HTML entry point of the application.
- `src/App.jsx`: Main React component that orchestrates the layout and combines all the sections.
- `src/index.css`: Core stylesheet managing CSS variables, theme toggling, and global typography.
- `src/components/`: Directory containing all reusable UI components.

---

## CSS Architecture (`src/index.css`)
The styling avoids hardcoding colors in favor of a dynamic CSS variable system:
- **Theme Variables**: Variables like `--bg-page`, `--text-primary`, `--bg-card`, and `--border-card` are defined globally in `:root` (representing the default Dark Mode) and strictly overridden in `[data-theme="light"]` to instantly switch the entire app's color palette.
- **Progressive Ambient Glowing**: The stylesheet defines five distinct glow colors (`--glow-1` through `--glow-5`). These are applied as radial-gradients behind different components to create a shifting layer-by-layer ambient lighting effect as the user scrolls down the page.
- **Glassmorphism System**: The `.card-glass` utility is defined here. It provides standard backdrop blurring (`backdrop-filter`), semi-transparent borders, and hover animations, ensuring all cards across the site look unified and premium.
- **Vignette Effect**: A fixed `body::before` pseudo-element casts a subtle vignette shadow on the edges of the screen, creating depth.

---

## Components Breakdown

### 1. `Navbar.jsx`
- **Purpose**: Top fixed navigation bar with a responsive mobile dropdown menu.
- **Design Details**: Reduced maximum width (`max-w-[1200px]`) for a focused, pill-like layout. The mobile dropdown was specifically centered to provide a balanced look on smaller screens.
- **Logo**: Features the custom-designed SVG Armillary Sphere logo, blending historic navigation motifs with modern AI glowing gradients.

### 2. `Hero.jsx`
- **Purpose**: The landing section immediately visible on page load.
- **Design Details**: Features bold typography that scales dynamically. Contains the primary Call to Action (CTA) "View Your Dashboard". It relies on `--glow-1` (Cyan) and `--glow-2` (Indigo) to establish the initial visual impact.
- **Layout**: Uses floating glassmorphism cards to visually demonstrate platform capabilities right away.

### 3. `Pipeline.jsx`
- **Purpose**: Visualizes the AI skill-matching pipeline and key platform metrics.
- **Design Details**: Displays statistics (e.g., matching accuracy, time-to-offer) in a responsive horizontal grid. Utilizes `--glow-2` (Indigo) and `--glow-3` (Emerald) to shift the ambient color from the Hero section.

### 4. `AIScoring.jsx`
- **Purpose**: Explains the multi-dimensional AI scoring system.
- **Design Details**: Uses a two-column grid. The main heading ("Scores that actually mean something") is specifically sized down to balance the layout and prevent pushing content too far down on desktop screens. Uses `--glow-3` (Emerald) and `--glow-4` (Purple) for its background.

### 5. `Features.jsx`
- **Purpose**: Highlights core platform features in a grid.
- **Design Details**: A responsive grid layout mapping out features like Real-world Validation, Actionable Guidance, and Blind Matching. Backed by a large `--glow-4` (Purple) aura.

### 6. `Candidates.jsx`
- **Purpose**: Showcases placeholder candidate profiles to demonstrate the matching UI.
- **Design Details**: The cards are formatted to sit two-in-a-row on mobile screens for better space utilization. Employs `--glow-5` (Lime) for its ambient background.

### 7. `CTA.jsx` (Call to Action)
- **Purpose**: The final conversion section at the bottom of the page.
- **Design Details**: Uses a mix of Indigo and Purple glows. Contains the "Start for Free" button to drive user signup, designed with a sleek gradient and hover effects.

### 8. `Footer.jsx`
- **Purpose**: Site footer with links, copyright info, and branding.
- **Design Details**: Reuses the detailed Armillary Sphere logo for brand consistency. The layout is spaced efficiently with centered copyright text for mobile responsiveness.

### 9. `AnimatedSection.jsx`
- **Purpose**: A utility wrapper component used by all other sections.
- **Design Details**: Uses `IntersectionObserver` to detect when elements enter the viewport. It automatically fades and slides content into view as the user scrolls, providing a smooth, dynamic user experience.

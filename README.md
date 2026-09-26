<div align="center">

# O B S C U R A

*“L’image se révèle à l’encre.”*

An interactive monochrome exhibition experience crafted with generative dither aesthetics, dynamic ink particles, and responsive 3D card presentation.

---

</div>

## ✒️ Overview

**OBSCURA** is an immersive digital art gallery designed with atmospheric ink-trail physics, real-time dither canvas rendering, and seamless background audio integration.

Each artwork is revealed through dark monochrome dither stippling and interactive canvas brushstrokes, framing digital art in a tactile, high-contrast aesthetic.

---

## ✨ Features

- **Sigil Entry Portal**: Custom dither stipple brush sigil serving as an interactive gatekeeper to the exhibition.
- **Generative Dither Particle Canvas**: Real-time canvas noise grid and floating dither dust simulation.
- **Interactive Ink Trail**: Fluid canvas brushstrokes that follow cursor interaction across the gallery display.
- **Atmospheric Audio Integration**: Embedded audio player with header-integrated glass controls and auto-start on entry.
- **3D Depth Gallery Carousel**: Responsive gallery cards with smooth keyboard controls, swipe navigation, and high-resolution artwork inspection.
- **Ephemeral Session Security**: Strictly in-memory admin session logic that naturally resets on browser refresh for optimal security.

---

## 📁 Custom Audio Setup

To use your own custom background track:

1. Drop your audio file into the public directory:
   ```text
   /public/music/background.mp3
   ```
2. The exhibition will automatically stream and loop your custom audio upon clicking the entry sigil.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Monochrome Dark Palette)
- **Icons**: Lucide React
- **Backend / Persistence (Optional)**: Supabase JS Client (configured with `persistSession: false`)

---

## 🚀 Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/obscura.git
   cd obscura
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

<div align="center">

*O B S C U R A — E X H I B I T I O N*

</div>

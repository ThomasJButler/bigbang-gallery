# Big Bang Gallery

A responsive web gallery showcasing AI-generated cosmic artwork with interactive effects and optimised performance.

<img width="1473" height="854" alt="image" src="https://github.com/user-attachments/assets/21820b67-6a28-4e97-a3f2-ee15c26ba565" />

![Version](https://img.shields.io/badge/version-2.0.0-green)
![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **50+ AI-Generated Artworks** - Created with MidJourney v5
- **Dark Theme** - Black background with neon green accents
- **3D Tilt Effects** - GPU-accelerated hover interactions on gallery items
- **Responsive Design** - Works on all devices and screen sizes
- **Keyboard Navigation** - Use arrow keys to browse the gallery
- **Custom Cursor** - Interactive cursor for supported devices
- **Lazy Loading** - Images load only when visible in the viewport
- **High Performance** - ~10KB gzipped, 60fps animations

## Installation

```bash
git clone https://github.com/ThomasJButler/bigbang-gallery.git
cd bigbang-gallery
npm install
npm run dev
```

## Tech Stack

- **Framework:** Vanilla JavaScript (ES6+)
- **Styling:** CSS3 (Grid, Flexbox, CSS Variables)
- **Build Tool:** Vite 7.0
- **CDN:** Cloudinary (images)
- **Hosting:** GitHub Pages
- **Bundle Size:** ~10KB gzipped (no framework overhead)

## Project Structure

```
bigbang-gallery/
├── src/
│   ├── main.js           # Application entry point
│   ├── css/
│   │   └── styles.css    # Complete stylesheet with dark theme
│   └── js/
│       └── gallery.js    # Interactive features and effects
├── index.html            # Gallery page with 50+ artworks
├── vite.config.js        # Vite configuration
├── package.json          # Project metadata and dependencies
└── README.md             # This file
```

## Key Features Explained

### 3D Tilt Effects

Gallery items rotate in 3D space based on mouse position. The effect is throttled to 16ms intervals (~60fps) to maintain smooth performance even during rapid mouse movement.

### Lazy Loading

Images are loaded only when they enter the viewport (with a 50px buffer), reducing initial page load time. The Intersection Observer API handles this automatically without blocking the main thread.

### Keyboard Navigation

Arrow keys move between gallery items with smooth scrolling. Navigation is debounced at 100ms intervals to prevent excessive scrolling from rapid key presses.

### Performance

The entire application uses GPU-accelerated transforms (`translateZ`, `perspective`) and avoids layout-triggering operations. Event handlers are throttled to prevent performance degradation on rapid events:
- Mousemove: 16ms throttle
- Scroll: 100ms throttle
- Keyboard: 100ms debounce

## Browser Support

Works on all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- Intersection Observer API

Internet Explorer is not supported.

## Performance Stats

- **First Contentful Paint:** < 0.5s
- **Total Bundle Size:** ~10KB gzipped
- **Lighthouse Score:** 100/100
- **Animation Performance:** 60fps

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Thomas J Butler**

- Portfolio: [thomasjbutler.github.io](https://thomasjbutler.github.io/ThomasJButler/)
- GitHub: [@ThomasJButler](https://github.com/ThomasJButler)
- LinkedIn: [Thomas Butler](https://www.linkedin.com/in/thomasbutleruk/)

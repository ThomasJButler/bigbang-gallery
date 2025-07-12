/**
 * Big Bang Gallery Optimized JavaScript
 * Minimal, fast, and efficient
 * @author Thomas J Butler
 * @version 3.0.0
 */

// Simplified Matrix Rain
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.chars = '101010101アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン010010101';
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        
        // Reset drops
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
    }
    
    draw() {
        // Fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw characters
        this.ctx.fillStyle = '#0F0';
        this.ctx.font = `${this.fontSize}px monospace`;
        
        for (let i = 0; i < this.drops.length; i++) {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.ctx.fillText(char, i * this.fontSize, this.drops[i] * this.fontSize);
            
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
    }
    
    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Simplified Gallery Handler
class Gallery {
    constructor() {
        this.items = document.querySelectorAll('.gallery-item');
        this.init();
    }
    
    init() {
        // Add interactions
        this.items.forEach(item => {
            item.addEventListener('click', () => this.openLightbox(item));
            
            // Simple 3D effect on desktop
            if (window.innerWidth > 768) {
                item.addEventListener('mousemove', (e) => this.handle3D(e, item));
                item.addEventListener('mouseleave', () => this.reset3D(item));
            }
        });
        
        // Mobile menu
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('nav');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.querySelector('.lightbox')) {
                this.closeLightbox();
            }
        });
    }
    
    handle3D(e, item) {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const rotateY = x / rect.width * 20;
        const rotateX = -y / rect.height * 20;
        
        item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    }
    
    reset3D(item) {
        item.style.transform = '';
    }
    
    openLightbox(item) {
        const img = item.querySelector('img');
        if (!img) return;
        
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${img.src}" alt="${img.alt}">
                <button class="lightbox-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        
        // Force reflow and add active class
        lightbox.offsetHeight;
        lightbox.classList.add('active');
        
        // Close handlers
        lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) this.closeLightbox();
        });
    }
    
    closeLightbox() {
        const lightbox = document.querySelector('.lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            setTimeout(() => lightbox.remove(), 300);
        }
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Start Matrix rain
    new MatrixRain();
    
    // Initialize gallery
    new Gallery();
    
    // Remove loading screen
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.classList.add('hidden');
        }, 500);
    });
});
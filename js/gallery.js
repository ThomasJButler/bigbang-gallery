/**
 * Big Bang Gallery - Simple Edition
 * Clean, fast, working gallery with minimal effects
 * @author Thomas J Butler
 * @version 5.0.0
 */

// Simple Matrix Rain Effect
class SimpleMatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.fontSize = 16;
        this.columns = 0;
        this.drops = [];
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
        }
    }
    
    draw() {
        this.ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = `${this.fontSize}px monospace`;
        
        for (let i = 0; i < this.drops.length; i++) {
            const text = Math.random() > 0.5 ? '1' : '0';
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
            
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

// Simple Gallery Handler
class SimpleGallery {
    constructor() {
        this.items = [];
        this.init();
    }
    
    init() {
        this.items = Array.from(document.querySelectorAll('.gallery-item'));
        
        // Fix images that have placeholders
        this.fixImages();
        
        // Setup simple hover effects
        this.setupHoverEffects();
        
        // Setup lightbox
        this.setupLightbox();
        
        // Initialize mobile menu
        this.initMobileMenu();
    }
    
    fixImages() {
        this.items.forEach(item => {
            const img = item.querySelector('img');
            if (!img) return;
            
            // If image has data-src, use that as the real source
            if (img.dataset.src) {
                const realSrc = img.dataset.src;
                
                // Create new image to load
                const newImg = new Image();
                newImg.onload = () => {
                    img.src = realSrc;
                    img.style.filter = '';
                    img.style.transform = '';
                    item.classList.remove('loading');
                    item.classList.add('loaded');
                };
                newImg.src = realSrc;
            } else {
                // Image already has correct src
                item.classList.remove('loading');
                item.classList.add('loaded');
            }
        });
    }
    
    setupHoverEffects() {
        this.items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = '#00FF00';
                item.style.transform = 'translateY(-5px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = 'rgba(0, 255, 0, 0.3)';
                item.style.transform = '';
            });
        });
    }
    
    setupLightbox() {
        const gallery = document.querySelector('.gallery');
        if (!gallery) return;
        
        gallery.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) this.openLightbox(item);
        });
    }
    
    openLightbox(item) {
        const img = item.querySelector('img');
        if (!img) return;
        
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${img.dataset.src || img.src}" alt="${img.alt}">
                <button class="lightbox-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        requestAnimationFrame(() => lightbox.classList.add('active'));
        
        // Close handlers
        const close = () => {
            lightbox.classList.remove('active');
            setTimeout(() => lightbox.remove(), 300);
        };
        
        lightbox.querySelector('.lightbox-close').addEventListener('click', close);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) close();
        });
        
        // ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    
    initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('nav');
        
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    // Remove loading screen if present
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
    
    // Start simple Matrix rain effect
    new SimpleMatrixRain();
    
    // Initialize gallery
    new SimpleGallery();
});
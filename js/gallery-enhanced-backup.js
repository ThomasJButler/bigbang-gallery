/**
 * Big Bang Gallery Enhanced JavaScript
 * Matrix rain effect, 3D interactions, and performance optimizations
 * @author Thomas J Butler
 * @version 2.0.0
 */

// Performance optimization: RequestIdleCallback polyfill
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
    const start = Date.now();
    return setTimeout(() => {
        cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        });
    }, 1);
};

// Enhanced Matrix Rain Effect with WebGL fallback
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 0;
        this.animationId = null;
        
        // Matrix characters with added symbols
        this.chars = '101010101アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン010010101ⓉⒽⓄⓂⒶⓈⒿⒷⓊⓉⓁⒺⓇ';
        this.characters = this.chars.split('');
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });
        
        // Initialize particles
        this.fontSize = 14;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        
        for (let i = 0; i < this.columns; i++) {
            this.particles[i] = {
                y: Math.random() * -this.canvas.height,
                speed: 0.5 + Math.random() * 1.5,
                opacity: 0.1 + Math.random() * 0.9,
                char: this.getRandomChar()
            };
        }
        
        this.animate();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    getRandomChar() {
        return this.characters[Math.floor(Math.random() * this.characters.length)];
    }
    
    draw() {
        // Fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.ctx.font = `${this.fontSize}px 'VT323', monospace`;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const x = i * this.fontSize;
            
            // Gradient color from bright green to dark
            const gradient = this.ctx.createLinearGradient(0, particle.y - 20, 0, particle.y + 20);
            gradient.addColorStop(0, `rgba(0, 255, 0, 0)`);
            gradient.addColorStop(0.5, `rgba(0, 255, 0, ${particle.opacity})`);
            gradient.addColorStop(1, `rgba(0, 255, 0, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillText(particle.char, x, particle.y * this.fontSize);
            
            // Update particle
            particle.y += particle.speed;
            
            // Reset particle when it goes off screen
            if (particle.y * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                particle.y = 0;
                particle.char = this.getRandomChar();
                particle.speed = 0.5 + Math.random() * 1.5;
            }
        }
    }
    
    animate() {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Enhanced Gallery with Intersection Observer and Touch Support
class GalleryEnhanced {
    constructor() {
        this.items = [];
        this.loadedImages = new Set();
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupInteractions();
        this.setupMobileMenu();
        this.setupKeyboardNavigation();
        this.preloadCriticalImages();
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.animateEntry(entry.target);
                }
            });
        }, options);
        
        // Observe all gallery items
        document.querySelectorAll('.vincent-item').forEach(item => {
            this.observer.observe(item);
            this.items.push(item);
        });
    }
    
    loadImage(item) {
        const img = item.querySelector('img');
        if (!img || this.loadedImages.has(img.src)) return;
        
        // Add loading animation
        item.classList.add('loading');
        
        // Create new image to preload
        const tempImg = new Image();
        tempImg.onload = () => {
            img.style.opacity = '1';
            item.classList.remove('loading');
            item.classList.add('loaded');
            this.loadedImages.add(img.src);
        };
        tempImg.src = img.src;
    }
    
    animateEntry(item) {
        item.style.animation = 'matrixFadeIn 0.6s ease-out forwards';
    }
    
    setupInteractions() {
        this.items.forEach(item => {
            // Mouse interactions
            item.addEventListener('mousemove', (e) => this.handle3DEffect(e, item));
            item.addEventListener('mouseleave', () => this.reset3DEffect(item));
            
            // Touch interactions
            item.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            item.addEventListener('touchmove', (e) => this.handleTouchMove(e, item), { passive: true });
            item.addEventListener('touchend', () => this.reset3DEffect(item));
            
            // Click to view fullscreen
            item.addEventListener('click', () => this.viewFullscreen(item));
        });
    }
    
    handle3DEffect(e, item) {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        requestAnimationFrame(() => {
            item.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateZ(20px)
                scale(1.05)
            `;
            item.style.boxShadow = `
                0 25px 50px rgba(0, 255, 0, 0.3),
                0 0 100px rgba(0, 255, 0, 0.1)
            `;
        });
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchMove(e, item) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        const rotateX = deltaY / 10;
        const rotateY = -deltaX / 10;
        
        requestAnimationFrame(() => {
            item.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                scale(1.02)
            `;
        });
    }
    
    reset3DEffect(item) {
        requestAnimationFrame(() => {
            item.style.transform = 'rotateX(0) rotateY(0) scale(1)';
            item.style.boxShadow = '0 10px 30px rgba(0, 255, 0, 0.2)';
        });
    }
    
    viewFullscreen(item) {
        const img = item.querySelector('img');
        if (!img) return;
        
        // Create lightbox
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${img.src}" alt="${img.alt}">
                <button class="lightbox-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        
        // Animate in
        requestAnimationFrame(() => {
            lightbox.classList.add('active');
        });
        
        // Close handlers
        const close = () => {
            lightbox.classList.remove('active');
            setTimeout(() => lightbox.remove(), 300);
        };
        
        lightbox.querySelector('.lightbox-close').addEventListener('click', close);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) close();
        });
        
        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    setupMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('nav');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                menuToggle.classList.toggle('active');
                
                // Animate menu items
                const menuItems = nav.querySelectorAll('li');
                menuItems.forEach((item, index) => {
                    item.style.animation = nav.classList.contains('active')
                        ? `slideIn 0.3s ${index * 0.1}s ease-out forwards`
                        : 'none';
                });
            });
        }
    }
    
    setupKeyboardNavigation() {
        let currentIndex = 0;
        
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                    currentIndex = (currentIndex + 1) % this.items.length;
                    this.focusItem(currentIndex);
                    break;
                case 'ArrowLeft':
                    currentIndex = (currentIndex - 1 + this.items.length) % this.items.length;
                    this.focusItem(currentIndex);
                    break;
                case 'Enter':
                    if (document.activeElement.classList.contains('vincent-item')) {
                        this.viewFullscreen(document.activeElement);
                    }
                    break;
            }
        });
    }
    
    focusItem(index) {
        this.items[index].focus();
        this.items[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    preloadCriticalImages() {
        // Preload first 6 images for faster initial load
        const criticalImages = Array.from(document.querySelectorAll('.vincent-item img')).slice(0, 6);
        
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src;
            document.head.appendChild(link);
        });
    }
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registered:', registration);
        }).catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start Matrix rain
    const matrix = new MatrixRain();
    
    // Initialize enhanced gallery
    const gallery = new GalleryEnhanced();
    
    // Add page visibility handling
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            matrix.destroy();
        } else {
            matrix.init();
        }
    });
    
    // Add smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }, 0);
        });
    }
});
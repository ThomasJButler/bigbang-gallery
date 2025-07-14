/**
 * Big Bang Gallery - Performance Optimized
 * Smooth interactions without lag
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gallery containers and elements
    const containers = document.querySelectorAll('.vincent-container');
    const header = document.querySelector('header');
    
    // Debounce function for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle function for smooth animations
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Simple 3D tilt effect (throttled for performance)
    containers.forEach(container => {
        const tiltEffect = throttle(function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Reduced rotation for smoother performance
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            // Use transform3d for better GPU acceleration
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        }, 16); // ~60fps
        
        container.addEventListener('mousemove', tiltEffect);
        
        container.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Optimized scroll handler
    const handleScroll = throttle(() => {
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Efficient lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
                imageObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    const images = document.querySelectorAll('.vincent-item img');
    images.forEach(img => imageObserver.observe(img));
    
    // Touch support (simplified)
    if ('ontouchstart' in window) {
        containers.forEach(container => {
            container.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            container.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }
    
    // Simple keyboard navigation
    let currentIndex = 0;
    const handleKeyNav = debounce((e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            currentIndex = e.key === 'ArrowRight' 
                ? (currentIndex + 1) % containers.length
                : (currentIndex - 1 + containers.length) % containers.length;
            
            containers[currentIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }, 100);
    
    document.addEventListener('keydown', handleKeyNav);
    
    // Optional: Simple custom cursor (can be disabled for performance)
    const enableCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    
    if (enableCustomCursor) {
        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(0, 255, 0, 0.5);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.2s;
            mix-blend-mode: difference;
        `;
        document.body.appendChild(cursor);
        
        // Hide default cursor
        document.body.style.cursor = 'none';
        
        // Throttled cursor update
        const updateCursor = throttle((e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        }, 16);
        
        document.addEventListener('mousemove', updateCursor, { passive: true });
        
        // Show/hide cursor
        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
        });
        
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
        });
    }
    
    console.log('Big Bang Gallery - Optimized ⚡');
});
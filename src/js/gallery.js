/**
 * @author Tom Butler
 * @date 2025-10-22
 * @description Interactive gallery features: 3D tilt effects, scroll detection, lazy loading, keyboard navigation, and custom cursor.
 */

/** @constructs Initialises gallery interactions once DOM is ready */
document.addEventListener('DOMContentLoaded', function() {
    const containers = document.querySelectorAll('.vincent-container');
    const header = document.querySelector('header');

    /**
     * Debounce function - delays execution until the function stops being called for `wait` milliseconds.
     * This prevents excessive function calls during rapid events like keyboard navigation.
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in milliseconds
     * @return {Function} Debounced function
     */
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

    /**
     * Throttle function - ensures function executes at most once per `limit` milliseconds.
     * Used for performance-critical events like mousemove to maintain 60fps interactions.
     * @param {Function} func - Function to throttle
     * @param {number} limit - Minimum milliseconds between executions
     * @return {Function} Throttled function
     */
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
    
    // 3D tilt effect on mousemove - Heuristic 1: Calculate rotation based on mouse position relative to container centre
    containers.forEach(container => {
        const tiltEffect = throttle(function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Heuristic 2: Scale rotation values (±8 degrees) relative to distance from centre for subtle effect
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            // Heuristic 3: Use translate3d and perspective for GPU acceleration to prevent layout thrashing
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        }, 16); // Throttle to 16ms (~60fps) to avoid excessive repaints during mousemove events
        
        container.addEventListener('mousemove', tiltEffect);
        
        container.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Scroll-triggered header styling - Add 'scrolled' class when user scrolls past 100px to apply visual differentiation
    const handleScroll = throttle(() => {
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Lazy load images using Intersection Observer to defer loading until elements are visible within 50px of viewport
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

    // Touch support for mobile devices - scale feedback on touch events
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

    // Keyboard navigation using arrow keys - debounced to prevent rapid repeated scrolling
    let currentIndex = 0;
    const handleKeyNav = debounce((e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            currentIndex = e.key === 'ArrowRight'
                ? (currentIndex + 1) % containers.length
                : (currentIndex - 1 + containers.length) % containers.length;

            containers[currentIndex].scrollIntoView({
                behaviour: 'smooth',
                block: 'center'
            });
        }
    }, 100);

    document.addEventListener('keydown', handleKeyNav);

    // Custom cursor - only enable on devices with hover and fine pointer support to avoid performance impact on touch devices
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

        document.body.style.cursor = 'none';

        // Update cursor position throttled to 16ms (~60fps) to prevent excessive style recalculations
        const updateCursor = throttle((e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        }, 16);

        document.addEventListener('mousemove', updateCursor, { passive: true });

        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
        });
    }

    console.log('Big Bang Gallery - Initialised');
});
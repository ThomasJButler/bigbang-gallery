/**
 * Big Bang Gallery - Performance-Optimized Gallery
 * Minimal, fast interaction for jigsaw puzzle effect
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gallery containers for hover effects
    const containers = document.querySelectorAll('.vincent-container');
    
    // Simple hover effect - just lift on hover
    containers.forEach(container => {
        container.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        container.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Lazy loading for images
    const images = document.querySelectorAll('.vincent-item img');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
    
    // Header scroll effect (minimal)
    const header = document.querySelector('header');
    let lastScroll = 0;
    let ticking = false;
    
    function updateHeader() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.borderBottom = '1px solid #ddd';
        } else {
            header.style.borderBottom = '1px solid #e5e5e5';
        }
        
        lastScroll = currentScroll;
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    });
    
    // Gallery ready
    console.log('Big Bang Gallery initialized');
});
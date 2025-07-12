/**
 * Simple Gallery Fallback
 * A lightweight version that focuses on displaying the gallery
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Simple Gallery...');
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Show the gallery
    const gallery = document.querySelector('.gallery');
    if (gallery) {
        gallery.style.display = 'grid';
        gallery.style.opacity = '1';
    }
    
    // Hide WebGL container
    const galaxyContainer = document.getElementById('galaxy-container');
    if (galaxyContainer) {
        galaxyContainer.style.display = 'none';
    }
    
    // Hide navigation modes
    const navModes = document.querySelector('.nav-modes');
    if (navModes) {
        navModes.style.display = 'none';
    }
    
    // Basic hover effects
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.3)';
        });
        
        // Add smooth transitions
        item.style.transition = 'all 0.3s ease';
    });
    
    // Lazy loading for images
    const images = document.querySelectorAll('.gallery img');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
    
    console.log('Simple Gallery initialized!');
});
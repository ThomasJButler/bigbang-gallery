/**
 * Big Bang Gallery - Cosmic Experience Controller
 * Orchestrates all modules for the ultimate gallery experience
 * @author Thomas J Butler
 * @version 8.0.0
 */

// Import all modules
import { GalaxyEngine } from './core/GalaxyEngine.js';
import { ParticleSystem } from './core/ParticleSystem.js';
import { AudioEngine } from './core/AudioEngine.js';
import { NavigationModes } from './core/NavigationModes.js';
import { LightingEngine } from './effects/LightingEngine.js';
import { ImageMorpher } from './effects/ImageMorpher.js';
import { ColorExtractor } from './effects/ColorExtractor.js';

class CosmicGallery {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.images = [];
        this.currentImageIndex = 0;
        
        // Performance monitoring
        this.stats = {
            fps: 60,
            loadTime: 0,
            imageCount: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('🌌 Initializing Cosmic Gallery...');
        
        try {
            // Show loading screen
            this.showLoading(true);
            
            // Initialize core modules
            await this.initializeModules();
            
            // Load gallery images
            await this.loadGalleryImages();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start experience
            this.startExperience();
            
            this.initialized = true;
            console.log('✨ Cosmic Gallery initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showError('Failed to initialize the cosmic experience. Falling back to simple gallery.');
            
            // Fallback to simple gallery
            this.fallbackToSimpleGallery();
        }
    }
    
    async initializeModules() {
        const startTime = performance.now();
        
        // Initialize Galaxy Engine (WebGL renderer)
        const container = document.getElementById('galaxy-container');
        this.modules.galaxy = new GalaxyEngine(container);
        
        // Initialize Particle System
        this.modules.particles = new ParticleSystem(this.modules.galaxy.scene);
        
        // Initialize Audio Engine
        this.modules.audio = new AudioEngine();
        
        // Initialize Lighting Engine
        this.modules.lighting = new LightingEngine(
            this.modules.galaxy.scene,
            this.modules.galaxy.camera
        );
        
        // Initialize Navigation Modes
        this.modules.navigation = new NavigationModes(
            this.modules.galaxy,
            this.modules.audio
        );
        
        // Initialize Image Morpher
        this.modules.morpher = new ImageMorpher();
        
        // Initialize Color Extractor
        this.modules.colorExtractor = new ColorExtractor();
        
        // Connect modules
        this.connectModules();
        
        this.stats.loadTime = performance.now() - startTime;
        console.log(`Modules initialized in ${this.stats.loadTime.toFixed(2)}ms`);
    }
    
    connectModules() {
        // Connect particle system to galaxy events
        window.addEventListener('galaxyImageClick', (e) => {
            const { mesh, imageData } = e.detail;
            this.onImageClick(mesh, imageData);
        });
        
        // Update particle system in render loop
        this.modules.galaxy.updateCallbacks = this.modules.galaxy.updateCallbacks || [];
        this.modules.galaxy.updateCallbacks.push((time) => {
            this.modules.particles.update(time);
            this.modules.lighting.update(time);
        });
    }
    
    async loadGalleryImages() {
        // Get all image elements from the gallery
        const galleryElement = document.querySelector('.gallery');
        const imageElements = galleryElement.querySelectorAll('img');
        
        this.stats.imageCount = imageElements.length;
        console.log(`Loading ${this.stats.imageCount} images...`);
        
        // Extract image data and colors
        const imagePromises = Array.from(imageElements).map(async (img, index) => {
            try {
                // Wait for image to load
                await this.waitForImage(img);
                
                // Extract colors
                const colors = await this.modules.colorExtractor.extractColors(img);
                
                // Store image data
                const imageData = {
                    element: img,
                    index: index,
                    src: img.src,
                    alt: img.alt,
                    colors: colors,
                    mood: this.modules.colorExtractor.getImageMood(colors)
                };
                
                this.images.push(imageData);
                
                // Update loading progress
                this.updateLoadingProgress((index + 1) / this.stats.imageCount);
                
                return imageData;
            } catch (error) {
                console.error(`Failed to load image ${index}:`, error);
                return null;
            }
        });
        
        const results = await Promise.all(imagePromises);
        
        // Filter out null results (failed images)
        const validImages = results.filter(img => img !== null);
        console.log(`Successfully loaded ${validImages.length} out of ${this.stats.imageCount} images`);
        
        // Load images into galaxy
        this.modules.galaxy.loadImages(imageElements);
        
        // Hide original gallery
        galleryElement.style.display = 'none';
    }
    
    waitForImage(img, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (img.complete) {
                resolve();
            } else {
                const timeoutId = setTimeout(() => {
                    console.warn(`Image load timeout: ${img.src}`);
                    resolve(); // Resolve anyway to continue loading
                }, timeout);
                
                const handleLoad = () => {
                    clearTimeout(timeoutId);
                    resolve();
                };
                
                const handleError = () => {
                    clearTimeout(timeoutId);
                    console.warn(`Image load error: ${img.src}`);
                    resolve(); // Resolve anyway to continue loading
                };
                
                img.addEventListener('load', handleLoad, { once: true });
                img.addEventListener('error', handleError, { once: true });
            }
        });
    }
    
    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Update lighting
            this.modules.lighting.updateCursorLight(x, y);
            
            // Update particles
            this.modules.particles.setMousePosition(
                e.clientX / window.innerWidth,
                e.clientY / window.innerHeight
            );
        });
        
        // Navigation mode changes
        document.querySelectorAll('.nav-mode').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.modules.lighting.setMode(mode);
            });
        });
        
        // Audio toggle
        const audioToggle = document.getElementById('audio-toggle');
        audioToggle?.addEventListener('click', () => {
            this.modules.audio.playClickSound({ x: 0, y: 0, z: 0 });
        });
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Touch gestures
        this.setupTouchGestures();
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupKeyboardShortcuts() {
        const shortcuts = {
            'Escape': () => this.closeLightbox(),
            'ArrowLeft': () => this.navigateImages(-1),
            'ArrowRight': () => this.navigateImages(1),
            'Space': (e) => {
                e.preventDefault();
                this.toggleAutoplay();
            },
            'M': () => this.modules.audio.toggle(),
            'F': () => this.toggleFullscreen(),
            'H': () => this.showHelp(),
            'R': () => this.randomizeView()
        };
        
        document.addEventListener('keydown', (e) => {
            const handler = shortcuts[e.key];
            if (handler) handler(e);
        });
    }
    
    setupTouchGestures() {
        let touchStart = null;
        let touchEnd = null;
        
        document.addEventListener('touchstart', (e) => {
            touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
        });
        
        document.addEventListener('touchend', (e) => {
            if (!touchStart) return;
            
            touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            };
            
            this.handleGesture(touchStart, touchEnd);
            touchStart = null;
        });
    }
    
    handleGesture(start, end) {
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        const deltaTime = end.time - start.time;
        
        // Swipe detection
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
            if (deltaX > 0) {
                this.navigateImages(-1);
            } else {
                this.navigateImages(1);
            }
        }
        
        // Pinch zoom would be handled here
    }
    
    startExperience() {
        // Hide loading screen with dramatic effect
        setTimeout(() => {
            this.showLoading(false);
            
            // Play entrance sound
            this.modules.audio.playTransitionSound('', 'grid');
            
            // Show gesture hint
            this.showGestureHint();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
        }, 500);
    }
    
    onImageClick(mesh, imageData) {
        // Create particle explosion
        this.modules.particles.createExplosion(mesh.position, {
            color: imageData.colors?.[0]?.threeColor || new THREE.Color(0x6366f1),
            particleCount: 500
        });
        
        // Play click sound
        this.modules.audio.playClickSound(mesh.position);
        
        // Create light pulse
        this.modules.lighting.pulseLight(mesh.position);
        
        // Show image details
        this.showImageDetails(imageData);
    }
    
    showImageDetails(imageData) {
        // Create details overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-details-overlay';
        overlay.innerHTML = `
            <div class="image-details">
                <button class="close-details">&times;</button>
                <img src="${imageData.element.src}" alt="${imageData.element.alt}">
                <div class="details-content">
                    <h2>${imageData.element.alt}</h2>
                    <div class="color-palette">
                        ${imageData.colors.map(color => `
                            <div class="color-swatch" style="background: ${color.hex}"></div>
                        `).join('')}
                    </div>
                    <p class="mood">Mood: ${imageData.mood.mood}</p>
                    <div class="actions">
                        <button class="action-morph">Morph to Next</button>
                        <button class="action-particles">Dissolve</button>
                        <button class="action-share">Share</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Fade in
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        // Setup actions
        overlay.querySelector('.close-details').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        });
        
        overlay.querySelector('.action-morph')?.addEventListener('click', () => {
            this.morphToNext(imageData);
        });
        
        overlay.querySelector('.action-particles')?.addEventListener('click', () => {
            this.dissolveImage(imageData);
        });
        
        overlay.querySelector('.action-share')?.addEventListener('click', () => {
            this.shareImage(imageData);
        });
    }
    
    morphToNext(imageData) {
        const currentIndex = this.images.findIndex(img => img === imageData);
        const nextIndex = (currentIndex + 1) % this.images.length;
        const nextImage = this.images[nextIndex];
        
        const currentMesh = this.modules.galaxy.images[currentIndex];
        const nextMesh = this.modules.galaxy.images[nextIndex];
        
        if (currentMesh && nextMesh) {
            this.modules.morpher.morphImages(currentMesh, nextMesh, {
                duration: 2000,
                onComplete: () => {
                    console.log('Morph complete!');
                }
            });
        }
    }
    
    dissolveImage(imageData) {
        const index = this.images.findIndex(img => img === imageData);
        const mesh = this.modules.galaxy.images[index];
        
        if (mesh) {
            this.modules.particles.createDissolveEffect(mesh, {
                duration: 2000,
                particleCount: 10000,
                onComplete: () => {
                    setTimeout(() => {
                        this.modules.particles.createDissolveEffect(mesh, {
                            direction: 'in',
                            duration: 2000
                        });
                    }, 500);
                }
            });
        }
    }
    
    shareImage(imageData) {
        const shareData = {
            title: 'Big Bang Gallery - Cosmic Art',
            text: `Check out this amazing cosmic artwork: ${imageData.element.alt}`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback to copy link
            navigator.clipboard.writeText(shareData.url).then(() => {
                this.showNotification('Link copied to clipboard!');
            });
        }
    }
    
    navigateImages(direction) {
        this.currentImageIndex = (this.currentImageIndex + direction + this.images.length) % this.images.length;
        const targetMesh = this.modules.galaxy.images[this.currentImageIndex];
        
        if (targetMesh) {
            // Smooth camera movement to image
            const camera = this.modules.galaxy.camera;
            gsap.to(camera.position, {
                x: targetMesh.position.x + 200,
                y: targetMesh.position.y,
                z: targetMesh.position.z + 300,
                duration: 1.5,
                ease: "power2.inOut"
            });
            
            // Create trail effect
            this.modules.particles.createTrail(targetMesh, {
                color: this.images[this.currentImageIndex].colors[0]?.threeColor
            });
        }
    }
    
    toggleAutoplay() {
        this.autoplay = !this.autoplay;
        
        if (this.autoplay) {
            this.autoplayInterval = setInterval(() => {
                this.navigateImages(1);
            }, 5000);
            this.showNotification('Autoplay enabled');
        } else {
            clearInterval(this.autoplayInterval);
            this.showNotification('Autoplay disabled');
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    randomizeView() {
        // Random navigation mode
        const modes = ['grid', 'constellation', 'timeline', 'cosmos'];
        const randomMode = modes[Math.floor(Math.random() * modes.length)];
        this.modules.navigation.switchMode(randomMode);
        
        // Random camera position
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 300;
        
        gsap.to(this.modules.galaxy.camera.position, {
            x: Math.cos(angle) * distance,
            y: (Math.random() - 0.5) * 200,
            z: Math.sin(angle) * distance,
            duration: 2,
            ease: "power2.inOut"
        });
    }
    
    showHelp() {
        const helpContent = `
            <div class="help-overlay">
                <div class="help-content">
                    <h2>Cosmic Gallery Controls</h2>
                    <div class="help-section">
                        <h3>Navigation</h3>
                        <p><kbd>1-4</kbd> Switch viewing modes</p>
                        <p><kbd>←/→</kbd> Navigate images</p>
                        <p><kbd>Space</kbd> Toggle autoplay</p>
                        <p><kbd>Scroll</kbd> Zoom in/out</p>
                    </div>
                    <div class="help-section">
                        <h3>Features</h3>
                        <p><kbd>M</kbd> Toggle music</p>
                        <p><kbd>F</kbd> Fullscreen</p>
                        <p><kbd>R</kbd> Random view</p>
                        <p><kbd>H</kbd> Show this help</p>
                    </div>
                    <div class="help-section">
                        <h3>Mouse</h3>
                        <p>Move for dynamic lighting</p>
                        <p>Click images to explore</p>
                        <p>Drag to rotate view</p>
                    </div>
                    <button class="close-help">Got it!</button>
                </div>
            </div>
        `;
        
        const help = document.createElement('div');
        help.innerHTML = helpContent;
        document.body.appendChild(help);
        
        const overlay = help.querySelector('.help-overlay');
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        help.querySelector('.close-help').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => help.remove(), 300);
        });
    }
    
    // UI Helper Methods
    
    showLoading(show) {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.classList.toggle('active', show);
        }
    }
    
    updateLoadingProgress(progress) {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            const text = loading.querySelector('p');
            if (text) {
                text.textContent = `Loading cosmic imagery... ${Math.round(progress * 100)}%`;
            }
        }
    }
    
    showGestureHint() {
        const hint = document.getElementById('gesture-hint');
        if (hint) {
            hint.classList.add('show');
            setTimeout(() => {
                hint.classList.remove('show');
            }, 5000);
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.innerHTML = `
            <div class="error-content">
                <h2>Oops!</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Reload</button>
            </div>
        `;
        document.body.appendChild(error);
    }
    
    // Performance Monitoring
    
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const monitor = () => {
            const currentTime = performance.now();
            frames++;
            
            if (currentTime >= lastTime + 1000) {
                this.stats.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
                
                // Log performance stats
                if (this.stats.fps < 30) {
                    console.warn(`Low FPS detected: ${this.stats.fps}`);
                }
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }
    
    onResize() {
        // Update all modules for new window size
        if (this.modules.galaxy) {
            this.modules.galaxy.onWindowResize();
        }
    }
    
    // Cleanup
    
    dispose() {
        // Stop all animations
        gsap.globalTimeline.clear();
        
        // Dispose all modules
        Object.values(this.modules).forEach(module => {
            if (module.dispose) module.dispose();
        });
        
        // Clear intervals
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('resize', this.onResize);
    }
    
    fallbackToSimpleGallery() {
        console.log('Falling back to simple gallery view...');
        
        // Hide loading indicator
        this.showLoading(false);
        
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
        
        // Show the original gallery
        const gallery = document.querySelector('.gallery');
        if (gallery) {
            gallery.style.display = 'grid';
            gallery.style.opacity = '1';
            
            // Add basic hover effects
            const galleryItems = gallery.querySelectorAll('.gallery-item');
            galleryItems.forEach(item => {
                item.style.transition = 'all 0.3s ease';
                
                item.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                });
                
                item.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        }
    }
}

// Initialize gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cosmicGallery = new CosmicGallery();
    
    // Expose for debugging
    window.debugGallery = () => {
        console.log('🌌 Cosmic Gallery Debug Info:');
        console.log('Modules:', window.cosmicGallery.modules);
        console.log('Images:', window.cosmicGallery.images);
        console.log('Stats:', window.cosmicGallery.stats);
    };
});
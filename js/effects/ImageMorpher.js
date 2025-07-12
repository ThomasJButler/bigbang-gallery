/**
 * ImageMorpher.js - Smooth morphing transitions between images
 * Uses canvas pixel manipulation for fluid transformations
 */

export class ImageMorpher {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.morphCanvas = document.createElement('canvas');
        this.morphCtx = this.morphCanvas.getContext('2d');
        
        // Morph parameters
        this.particleSize = 2;
        this.particleCount = 5000;
        this.morphDuration = 2000;
        
        // Active morphs
        this.activeMorphs = new Map();
        
        this.init();
    }
    
    init() {
        // Set canvas size
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.morphCanvas.width = 512;
        this.morphCanvas.height = 512;
        
        // Hidden canvases for processing
        this.canvas.style.display = 'none';
        this.morphCanvas.style.display = 'none';
        document.body.appendChild(this.canvas);
        document.body.appendChild(this.morphCanvas);
    }
    
    async morphImages(mesh1, mesh2, options = {}) {
        const {
            duration = this.morphDuration,
            particleCount = this.particleCount,
            onProgress = () => {},
            onComplete = () => {}
        } = options;
        
        // Get image data from meshes
        const imageData1 = await this.getImageData(mesh1);
        const imageData2 = await this.getImageData(mesh2);
        
        if (!imageData1 || !imageData2) {
            console.error('Failed to get image data for morphing');
            return;
        }
        
        // Create morph particles
        const particles = this.createMorphParticles(imageData1, imageData2, particleCount);
        
        // Create morph animation
        const morphId = `${mesh1.uuid}-${mesh2.uuid}`;
        const morph = {
            particles,
            mesh1,
            mesh2,
            startTime: Date.now(),
            duration,
            onProgress,
            onComplete
        };
        
        this.activeMorphs.set(morphId, morph);
        
        // Start morphing
        this.animateMorph(morphId);
        
        return morphId;
    }
    
    async getImageData(mesh) {
        if (!mesh.material || !mesh.material.map) return null;
        
        const texture = mesh.material.map;
        const image = texture.image;
        
        if (!image) return null;
        
        // Draw image to canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(
            image,
            0, 0,
            image.width, image.height,
            0, 0,
            this.canvas.width, this.canvas.height
        );
        
        // Get pixel data
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    createMorphParticles(imageData1, imageData2, count) {
        const particles = [];
        const width = imageData1.width;
        const height = imageData1.height;
        const data1 = imageData1.data;
        const data2 = imageData2.data;
        
        // Sample pixels from both images
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const index = (y * width + x) * 4;
            
            // Get colors from both images
            const color1 = {
                r: data1[index],
                g: data1[index + 1],
                b: data1[index + 2],
                a: data1[index + 3]
            };
            
            const color2 = {
                r: data2[index],
                g: data2[index + 1],
                b: data2[index + 2],
                a: data2[index + 3]
            };
            
            // Skip transparent pixels
            if (color1.a < 10 && color2.a < 10) continue;
            
            particles.push({
                // Starting position (from image 1)
                x1: x,
                y1: y,
                color1: color1,
                
                // Ending position (to image 2)
                x2: x + (Math.random() - 0.5) * 20, // Add some randomness
                y2: y + (Math.random() - 0.5) * 20,
                color2: color2,
                
                // Current position
                x: x,
                y: y,
                color: { ...color1 },
                
                // Physics
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                
                // Timing
                delay: Math.random() * 0.3,
                size: this.particleSize + Math.random() * 2
            });
        }
        
        return particles;
    }
    
    animateMorph(morphId) {
        const morph = this.activeMorphs.get(morphId);
        if (!morph) return;
        
        const elapsed = Date.now() - morph.startTime;
        const progress = Math.min(elapsed / morph.duration, 1);
        
        // Clear morph canvas
        this.morphCtx.clearRect(0, 0, this.morphCanvas.width, this.morphCanvas.height);
        
        // Update and draw particles
        morph.particles.forEach(particle => {
            // Calculate particle progress with delay
            const particleProgress = Math.max(0, Math.min(1, (progress - particle.delay) / (1 - particle.delay)));
            
            // Morph position
            particle.x = this.lerp(particle.x1, particle.x2, this.easeInOutCubic(particleProgress));
            particle.y = this.lerp(particle.y1, particle.y2, this.easeInOutCubic(particleProgress));
            
            // Add physics-based movement
            particle.x += particle.vx * (1 - particleProgress);
            particle.y += particle.vy * (1 - particleProgress);
            
            // Morph color
            particle.color.r = this.lerp(particle.color1.r, particle.color2.r, particleProgress);
            particle.color.g = this.lerp(particle.color1.g, particle.color2.g, particleProgress);
            particle.color.b = this.lerp(particle.color1.b, particle.color2.b, particleProgress);
            particle.color.a = this.lerp(particle.color1.a, particle.color2.a, particleProgress);
            
            // Draw particle
            this.drawParticle(particle);
        });
        
        // Update mesh textures
        this.updateMeshTexture(morph.mesh1, morph.mesh2, progress);
        
        // Callback
        morph.onProgress(progress);
        
        // Continue or complete
        if (progress < 1) {
            requestAnimationFrame(() => this.animateMorph(morphId));
        } else {
            this.completeMorph(morphId);
        }
    }
    
    drawParticle(particle) {
        const { x, y, color, size } = particle;
        
        // Create gradient for soft particles
        const gradient = this.morphCtx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        
        this.morphCtx.fillStyle = gradient;
        this.morphCtx.fillRect(x - size, y - size, size * 2, size * 2);
    }
    
    updateMeshTexture(mesh1, mesh2, progress) {
        // Create data texture from morph canvas
        const morphTexture = new THREE.CanvasTexture(this.morphCanvas);
        morphTexture.needsUpdate = true;
        
        // Blend between original and morph texture
        if (progress < 0.5) {
            // First half: fade out mesh1
            mesh1.material.opacity = 1 - progress * 2;
            mesh1.material.transparent = true;
        } else {
            // Second half: fade in mesh2
            mesh2.material.map = morphTexture;
            mesh2.material.opacity = (progress - 0.5) * 2;
            mesh2.material.transparent = true;
            mesh2.visible = true;
        }
    }
    
    completeMorph(morphId) {
        const morph = this.activeMorphs.get(morphId);
        if (!morph) return;
        
        // Reset meshes
        morph.mesh1.material.opacity = 1;
        morph.mesh1.material.transparent = false;
        morph.mesh2.material.opacity = 1;
        morph.mesh2.material.transparent = false;
        
        // Callback
        morph.onComplete();
        
        // Clean up
        this.activeMorphs.delete(morphId);
    }
    
    // Advanced morphing effects
    
    pixelSort(mesh, options = {}) {
        const {
            threshold = 128,
            vertical = true,
            duration = 1000,
            onComplete = () => {}
        } = options;
        
        this.getImageData(mesh).then(imageData => {
            if (!imageData) return;
            
            const sorted = this.sortPixels(imageData, threshold, vertical);
            const sortedTexture = new THREE.DataTexture(
                sorted.data,
                sorted.width,
                sorted.height,
                THREE.RGBAFormat
            );
            
            // Animate transition
            const originalMap = mesh.material.map;
            let progress = 0;
            
            const animate = () => {
                progress += 16 / duration;
                progress = Math.min(progress, 1);
                
                mesh.material.map = progress < 0.5 ? originalMap : sortedTexture;
                mesh.material.needsUpdate = true;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    onComplete();
                }
            };
            
            animate();
        });
    }
    
    sortPixels(imageData, threshold, vertical) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        
        if (vertical) {
            // Sort columns
            for (let x = 0; x < width; x++) {
                const column = [];
                
                for (let y = 0; y < height; y++) {
                    const index = (y * width + x) * 4;
                    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    
                    if (brightness > threshold) {
                        column.push({
                            r: data[index],
                            g: data[index + 1],
                            b: data[index + 2],
                            a: data[index + 3],
                            brightness
                        });
                    }
                }
                
                // Sort by brightness
                column.sort((a, b) => a.brightness - b.brightness);
                
                // Write back
                let columnIndex = 0;
                for (let y = 0; y < height; y++) {
                    const index = (y * width + x) * 4;
                    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    
                    if (brightness > threshold && columnIndex < column.length) {
                        const pixel = column[columnIndex++];
                        data[index] = pixel.r;
                        data[index + 1] = pixel.g;
                        data[index + 2] = pixel.b;
                        data[index + 3] = pixel.a;
                    }
                }
            }
        }
        
        return new ImageData(data, width, height);
    }
    
    glitchTransition(mesh1, mesh2, options = {}) {
        const {
            duration = 1500,
            intensity = 0.5,
            onComplete = () => {}
        } = options;
        
        const startTime = Date.now();
        
        const glitch = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Glitch intensity over time
            const glitchAmount = Math.sin(progress * Math.PI) * intensity;
            
            // RGB shift
            mesh1.material.uniforms = mesh1.material.uniforms || {};
            mesh1.material.uniforms.rgbShift = { value: glitchAmount * 0.01 };
            
            // Scanlines
            mesh1.material.uniforms.scanlines = { value: glitchAmount };
            
            // Random displacement
            if (Math.random() < glitchAmount) {
                mesh1.position.x += (Math.random() - 0.5) * 10;
                mesh1.position.y += (Math.random() - 0.5) * 10;
                
                // Reset position
                setTimeout(() => {
                    mesh1.position.x -= (Math.random() - 0.5) * 10;
                    mesh1.position.y -= (Math.random() - 0.5) * 10;
                }, 50);
            }
            
            // Switch meshes at midpoint
            if (progress > 0.5 && mesh1.visible) {
                mesh1.visible = false;
                mesh2.visible = true;
            }
            
            if (progress < 1) {
                requestAnimationFrame(glitch);
            } else {
                // Clean up
                delete mesh1.material.uniforms;
                mesh1.visible = false;
                mesh2.visible = true;
                onComplete();
            }
        };
        
        glitch();
    }
    
    // Utility functions
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    dispose() {
        // Clean up canvases
        this.canvas.remove();
        this.morphCanvas.remove();
        
        // Clear active morphs
        this.activeMorphs.clear();
    }
}

// Export for use
window.ImageMorpher = ImageMorpher;
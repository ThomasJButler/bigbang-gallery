/**
 * ParticleSystem.js - Handles particle effects for image transitions
 * Creates magical dissolution and reformation effects
 */

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];
        this.activeEffects = new Map();
        
        // Particle pool for performance
        this.particlePool = [];
        this.maxParticles = 50000;
        
        this.init();
    }
    
    init() {
        // Setup shaders first
        this.particleShader = {
            uniforms: {
                time: { value: 0 },
                size: { value: 2.0 },
                imageTexture: { value: null },
                progress: { value: 0.0 },
                mouse: { value: new THREE.Vector2(0.5, 0.5) },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                uniform float time;
                uniform float progress;
                uniform float size;
                uniform vec2 mouse;
                
                attribute vec3 targetPosition;
                attribute vec3 originalPosition;
                attribute float particleSize;
                attribute float delay;
                
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    vec3 pos = mix(originalPosition, targetPosition, progress);
                    
                    // Add turbulence
                    float turbulence = sin(time * 2.0 + position.x * 0.01) * 50.0 * (1.0 - progress);
                    pos.x += turbulence * 0.5;
                    pos.y += turbulence * 0.3;
                    pos.z += turbulence * 0.2;
                    
                    // Mouse influence
                    vec2 mouseInfluence = (mouse - 0.5) * 200.0 * (1.0 - progress);
                    pos.xy += mouseInfluence;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    gl_PointSize = particleSize * size * (300.0 / -mvPosition.z) * mix(0.5, 1.0, progress);
                    
                    vColor = color;
                    vOpacity = mix(0.0, 1.0, smoothstep(0.0, 0.3, progress));
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `
        };
        
        // Create particle pool after shaders are defined
        this.createParticlePool();
    }
    
    createParticlePool() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxParticles * 3);
        const targetPositions = new Float32Array(this.maxParticles * 3);
        const originalPositions = new Float32Array(this.maxParticles * 3);
        const colors = new Float32Array(this.maxParticles * 3);
        const sizes = new Float32Array(this.maxParticles);
        const delays = new Float32Array(this.maxParticles);
        
        for (let i = 0; i < this.maxParticles; i++) {
            const i3 = i * 3;
            
            // Random initial positions
            positions[i3] = (Math.random() - 0.5) * 1000;
            positions[i3 + 1] = (Math.random() - 0.5) * 1000;
            positions[i3 + 2] = (Math.random() - 0.5) * 1000;
            
            // Initialize other attributes
            targetPositions[i3] = 0;
            targetPositions[i3 + 1] = 0;
            targetPositions[i3 + 2] = 0;
            
            originalPositions[i3] = positions[i3];
            originalPositions[i3 + 1] = positions[i3 + 1];
            originalPositions[i3 + 2] = positions[i3 + 2];
            
            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1;
            
            sizes[i] = Math.random() * 3 + 1;
            delays[i] = Math.random();
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('particleSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: this.particleShader.uniforms,
            vertexShader: this.particleShader.vertexShader,
            fragmentShader: this.particleShader.fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            vertexColors: true,
            depthWrite: false
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
    }
    
    createDissolveEffect(mesh, options = {}) {
        const {
            duration = 2000,
            particleCount = 5000,
            onComplete = () => {},
            direction = 'out'
        } = options;
        
        // Get image data from mesh
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const texture = mesh.material.map;
        
        if (!texture || !texture.image) return;
        
        const img = texture.image;
        canvas.width = Math.min(img.width, 256); // Limit size for performance
        canvas.height = Math.min(img.height, 256);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Create particles based on image
        const particles = [];
        const step = Math.floor((canvas.width * canvas.height) / particleCount);
        
        for (let i = 0; i < pixels.length; i += step * 4) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            
            const r = pixels[i] / 255;
            const g = pixels[i + 1] / 255;
            const b = pixels[i + 2] / 255;
            const a = pixels[i + 3] / 255;
            
            if (a > 0.1) { // Only create particle for visible pixels
                particles.push({
                    x: (x / canvas.width - 0.5) * mesh.geometry.parameters.width,
                    y: -(y / canvas.height - 0.5) * mesh.geometry.parameters.height,
                    z: Math.random() * 10,
                    color: new THREE.Color(r, g, b),
                    size: Math.random() * 3 + 1,
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2
                    )
                });
            }
        }
        
        // Create effect
        const effect = {
            mesh: mesh,
            particles: particles,
            startTime: Date.now(),
            duration: duration,
            direction: direction,
            onComplete: onComplete,
            active: true
        };
        
        this.activeEffects.set(mesh.uuid, effect);
        
        // Hide original mesh when dissolving out
        if (direction === 'out') {
            gsap.to(mesh.material, {
                opacity: 0,
                duration: duration / 1000,
                ease: "power2.in"
            });
        }
        
        return effect;
    }
    
    morphImages(meshFrom, meshTo, options = {}) {
        const {
            duration = 3000,
            onComplete = () => {}
        } = options;
        
        // Dissolve out the first image
        this.createDissolveEffect(meshFrom, {
            duration: duration / 2,
            direction: 'out',
            onComplete: () => {
                // Reform as the second image
                this.createDissolveEffect(meshTo, {
                    duration: duration / 2,
                    direction: 'in',
                    onComplete: onComplete
                });
            }
        });
    }
    
    createExplosion(position, options = {}) {
        const {
            particleCount = 1000,
            color = new THREE.Color(0x6366f1),
            size = 5,
            speed = 10,
            duration = 1000
        } = options;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Start at explosion center
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Random velocities in all directions
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const velocity = speed * (0.5 + Math.random() * 0.5);
            
            velocities[i3] = velocity * Math.sin(phi) * Math.cos(theta);
            velocities[i3 + 1] = velocity * Math.sin(phi) * Math.sin(theta);
            velocities[i3 + 2] = velocity * Math.cos(phi);
            
            // Color with variation
            const colorVariation = 0.3;
            colors[i3] = color.r + (Math.random() - 0.5) * colorVariation;
            colors[i3 + 1] = color.g + (Math.random() - 0.5) * colorVariation;
            colors[i3 + 2] = color.b + (Math.random() - 0.5) * colorVariation;
            
            sizes[i] = size * (0.5 + Math.random() * 0.5);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Animate explosion
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const positions = geometry.attributes.position.array;
            const velocities = geometry.attributes.velocity.array;
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                positions[i3] += velocities[i3] * 0.5;
                positions[i3 + 1] += velocities[i3 + 1] * 0.5;
                positions[i3 + 2] += velocities[i3 + 2] * 0.5;
                
                // Apply gravity
                velocities[i3 + 1] -= 0.1;
                
                // Damping
                velocities[i3] *= 0.98;
                velocities[i3 + 1] *= 0.98;
                velocities[i3 + 2] *= 0.98;
            }
            
            geometry.attributes.position.needsUpdate = true;
            material.opacity = 1 - progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
                geometry.dispose();
                material.dispose();
            }
        };
        
        animate();
    }
    
    createTrail(mesh, options = {}) {
        const {
            color = new THREE.Color(0x6366f1),
            size = 3,
            length = 50,
            duration = 2000
        } = options;
        
        const trail = [];
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(length * 3);
        const colors = new Float32Array(length * 3);
        const sizes = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            const i3 = i * 3;
            positions[i3] = mesh.position.x;
            positions[i3 + 1] = mesh.position.y;
            positions[i3 + 2] = mesh.position.z;
            
            const fade = i / length;
            colors[i3] = color.r * fade;
            colors[i3 + 1] = color.g * fade;
            colors[i3 + 2] = color.b * fade;
            
            sizes[i] = size * fade;
            
            trail.push({
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        const trailMesh = new THREE.Points(geometry, material);
        this.scene.add(trailMesh);
        
        // Update trail as mesh moves
        const updateTrail = () => {
            trail.unshift({
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            });
            trail.pop();
            
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < length; i++) {
                const i3 = i * 3;
                positions[i3] = trail[i].x;
                positions[i3 + 1] = trail[i].y;
                positions[i3 + 2] = trail[i].z;
            }
            
            geometry.attributes.position.needsUpdate = true;
        };
        
        const interval = setInterval(updateTrail, 16);
        
        setTimeout(() => {
            clearInterval(interval);
            this.scene.remove(trailMesh);
            geometry.dispose();
            material.dispose();
        }, duration);
    }
    
    update(time) {
        // Update shader uniforms
        if (this.particleSystem.material.uniforms) {
            this.particleSystem.material.uniforms.time.value = time;
        }
        
        // Update active effects
        for (const [uuid, effect] of this.activeEffects) {
            if (!effect.active) continue;
            
            const elapsed = Date.now() - effect.startTime;
            const progress = Math.min(elapsed / effect.duration, 1);
            
            if (this.particleSystem.material.uniforms) {
                this.particleSystem.material.uniforms.progress.value = 
                    effect.direction === 'out' ? 1 - progress : progress;
            }
            
            if (progress >= 1) {
                effect.active = false;
                this.activeEffects.delete(uuid);
                effect.onComplete();
            }
        }
    }
    
    setMousePosition(x, y) {
        if (this.particleSystem.material.uniforms) {
            this.particleSystem.material.uniforms.mouse.value.set(x, y);
        }
    }
    
    dispose() {
        this.particleSystem.geometry.dispose();
        this.particleSystem.material.dispose();
        this.scene.remove(this.particleSystem);
        this.activeEffects.clear();
    }
}

// Export for use
window.ParticleSystem = ParticleSystem;
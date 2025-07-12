/**
 * NavigationModes.js - Different ways to explore the gallery
 * Provides multiple perspectives and navigation patterns
 */

export class NavigationModes {
    constructor(galaxyEngine, audioEngine) {
        this.galaxy = galaxyEngine;
        this.audio = audioEngine;
        this.currentMode = 'grid';
        this.modes = ['grid', 'constellation', 'timeline', 'cosmos'];
        
        // Animation states
        this.isTransitioning = false;
        this.autoNavigate = false;
        
        // Mode-specific data
        this.constellationConnections = [];
        this.timelineData = [];
        this.cosmosOrbits = [];
        
        this.init();
    }
    
    init() {
        this.setupModeButtons();
        this.setupKeyboardShortcuts();
        this.setupAutoNavigation();
    }
    
    setupModeButtons() {
        const modeButtons = document.querySelectorAll('.nav-mode');
        
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                if (mode && mode !== this.currentMode && !this.isTransitioning) {
                    this.switchMode(mode);
                }
            });
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.isTransitioning) return;
            
            switch(e.key) {
                case '1':
                    this.switchMode('grid');
                    break;
                case '2':
                    this.switchMode('constellation');
                    break;
                case '3':
                    this.switchMode('timeline');
                    break;
                case '4':
                    this.switchMode('cosmos');
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleAutoNavigate();
                    break;
            }
        });
    }
    
    setupAutoNavigation() {
        // Automatic camera movement for ambient mode
        this.autoNavInterval = null;
    }
    
    async switchMode(newMode) {
        if (!this.modes.includes(newMode) || newMode === this.currentMode) return;
        
        this.isTransitioning = true;
        
        // Update UI
        document.querySelectorAll('.nav-mode').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });
        
        // Play transition sound
        if (this.audio) {
            this.audio.playTransitionSound(this.currentMode, newMode);
        }
        
        // Transition effect
        await this.performTransition(this.currentMode, newMode);
        
        // Update galaxy engine
        this.galaxy.changeMode(newMode);
        
        // Apply mode-specific features
        this.applyModeFeatures(newMode);
        
        this.currentMode = newMode;
        this.isTransitioning = false;
        
        // Show mode hint
        this.showModeHint(newMode);
    }
    
    async performTransition(fromMode, toMode) {
        const overlay = document.createElement('div');
        overlay.className = 'mode-transition-overlay';
        document.body.appendChild(overlay);
        
        // Fade in overlay
        gsap.to(overlay, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.in"
        });
        
        // Mode-specific transition effects
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Create transition particles
        const particles = [];
        const particleCount = 100;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 3 + 1,
                color: this.getModeColor(toMode),
                life: 1
            });
        }
        
        // Animate particles
        const animateParticles = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.life})`;
                ctx.fill();
                
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                
                // Wrap around screen
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });
            
            if (particles.some(p => p.life > 0)) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
        
        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fade out overlay
        gsap.to(overlay, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                overlay.remove();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
    }
    
    getModeColor(mode) {
        const colors = {
            grid: { r: 99, g: 102, b: 241 },      // Indigo
            constellation: { r: 236, g: 72, b: 153 }, // Pink
            timeline: { r: 34, g: 197, b: 94 },    // Green
            cosmos: { r: 168, g: 85, b: 247 }      // Purple
        };
        
        return colors[mode] || colors.grid;
    }
    
    applyModeFeatures(mode) {
        // Remove previous mode features
        this.cleanupModeFeatures();
        
        switch(mode) {
            case 'grid':
                this.applyGridFeatures();
                break;
            case 'constellation':
                this.applyConstellationFeatures();
                break;
            case 'timeline':
                this.applyTimelineFeatures();
                break;
            case 'cosmos':
                this.applyCosmosFeatures();
                break;
        }
    }
    
    applyGridFeatures() {
        // Standard grid layout - already handled by galaxy engine
        this.galaxy.controls.autoRotate = false;
        
        // Enable hover wave effect
        this.enableHoverWave();
    }
    
    applyConstellationFeatures() {
        // Create connections between related images
        this.createConstellationConnections();
        
        // Slow auto-rotation
        this.galaxy.controls.autoRotate = true;
        
        // Add twinkling stars
        this.addTwinklingStars();
    }
    
    applyTimelineFeatures() {
        // Create timeline visualization
        this.createTimelineVisualization();
        
        // Side-scrolling camera movement
        this.galaxy.controls.autoRotate = false;
        
        // Add time markers
        this.addTimeMarkers();
    }
    
    applyCosmosFeatures() {
        // Orbital motion for images
        this.createOrbitalMotion();
        
        // Auto-rotation around center
        this.galaxy.controls.autoRotate = true;
        
        // Add cosmic particles
        this.addCosmicParticles();
    }
    
    createConstellationConnections() {
        // Analyze images and create connections based on color similarity
        const images = this.galaxy.images;
        const connections = [];
        
        // Create line geometry for connections
        const material = new THREE.LineBasicMaterial({
            color: 0x6366f1,
            opacity: 0.3,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        // Connect nearby images
        images.forEach((img1, i) => {
            images.forEach((img2, j) => {
                if (i >= j) return;
                
                const distance = img1.position.distanceTo(img2.position);
                if (distance < 400) { // Only connect nearby images
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        img1.position,
                        img2.position
                    ]);
                    
                    const line = new THREE.Line(geometry, material);
                    this.galaxy.scene.add(line);
                    this.constellationConnections.push(line);
                    
                    // Animate connection
                    gsap.from(line.material, {
                        opacity: 0,
                        duration: 1,
                        delay: Math.random() * 0.5
                    });
                }
            });
        });
    }
    
    createTimelineVisualization() {
        // Create timeline axis
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0x34c55e,
            opacity: 0.5,
            transparent: true
        });
        
        const points = [];
        const length = this.galaxy.images.length * 300;
        
        // Main timeline
        points.push(new THREE.Vector3(-length / 2, 0, 0));
        points.push(new THREE.Vector3(length / 2, 0, 0));
        
        geometry.setFromPoints(points);
        const timeline = new THREE.Line(geometry, material);
        this.galaxy.scene.add(timeline);
        this.timelineData.push(timeline);
        
        // Add tick marks
        this.galaxy.images.forEach((img, index) => {
            const tickGeometry = new THREE.BufferGeometry();
            const tickPoints = [
                new THREE.Vector3(img.position.x, -20, 0),
                new THREE.Vector3(img.position.x, 20, 0)
            ];
            tickGeometry.setFromPoints(tickPoints);
            
            const tick = new THREE.Line(tickGeometry, material);
            this.galaxy.scene.add(tick);
            this.timelineData.push(tick);
        });
    }
    
    createOrbitalMotion() {
        const centerPoint = new THREE.Vector3(0, 0, 0);
        const time = Date.now() * 0.001;
        
        this.galaxy.images.forEach((img, index) => {
            const orbit = {
                radius: 300 + (index % 5) * 100,
                speed: 0.1 + (index % 3) * 0.05,
                offset: (index / this.galaxy.images.length) * Math.PI * 2,
                tilt: (index % 4) * 0.2
            };
            
            this.cosmosOrbits.push(orbit);
            
            // Animate orbital motion
            const animateOrbit = () => {
                if (this.currentMode !== 'cosmos') return;
                
                const t = Date.now() * 0.001;
                const angle = orbit.offset + t * orbit.speed;
                
                img.position.x = Math.cos(angle) * orbit.radius;
                img.position.y = Math.sin(angle * orbit.tilt) * orbit.radius * 0.3;
                img.position.z = Math.sin(angle) * orbit.radius;
                
                img.lookAt(centerPoint);
                
                requestAnimationFrame(animateOrbit);
            };
            
            animateOrbit();
        });
    }
    
    enableHoverWave() {
        // Ripple effect from hovered images
        let lastHoveredIndex = -1;
        
        const updateWave = () => {
            if (this.currentMode !== 'grid') return;
            
            this.galaxy.images.forEach((img, index) => {
                if (lastHoveredIndex >= 0) {
                    const distance = Math.abs(index - lastHoveredIndex);
                    const wave = Math.sin(Date.now() * 0.003 - distance * 0.5) * 10;
                    
                    gsap.to(img.position, {
                        z: wave * Math.max(0, 1 - distance * 0.1),
                        duration: 0.5
                    });
                }
            });
            
            requestAnimationFrame(updateWave);
        };
        
        updateWave();
    }
    
    addTwinklingStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 3,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const positions = [];
        const opacities = [];
        
        for (let i = 0; i < 200; i++) {
            positions.push(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            opacities.push(Math.random());
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        starGeometry.setAttribute('opacity', new THREE.Float32BufferAttribute(opacities, 1));
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.galaxy.scene.add(stars);
        
        // Twinkle animation
        const twinkle = () => {
            if (this.currentMode !== 'constellation') return;
            
            const opacityAttr = starGeometry.attributes.opacity;
            for (let i = 0; i < opacityAttr.count; i++) {
                opacityAttr.array[i] = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
            }
            opacityAttr.needsUpdate = true;
            
            requestAnimationFrame(twinkle);
        };
        
        twinkle();
    }
    
    addTimeMarkers() {
        // Create floating year markers using sprites instead of text geometry
        this.galaxy.images.forEach((img, index) => {
            const year = 2020 + Math.floor(index / 12); // Assuming monthly releases
            const month = index % 12 + 1;
            
            // Create canvas for text
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            
            // Draw text
            context.fillStyle = '#34c55e';
            context.font = 'bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(`${year}.${month}`, 128, 32);
            
            // Create sprite
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.7
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(img.position);
            sprite.position.y -= 150;
            sprite.scale.set(100, 25, 1);
            
            this.galaxy.scene.add(sprite);
            this.timelineData.push(sprite);
        });
    }
    
    addCosmicParticles() {
        // Floating space dust
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 2000;
            positions[i3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i3 + 2] = (Math.random() - 0.5) * 2000;
            
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.4, 0.5, 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            sizes[i] = Math.random() * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.galaxy.scene.add(particles);
        
        // Animate drift
        const animateParticles = () => {
            if (this.currentMode !== 'cosmos') return;
            
            particles.rotation.y += 0.0001;
            particles.rotation.x += 0.00005;
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }
    
    showModeHint(mode) {
        const hints = {
            grid: 'Classic grid view - Hover to see wave effects',
            constellation: 'Connected images form constellations',
            timeline: 'Browse chronologically through time',
            cosmos: 'Images orbit in 3D space'
        };
        
        const hint = document.getElementById('gesture-hint');
        if (hint) {
            hint.querySelector('p').textContent = hints[mode];
            hint.classList.add('show');
            
            setTimeout(() => {
                hint.classList.remove('show');
            }, 3000);
        }
    }
    
    toggleAutoNavigate() {
        this.autoNavigate = !this.autoNavigate;
        
        if (this.autoNavigate) {
            this.startAutoNavigation();
        } else {
            this.stopAutoNavigation();
        }
    }
    
    startAutoNavigation() {
        let targetIndex = 0;
        
        this.autoNavInterval = setInterval(() => {
            if (!this.autoNavigate || this.galaxy.images.length === 0) return;
            
            const targetImage = this.galaxy.images[targetIndex];
            const camera = this.galaxy.camera;
            
            // Smooth camera movement to image
            gsap.to(camera.position, {
                x: targetImage.position.x + 200,
                y: targetImage.position.y,
                z: targetImage.position.z + 300,
                duration: 3,
                ease: "power2.inOut"
            });
            
            gsap.to(camera.rotation, {
                x: 0,
                y: Math.atan2(targetImage.position.x, targetImage.position.z),
                z: 0,
                duration: 3,
                ease: "power2.inOut"
            });
            
            targetIndex = (targetIndex + 1) % this.galaxy.images.length;
        }, 5000);
    }
    
    stopAutoNavigation() {
        if (this.autoNavInterval) {
            clearInterval(this.autoNavInterval);
            this.autoNavInterval = null;
        }
    }
    
    cleanupModeFeatures() {
        // Remove constellation connections
        this.constellationConnections.forEach(line => {
            line.geometry.dispose();
            line.material.dispose();
            this.galaxy.scene.remove(line);
        });
        this.constellationConnections = [];
        
        // Remove timeline elements
        this.timelineData.forEach(element => {
            if (element.geometry) element.geometry.dispose();
            if (element.material) element.material.dispose();
            this.galaxy.scene.remove(element);
        });
        this.timelineData = [];
        
        // Reset orbital data
        this.cosmosOrbits = [];
        
        // Stop auto navigation
        this.stopAutoNavigation();
    }
    
    dispose() {
        this.cleanupModeFeatures();
        this.stopAutoNavigation();
    }
}

// Export for use
window.NavigationModes = NavigationModes;
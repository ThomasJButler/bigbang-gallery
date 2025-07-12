/**
 * GalaxyEngine.js - Core WebGL rendering engine for the cosmic gallery
 * Handles the 3D space, camera controls, and image positioning
 */

export class GalaxyEngine {
    constructor(container) {
        this.container = container;
        this.images = [];
        this.imageData = [];
        this.mode = 'grid';
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000011, 0.0008);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 0, 500);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('galaxy-canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Post-processing setup
        this.setupPostProcessing();
        
        // Lighting
        this.setupLighting();
        
        // Background starfield
        this.createStarfield();
        
        // Controls
        this.setupControls();
        
        // Raycaster for mouse interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    }
    
    setupPostProcessing() {
        // For now, we'll skip post-processing as it requires additional Three.js imports
        // In a production environment, you would include:
        // - EffectComposer.js
        // - RenderPass.js
        // - UnrealBloomPass.js
        // These can be loaded separately or via npm modules
        
        // Placeholder for bloom effect
        this.composer = {
            render: () => {
                this.renderer.render(this.scene, this.camera);
            },
            setSize: (width, height) => {
                // No-op for now
            }
        };
    }
    
    setupLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Dynamic point lights that follow cursor
        this.cursorLight = new THREE.PointLight(0x6366f1, 2, 500);
        this.cursorLight.position.set(0, 0, 200);
        this.scene.add(this.cursorLight);
        
        // Rim lighting for depth
        const rimLight1 = new THREE.DirectionalLight(0x4a5568, 0.5);
        rimLight1.position.set(1, 1, 1);
        this.scene.add(rimLight1);
        
        const rimLight2 = new THREE.DirectionalLight(0x2d3748, 0.5);
        rimLight2.position.set(-1, -1, 1);
        this.scene.add(rimLight2);
    }
    
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const starsVertices = [];
        const starsColors = [];
        
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 4000;
            const y = (Math.random() - 0.5) * 4000;
            const z = (Math.random() - 0.5) * 4000;
            
            starsVertices.push(x, y, z);
            
            // Vary star colors slightly
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.2 + 0.5, 0.3, Math.random() * 0.5 + 0.5);
            starsColors.push(color.r, color.g, color.b);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        
        starsMaterial.vertexColors = true;
        
        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starfield);
        
        // Create nebula clouds
        this.createNebulaClouds();
    }
    
    createNebulaClouds() {
        const loader = new THREE.TextureLoader();
        
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.PlaneGeometry(800, 800);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.5, 0.5),
                transparent: true,
                opacity: 0.03,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            
            const cloud = new THREE.Mesh(geometry, material);
            cloud.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 1000 - 500
            );
            cloud.rotation.z = Math.random() * Math.PI;
            
            this.scene.add(cloud);
        }
    }
    
    setupControls() {
        // Custom orbit controls with smooth damping
        this.controls = {
            rotationX: 0,
            rotationY: 0,
            targetRotationX: 0,
            targetRotationY: 0,
            zoom: 1,
            targetZoom: 1,
            autoRotate: true,
            dampingFactor: 0.05
        };
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('wheel', (e) => this.onWheel(e));
        window.addEventListener('click', (e) => this.onClick(e));
        
        // Touch events for mobile
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    loadImages(imageElements) {
        const loader = new THREE.TextureLoader();
        
        imageElements.forEach((img, index) => {
            loader.load(img.src, (texture) => {
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                
                const imageData = {
                    texture: texture,
                    element: img,
                    index: index,
                    width: img.naturalWidth || 300,
                    height: img.naturalHeight || 300
                };
                
                this.imageData.push(imageData);
                this.createImageMesh(imageData);
            });
        });
    }
    
    createImageMesh(imageData) {
        const aspect = imageData.width / imageData.height;
        const geometry = new THREE.PlaneGeometry(200 * aspect, 200);
        
        const material = new THREE.MeshPhysicalMaterial({
            map: imageData.texture,
            transparent: true,
            roughness: 0.3,
            metalness: 0.1,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide,
            emissive: 0x111111,
            emissiveIntensity: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = imageData;
        
        // Position based on current mode
        this.positionImage(mesh, imageData.index);
        
        // Add to scene
        this.images.push(mesh);
        this.scene.add(mesh);
        
        // Entrance animation
        gsap.from(mesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1,
            delay: imageData.index * 0.05,
            ease: "elastic.out(1, 0.5)"
        });
        
        gsap.from(mesh.rotation, {
            z: Math.random() * Math.PI,
            duration: 1,
            delay: imageData.index * 0.05,
            ease: "power2.out"
        });
    }
    
    positionImage(mesh, index) {
        switch (this.mode) {
            case 'grid':
                this.positionGrid(mesh, index);
                break;
            case 'constellation':
                this.positionConstellation(mesh, index);
                break;
            case 'timeline':
                this.positionTimeline(mesh, index);
                break;
            case 'cosmos':
                this.positionCosmos(mesh, index);
                break;
        }
    }
    
    positionGrid(mesh, index) {
        const cols = Math.ceil(Math.sqrt(this.imageData.length));
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        mesh.position.x = (col - cols / 2) * 250;
        mesh.position.y = -(row - cols / 2) * 250;
        mesh.position.z = 0;
    }
    
    positionConstellation(mesh, index) {
        // Create constellation patterns based on image properties
        const angle = (index / this.imageData.length) * Math.PI * 2;
        const radius = 300 + Math.random() * 200;
        const height = (Math.random() - 0.5) * 400;
        
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.y = height;
        mesh.position.z = Math.sin(angle) * radius;
        
        mesh.lookAt(0, 0, 0);
    }
    
    positionTimeline(mesh, index) {
        const spacing = 300;
        mesh.position.x = index * spacing - (this.imageData.length * spacing) / 2;
        mesh.position.y = Math.sin(index * 0.5) * 50;
        mesh.position.z = 0;
        
        mesh.rotation.y = Math.sin(index * 0.5) * 0.3;
    }
    
    positionCosmos(mesh, index) {
        // Spherical distribution
        const phi = Math.acos(1 - 2 * (index + 0.5) / this.imageData.length);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        const radius = 600;
        
        mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
        mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
        mesh.position.z = radius * Math.cos(phi);
        
        mesh.lookAt(0, 0, 0);
    }
    
    changeMode(newMode) {
        this.mode = newMode;
        
        this.images.forEach((mesh, index) => {
            this.positionImage(mesh, index);
            
            // Animate to new position
            gsap.to(mesh.position, {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
                duration: 1.5,
                ease: "power3.inOut"
            });
            
            gsap.to(mesh.rotation, {
                x: mesh.rotation.x,
                y: mesh.rotation.y,
                z: mesh.rotation.z,
                duration: 1.5,
                ease: "power3.inOut"
            });
        });
    }
    
    onMouseMove(event) {
        // Update mouse position for raycasting
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update camera rotation targets
        this.controls.targetRotationX = this.mouse.y * 0.2;
        this.controls.targetRotationY = this.mouse.x * 0.2;
        
        // Update cursor light position
        const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = 200;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        gsap.to(this.cursorLight.position, {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            duration: 0.3
        });
    }
    
    onWheel(event) {
        event.preventDefault();
        this.controls.targetZoom += event.deltaY * 0.001;
        this.controls.targetZoom = Math.max(0.5, Math.min(2, this.controls.targetZoom));
    }
    
    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);
        
        if (intersects.length > 0) {
            const clickedImage = intersects[0].object;
            this.onImageClick(clickedImage);
        }
    }
    
    onImageClick(mesh) {
        // Emit custom event for gallery to handle
        const event = new CustomEvent('galaxyImageClick', {
            detail: {
                mesh: mesh,
                imageData: mesh.userData
            }
        });
        window.dispatchEvent(event);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.touchStart = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length === 1 && this.touchStart) {
            const deltaX = event.touches[0].clientX - this.touchStart.x;
            const deltaY = event.touches[0].clientY - this.touchStart.y;
            
            this.controls.targetRotationY += deltaX * 0.01;
            this.controls.targetRotationX += deltaY * 0.01;
            
            this.touchStart = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }
    
    onTouchEnd(event) {
        this.touchStart = null;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Smooth camera rotation
        this.controls.rotationX += (this.controls.targetRotationX - this.controls.rotationX) * this.controls.dampingFactor;
        this.controls.rotationY += (this.controls.targetRotationY - this.controls.rotationY) * this.controls.dampingFactor;
        
        // Apply rotations
        if (this.controls.autoRotate) {
            this.controls.rotationY += 0.001;
        }
        
        this.camera.position.x = Math.sin(this.controls.rotationY) * 500 * this.controls.zoom;
        this.camera.position.z = Math.cos(this.controls.rotationY) * 500 * this.controls.zoom;
        this.camera.position.y = this.controls.rotationX * 200 * this.controls.zoom;
        this.camera.lookAt(0, 0, 0);
        
        // Smooth zoom
        this.controls.zoom += (this.controls.targetZoom - this.controls.zoom) * this.controls.dampingFactor;
        
        // Animate starfield
        this.starfield.rotation.y += 0.0001;
        this.starfield.rotation.x += 0.00005;
        
        // Hover effects
        this.updateHoverEffects();
        
        // Render
        this.composer.render();
    }
    
    updateHoverEffects() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);
        
        // Reset all images
        this.images.forEach(mesh => {
            gsap.to(mesh.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.3
            });
            
            gsap.to(mesh.material, {
                emissiveIntensity: 0.1,
                duration: 0.3
            });
        });
        
        // Highlight hovered image
        if (intersects.length > 0) {
            const hoveredMesh = intersects[0].object;
            
            gsap.to(hoveredMesh.scale, {
                x: 1.1,
                y: 1.1,
                z: 1.1,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to(hoveredMesh.material, {
                emissiveIntensity: 0.3,
                duration: 0.3
            });
            
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }
    
    dispose() {
        // Cleanup resources
        this.images.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
            if (mesh.material.map) mesh.material.map.dispose();
        });
        
        this.renderer.dispose();
        this.composer.dispose();
    }
}

// Initialize when imported
window.GalaxyEngine = GalaxyEngine;
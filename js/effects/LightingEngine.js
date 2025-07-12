/**
 * LightingEngine.js - Dynamic lighting system
 * Creates atmospheric lighting that responds to user interaction
 */

export class LightingEngine {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.lights = [];
        this.dynamicLights = [];
        this.lightProbes = [];
        
        // Lighting parameters
        this.config = {
            ambientIntensity: 0.4,
            cursorLightIntensity: 2,
            rimLightIntensity: 0.5,
            bloomThreshold: 0.8,
            glowIntensity: 1
        };
        
        this.init();
    }
    
    init() {
        this.setupBaseLighting();
        this.setupDynamicLighting();
        this.setupLightProbes();
        this.setupPostProcessingEffects();
    }
    
    setupBaseLighting() {
        // Ambient light for base illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, this.config.ambientIntensity);
        this.scene.add(this.ambientLight);
        this.lights.push(this.ambientLight);
        
        // Hemisphere light for sky/ground color variation
        this.hemisphereLight = new THREE.HemisphereLight(
            0x6366f1, // Sky color (indigo)
            0x1a1a1a, // Ground color (dark)
            0.3
        );
        this.scene.add(this.hemisphereLight);
        this.lights.push(this.hemisphereLight);
        
        // Key light - main directional light
        this.keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.keyLight.position.set(100, 200, 50);
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 2048;
        this.keyLight.shadow.mapSize.height = 2048;
        this.keyLight.shadow.camera.near = 0.5;
        this.keyLight.shadow.camera.far = 500;
        this.scene.add(this.keyLight);
        this.lights.push(this.keyLight);
        
        // Fill light - softer opposite light
        this.fillLight = new THREE.DirectionalLight(0x4a5568, 0.3);
        this.fillLight.position.set(-100, 100, -50);
        this.scene.add(this.fillLight);
        this.lights.push(this.fillLight);
        
        // Rim lights for edge definition
        this.createRimLights();
    }
    
    createRimLights() {
        const rimPositions = [
            { x: 200, y: 0, z: -200 },
            { x: -200, y: 0, z: -200 },
            { x: 0, y: 200, z: -200 }
        ];
        
        rimPositions.forEach((pos, index) => {
            const rimLight = new THREE.SpotLight(
                0x6366f1,
                this.config.rimLightIntensity,
                500,
                Math.PI / 4,
                0.5,
                1
            );
            rimLight.position.set(pos.x, pos.y, pos.z);
            rimLight.target.position.set(0, 0, 0);
            this.scene.add(rimLight);
            this.scene.add(rimLight.target);
            this.lights.push(rimLight);
        });
    }
    
    setupDynamicLighting() {
        // Cursor light that follows mouse
        this.cursorLight = new THREE.PointLight(
            0x6366f1,
            this.config.cursorLightIntensity,
            300,
            2
        );
        this.cursorLight.position.set(0, 0, 100);
        this.scene.add(this.cursorLight);
        this.dynamicLights.push(this.cursorLight);
        
        // Secondary cursor light for depth
        this.cursorLight2 = new THREE.PointLight(
            0xffffff,
            this.config.cursorLightIntensity * 0.5,
            200,
            2
        );
        this.cursorLight2.position.set(0, 0, 150);
        this.scene.add(this.cursorLight2);
        this.dynamicLights.push(this.cursorLight2);
        
        // Image hover lights
        this.hoverLights = new Map();
    }
    
    setupLightProbes() {
        // Light probes for realistic lighting
        const probePositions = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(500, 0, 0),
            new THREE.Vector3(-500, 0, 0),
            new THREE.Vector3(0, 500, 0),
            new THREE.Vector3(0, -500, 0)
        ];
        
        probePositions.forEach(pos => {
            const probe = new THREE.LightProbe();
            probe.position.copy(pos);
            this.scene.add(probe);
            this.lightProbes.push(probe);
        });
    }
    
    setupPostProcessingEffects() {
        // Custom shader for glow effect
        this.glowShader = {
            uniforms: {
                tDiffuse: { value: null },
                glowColor: { value: new THREE.Color(0x6366f1) },
                glowIntensity: { value: this.config.glowIntensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec3 glowColor;
                uniform float glowIntensity;
                varying vec2 vUv;
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec3 luma = vec3(0.299, 0.587, 0.114);
                    float brightness = dot(texel.rgb, luma);
                    
                    if (brightness > 0.8) {
                        texel.rgb += glowColor * glowIntensity * (brightness - 0.8);
                    }
                    
                    gl_FragColor = texel;
                }
            `
        };
    }
    
    updateCursorLight(mouseX, mouseY) {
        // Convert mouse coordinates to 3D position
        const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = 200;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        // Smooth light movement
        gsap.to(this.cursorLight.position, {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            duration: 0.3,
            ease: "power2.out"
        });
        
        gsap.to(this.cursorLight2.position, {
            x: pos.x * 0.8,
            y: pos.y * 0.8,
            z: pos.z + 50,
            duration: 0.4,
            ease: "power2.out"
        });
        
        // Dynamic light color based on position
        const hue = (mouseX + 1) * 0.5;
        const color = new THREE.Color().setHSL(hue * 0.1 + 0.55, 0.6, 0.6);
        this.cursorLight.color = color;
    }
    
    createImageGlow(mesh, intensity = 1) {
        if (this.hoverLights.has(mesh.uuid)) return;
        
        // Create point light at image position
        const light = new THREE.PointLight(0x6366f1, intensity, 150, 2);
        light.position.copy(mesh.position);
        light.position.z += 50;
        
        this.scene.add(light);
        this.hoverLights.set(mesh.uuid, light);
        
        // Animate light appearance
        gsap.from(light, {
            intensity: 0,
            duration: 0.5,
            ease: "power2.out"
        });
        
        // Add emissive glow to image material
        if (mesh.material) {
            gsap.to(mesh.material, {
                emissiveIntensity: 0.3,
                duration: 0.3
            });
        }
    }
    
    removeImageGlow(mesh) {
        const light = this.hoverLights.get(mesh.uuid);
        if (!light) return;
        
        // Animate light disappearance
        gsap.to(light, {
            intensity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                this.scene.remove(light);
                light.dispose();
                this.hoverLights.delete(mesh.uuid);
            }
        });
        
        // Remove emissive glow
        if (mesh.material) {
            gsap.to(mesh.material, {
                emissiveIntensity: 0.1,
                duration: 0.3
            });
        }
    }
    
    pulseLight(position, color = 0x6366f1, duration = 1000) {
        // Create temporary pulsing light
        const pulseLight = new THREE.PointLight(color, 0, 200, 2);
        pulseLight.position.copy(position);
        this.scene.add(pulseLight);
        
        // Animate pulse
        gsap.to(pulseLight, {
            intensity: 3,
            duration: duration / 2000,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.scene.remove(pulseLight);
                pulseLight.dispose();
            }
        });
        
        // Expand light radius
        gsap.to(pulseLight, {
            distance: 400,
            duration: duration / 1000,
            ease: "power2.out"
        });
    }
    
    createLightningEffect(startPos, endPos) {
        // Create lightning bolt geometry
        const points = this.generateLightningPath(startPos, endPos);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 3,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const lightning = new THREE.Line(geometry, material);
        this.scene.add(lightning);
        
        // Create light flash
        const flashLight = new THREE.PointLight(0xffffff, 5, 500, 0);
        flashLight.position.copy(startPos);
        this.scene.add(flashLight);
        
        // Animate lightning
        const timeline = gsap.timeline({
            onComplete: () => {
                this.scene.remove(lightning);
                this.scene.remove(flashLight);
                geometry.dispose();
                material.dispose();
                flashLight.dispose();
            }
        });
        
        timeline
            .to(material, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in"
            })
            .to(flashLight, {
                intensity: 0,
                duration: 0.3,
                ease: "power2.in"
            }, 0);
    }
    
    generateLightningPath(start, end) {
        const points = [];
        const segments = 10;
        const variance = 30;
        
        points.push(start);
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().lerpVectors(start, end, t);
            
            // Add random offset for lightning effect
            point.x += (Math.random() - 0.5) * variance;
            point.y += (Math.random() - 0.5) * variance;
            point.z += (Math.random() - 0.5) * variance * 0.5;
            
            points.push(point);
        }
        
        points.push(end);
        return points;
    }
    
    setDayNightCycle(enabled) {
        if (enabled) {
            this.dayNightCycle = true;
            this.startDayNightCycle();
        } else {
            this.dayNightCycle = false;
        }
    }
    
    startDayNightCycle() {
        const cycleDuration = 60000; // 1 minute full cycle
        let startTime = Date.now();
        
        const updateCycle = () => {
            if (!this.dayNightCycle) return;
            
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % cycleDuration) / cycleDuration;
            const angle = progress * Math.PI * 2;
            
            // Update sun position
            this.keyLight.position.x = Math.cos(angle) * 200;
            this.keyLight.position.y = Math.sin(angle) * 200 + 100;
            
            // Update light intensities
            const dayIntensity = Math.max(0, Math.sin(angle));
            const nightIntensity = Math.max(0, -Math.sin(angle));
            
            this.keyLight.intensity = dayIntensity * 0.5;
            this.ambientLight.intensity = 0.2 + dayIntensity * 0.2;
            
            // Update sky color
            const skyColor = new THREE.Color();
            skyColor.setHSL(0.6, 0.5, 0.2 + dayIntensity * 0.3);
            this.scene.fog.color = skyColor;
            
            requestAnimationFrame(updateCycle);
        };
        
        updateCycle();
    }
    
    updateLightProbes() {
        // Update light probe data for realistic reflections
        this.lightProbes.forEach(probe => {
            // In a real implementation, this would capture surrounding light
            probe.sh.coefficients[0].setRGB(0.5, 0.5, 0.5);
        });
    }
    
    setMode(mode) {
        // Adjust lighting for different viewing modes
        const configs = {
            grid: {
                ambientIntensity: 0.4,
                keyLightIntensity: 0.5,
                fogDensity: 0.0008
            },
            constellation: {
                ambientIntensity: 0.2,
                keyLightIntensity: 0.3,
                fogDensity: 0.001
            },
            timeline: {
                ambientIntensity: 0.3,
                keyLightIntensity: 0.6,
                fogDensity: 0.0005
            },
            cosmos: {
                ambientIntensity: 0.1,
                keyLightIntensity: 0.2,
                fogDensity: 0.0015
            }
        };
        
        const config = configs[mode] || configs.grid;
        
        gsap.to(this.ambientLight, {
            intensity: config.ambientIntensity,
            duration: 1
        });
        
        gsap.to(this.keyLight, {
            intensity: config.keyLightIntensity,
            duration: 1
        });
        
        gsap.to(this.scene.fog, {
            density: config.fogDensity,
            duration: 1
        });
    }
    
    update(time) {
        // Animate dynamic lights
        this.dynamicLights.forEach((light, index) => {
            if (light.userData.animate) {
                light.intensity = 
                    this.config.cursorLightIntensity * 
                    (0.8 + Math.sin(time * 2 + index) * 0.2);
            }
        });
        
        // Update light probes periodically
        if (Math.floor(time) % 5 === 0) {
            this.updateLightProbes();
        }
    }
    
    dispose() {
        // Clean up all lights
        this.lights.forEach(light => {
            this.scene.remove(light);
            if (light.target) this.scene.remove(light.target);
            light.dispose();
        });
        
        this.dynamicLights.forEach(light => {
            this.scene.remove(light);
            light.dispose();
        });
        
        this.hoverLights.forEach(light => {
            this.scene.remove(light);
            light.dispose();
        });
        
        this.lightProbes.forEach(probe => {
            this.scene.remove(probe);
        });
        
        this.lights = [];
        this.dynamicLights = [];
        this.hoverLights.clear();
        this.lightProbes = [];
    }
}

// Export for use
window.LightingEngine = LightingEngine;
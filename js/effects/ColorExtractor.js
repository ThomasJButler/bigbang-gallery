/**
 * ColorExtractor.js - Analyzes images to extract dominant colors
 * Creates dynamic color palettes for ambient effects
 */

export class ColorExtractor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 128; // Small size for performance
        this.canvas.height = 128;
        
        // Color data cache
        this.colorCache = new Map();
        
        // Analysis parameters
        this.sampleSize = 5000;
        this.colorBuckets = 16;
        
        this.init();
    }
    
    init() {
        // Hidden canvas for processing
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
    }
    
    async extractColors(image, options = {}) {
        const {
            count = 5,
            quality = 10,
            useCache = true
        } = options;
        
        // Check cache
        const cacheKey = image.src || image.uuid;
        if (useCache && this.colorCache.has(cacheKey)) {
            return this.colorCache.get(cacheKey);
        }
        
        // Extract colors
        const colors = await this.analyzeImage(image, count, quality);
        
        // Cache results
        if (useCache) {
            this.colorCache.set(cacheKey, colors);
        }
        
        return colors;
    }
    
    async analyzeImage(image, colorCount, quality) {
        // Handle different image sources
        let img = image;
        if (image.material && image.material.map) {
            img = image.material.map.image;
        }
        
        if (!img) return this.getDefaultPalette();
        
        try {
            // Draw image to canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get pixel data
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const pixels = imageData.data;
        } catch (error) {
            // If CORS error, return a default palette based on image index
            console.warn('CORS error extracting colors, using default palette');
            return this.getDefaultPaletteVariation(image.src || '');
        }
        
        // Sample pixels
        const pixelArray = [];
        for (let i = 0; i < pixels.length; i += quality * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // Skip transparent pixels
            if (a < 125) continue;
            
            pixelArray.push([r, g, b]);
        }
        
        // Use median cut algorithm to find dominant colors
        const colorMap = this.medianCut(pixelArray, colorCount);
        
        // Convert to color objects with additional data
        return colorMap.map(color => {
            const [r, g, b] = color;
            return {
                rgb: { r, g, b },
                hex: this.rgbToHex(r, g, b),
                hsl: this.rgbToHsl(r, g, b),
                brightness: this.getBrightness(r, g, b),
                saturation: this.getSaturation(r, g, b),
                threeColor: new THREE.Color(r / 255, g / 255, b / 255)
            };
        });
    }
    
    medianCut(pixelArray, colorCount) {
        // Implementation of median cut algorithm
        const histogram = this.getHistogram(pixelArray);
        
        if (histogram.length <= colorCount) {
            return histogram.map(h => h.color);
        }
        
        // Sort by color volume
        histogram.sort((a, b) => b.count - a.count);
        
        const boxes = [histogram];
        
        while (boxes.length < colorCount) {
            // Find box with largest volume
            let largestBox = boxes[0];
            let largestIndex = 0;
            let largestVolume = this.getColorVolume(largestBox);
            
            for (let i = 1; i < boxes.length; i++) {
                const volume = this.getColorVolume(boxes[i]);
                if (volume > largestVolume) {
                    largestVolume = volume;
                    largestBox = boxes[i];
                    largestIndex = i;
                }
            }
            
            // Split the largest box
            const [box1, box2] = this.splitBox(largestBox);
            boxes.splice(largestIndex, 1, box1, box2);
        }
        
        // Get average color from each box
        return boxes.map(box => this.getAverageColor(box));
    }
    
    getHistogram(pixelArray) {
        const histogram = {};
        
        pixelArray.forEach(pixel => {
            const [r, g, b] = pixel;
            const key = `${Math.floor(r / this.colorBuckets) * this.colorBuckets},${Math.floor(g / this.colorBuckets) * this.colorBuckets},${Math.floor(b / this.colorBuckets) * this.colorBuckets}`;
            
            if (!histogram[key]) {
                histogram[key] = {
                    color: [r, g, b],
                    count: 0,
                    pixels: []
                };
            }
            
            histogram[key].count++;
            histogram[key].pixels.push(pixel);
        });
        
        return Object.values(histogram);
    }
    
    getColorVolume(box) {
        if (!box || box.length === 0) return 0;
        
        let minR = 255, maxR = 0;
        let minG = 255, maxG = 0;
        let minB = 255, maxB = 0;
        
        box.forEach(item => {
            item.pixels.forEach(pixel => {
                const [r, g, b] = pixel;
                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);
                minG = Math.min(minG, g);
                maxG = Math.max(maxG, g);
                minB = Math.min(minB, b);
                maxB = Math.max(maxB, b);
            });
        });
        
        return (maxR - minR) * (maxG - minG) * (maxB - minB);
    }
    
    splitBox(box) {
        if (!box || box.length === 0) return [[], []];
        
        // Find dimension with largest range
        let minR = 255, maxR = 0;
        let minG = 255, maxG = 0;
        let minB = 255, maxB = 0;
        
        const allPixels = [];
        box.forEach(item => {
            item.pixels.forEach(pixel => {
                allPixels.push(pixel);
                const [r, g, b] = pixel;
                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);
                minG = Math.min(minG, g);
                maxG = Math.max(maxG, g);
                minB = Math.min(minB, b);
                maxB = Math.max(maxB, b);
            });
        });
        
        const rRange = maxR - minR;
        const gRange = maxG - minG;
        const bRange = maxB - minB;
        
        // Sort by largest dimension
        let sortDimension = 0;
        if (gRange > rRange && gRange > bRange) {
            sortDimension = 1;
        } else if (bRange > rRange && bRange > gRange) {
            sortDimension = 2;
        }
        
        allPixels.sort((a, b) => a[sortDimension] - b[sortDimension]);
        
        // Split at median
        const medianIndex = Math.floor(allPixels.length / 2);
        const pixels1 = allPixels.slice(0, medianIndex);
        const pixels2 = allPixels.slice(medianIndex);
        
        return [
            this.getHistogram(pixels1),
            this.getHistogram(pixels2)
        ];
    }
    
    getAverageColor(box) {
        let totalR = 0, totalG = 0, totalB = 0;
        let count = 0;
        
        box.forEach(item => {
            item.pixels.forEach(pixel => {
                const [r, g, b] = pixel;
                totalR += r;
                totalG += g;
                totalB += b;
                count++;
            });
        });
        
        return [
            Math.round(totalR / count),
            Math.round(totalG / count),
            Math.round(totalB / count)
        ];
    }
    
    // Color utility functions
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }
    
    getBrightness(r, g, b) {
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
    
    getSaturation(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        if (max === 0) return 0;
        return delta / max;
    }
    
    getDefaultPalette() {
        return [
            {
                rgb: { r: 99, g: 102, b: 241 },
                hex: '#6366f1',
                hsl: { h: 239, s: 84, l: 67 },
                brightness: 0.5,
                saturation: 0.59,
                threeColor: new THREE.Color(0x6366f1)
            }
        ];
    }
    
    getDefaultPaletteVariation(imageSrc) {
        // Generate varied palettes based on image URL hash
        const hash = imageSrc.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        // Base colors for variations
        const palettes = [
            // Cosmic purple & pink
            [
                { r: 99, g: 102, b: 241 },   // Indigo
                { r: 236, g: 72, b: 153 },   // Pink
                { r: 168, g: 85, b: 247 },   // Purple
                { r: 129, g: 140, b: 248 },  // Light indigo
                { r: 244, g: 114, b: 182 }   // Light pink
            ],
            // Ocean blues & greens
            [
                { r: 59, g: 130, b: 246 },   // Blue
                { r: 34, g: 197, b: 94 },    // Green
                { r: 6, g: 182, b: 212 },    // Cyan
                { r: 96, g: 165, b: 250 },   // Light blue
                { r: 52, g: 211, b: 153 }    // Emerald
            ],
            // Sunset oranges & reds
            [
                { r: 251, g: 146, b: 60 },   // Orange
                { r: 239, g: 68, b: 68 },    // Red
                { r: 245, g: 158, b: 11 },   // Amber
                { r: 254, g: 202, b: 202 },  // Light red
                { r: 254, g: 215, b: 170 }   // Light orange
            ],
            // Deep space & nebula
            [
                { r: 31, g: 41, b: 55 },     // Dark blue
                { r: 79, g: 70, b: 229 },    // Electric purple
                { r: 236, g: 72, b: 153 },   // Magenta
                { r: 17, g: 24, b: 39 },     // Deep space
                { r: 249, g: 168, b: 212 }   // Pink nebula
            ],
            // Aurora colors
            [
                { r: 16, g: 185, b: 129 },   // Green aurora
                { r: 99, g: 102, b: 241 },   // Blue aurora
                { r: 217, g: 70, b: 239 },   // Purple aurora
                { r: 34, g: 197, b: 94 },    // Light green
                { r: 147, g: 51, b: 234 }    // Violet
            ]
        ];
        
        // Select palette based on hash
        const paletteIndex = Math.abs(hash) % palettes.length;
        const selectedPalette = palettes[paletteIndex];
        
        // Convert to full color objects
        return selectedPalette.map((color) => {
            const hsl = this.rgbToHsl(color.r, color.g, color.b);
            return {
                rgb: color,
                hex: this.rgbToHex(color.r, color.g, color.b),
                hsl: hsl,
                brightness: this.getBrightness(color.r, color.g, color.b),
                saturation: this.getSaturation(color.r, color.g, color.b),
                threeColor: new THREE.Color(color.r / 255, color.g / 255, color.b / 255)
            };
        });
    }
    
    // Advanced color analysis
    
    getColorHarmony(baseColor) {
        const { h, s, l } = baseColor.hsl;
        
        return {
            complementary: this.hslToRgb((h + 180) % 360, s, l),
            triadic: [
                this.hslToRgb((h + 120) % 360, s, l),
                this.hslToRgb((h + 240) % 360, s, l)
            ],
            analogous: [
                this.hslToRgb((h + 30) % 360, s, l),
                this.hslToRgb((h - 30 + 360) % 360, s, l)
            ],
            splitComplementary: [
                this.hslToRgb((h + 150) % 360, s, l),
                this.hslToRgb((h + 210) % 360, s, l)
            ]
        };
    }
    
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    createGradient(colors, steps = 100) {
        const gradient = [];
        const segmentLength = steps / (colors.length - 1);
        
        for (let i = 0; i < colors.length - 1; i++) {
            const start = colors[i];
            const end = colors[i + 1];
            
            for (let j = 0; j < segmentLength; j++) {
                const t = j / segmentLength;
                gradient.push({
                    r: Math.round(start.rgb.r + (end.rgb.r - start.rgb.r) * t),
                    g: Math.round(start.rgb.g + (end.rgb.g - start.rgb.g) * t),
                    b: Math.round(start.rgb.b + (end.rgb.b - start.rgb.b) * t)
                });
            }
        }
        
        return gradient;
    }
    
    getImageMood(colors) {
        // Analyze colors to determine mood
        const avgBrightness = colors.reduce((sum, c) => sum + c.brightness, 0) / colors.length;
        const avgSaturation = colors.reduce((sum, c) => sum + c.saturation, 0) / colors.length;
        
        let mood = 'neutral';
        
        if (avgBrightness > 0.7 && avgSaturation < 0.3) {
            mood = 'bright and airy';
        } else if (avgBrightness < 0.3 && avgSaturation < 0.3) {
            mood = 'dark and moody';
        } else if (avgSaturation > 0.7) {
            mood = 'vibrant and energetic';
        } else if (avgBrightness > 0.5 && avgSaturation > 0.4) {
            mood = 'warm and inviting';
        } else if (avgBrightness < 0.5 && avgSaturation > 0.4) {
            mood = 'deep and mysterious';
        }
        
        return {
            mood,
            brightness: avgBrightness,
            saturation: avgSaturation,
            energy: avgSaturation * avgBrightness
        };
    }
    
    dispose() {
        this.canvas.remove();
        this.colorCache.clear();
    }
}

// Export for use
window.ColorExtractor = ColorExtractor;
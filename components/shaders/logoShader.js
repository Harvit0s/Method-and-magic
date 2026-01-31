
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'

const LogoShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uGridTexture: null,
    uLiquidTexture: null,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uMouseVel: new THREE.Vector2(0, 0),
    uLiquidLevel: 0.5,
    uGridThreshold: 0.1,
    uLiquidThreshold: 0.1,
    uLiquidScale: new THREE.Vector2(1.0, 1.0), // New: Scale control
    uLiquidOffset: new THREE.Vector2(0.0, 0.0), // New: Offset control
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform sampler2D uGridTexture;
    uniform sampler2D uLiquidTexture;
    uniform vec2 uMouse;
    uniform vec2 uMouseVel;
    uniform float uLiquidLevel;
    uniform float uGridThreshold;
    uniform float uLiquidThreshold;
    uniform vec2 uLiquidScale;
    uniform vec2 uLiquidOffset;

    varying vec2 vUv;

    // --- Noise Functions ---
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
    }

    // Helper to get brightness/alpha
    float getBrightness(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
    }

    void main() {
        // --- 1. Source Sampling ---
        vec4 gridData = texture2D(uGridTexture, vUv);
        
        // Grid Alpha Cleanup (For Black Background)
        // Grid is White lines on Black.
        // We use brightness as alpha. 
        float gridBrightness = getBrightness(gridData.rgb);
        float gridAlpha = smoothstep(0.05, 0.2, gridBrightness);

        // --- 2. Liquid Physics ---
        vec2 uv = vUv;
        float level = uLiquidLevel;
        // A. Inertia / Tilt (Mercury: Heavy, less snappy)
        float tiltStrength = 0.5; // Reduced from 0.8
        float tilt = -uMouseVel.x * tiltStrength * (uv.x - 0.5);
        
        // B. Push (Mercury: High surface tension, harder to push)
        float pushRadius = 0.3; // Slightly wider distribution
        float pushStrength = 0.15; // Reduced from 0.2
        float distToMouseX = abs(uv.x - uMouse.x);
        float displacement = smoothstep(pushRadius, 0.0, distToMouseX) * pushStrength;
        
        // C. Waves (Mercury: Smooth, low frequency, low amplitude)
        // Slower speed, wider waves, smaller height
        float wave = fbm(vec2(uv.x * 2.0 + uTime * 1.0, uTime * 0.5)) * 0.05; 
        
        float currentSurfaceY = level + tilt - displacement + wave;
        float liquidPhysicsMask = 1.0 - smoothstep(currentSurfaceY - 0.01, currentSurfaceY + 0.01, uv.y);

        // --- 3. Liquid Sampling ---
        vec2 centeredUV = uv - 0.5;
        centeredUV /= uLiquidScale; 
        vec2 liquidUV = centeredUV + 0.5 + uLiquidOffset;
        liquidUV += (vec2(wave) * 0.02);

        vec4 liquidData = texture2D(uLiquidTexture, liquidUV);

        // Liquid Chroma Key (Target BLACK)
        // New asset has solid black background.
        vec3 targetKeyColor = vec3(0.0, 0.0, 0.0); 
        float colorDist = distance(liquidData.rgb, targetKeyColor);
        
        // uLiquidThreshold (passed from prop, likely 0.02 or 0.05)
        // Pixels close to black are transparent.
        float liquidKeyAlpha = smoothstep(uLiquidThreshold, uLiquidThreshold + 0.1, colorDist);
        
        // Combine (Note: liquidData.a is likely 1.0 for JPG/Black-BG PNG)
        float liquidAlpha = liquidKeyAlpha;

        // Final Liquid Visibility
        float liquidVisible = liquidPhysicsMask * liquidAlpha;

        // --- 4. Compositing ---
        float finalAlpha = max(gridAlpha, liquidVisible);
        if (finalAlpha < 0.01) discard;
        
        vec3 finalColor = mix(gridData.rgb, liquidData.rgb, liquidVisible);
        
        gl_FragColor = vec4(finalColor, finalAlpha);
        #include <colorspace_fragment>
    }
  `
)

extend({ LogoShaderMaterial })

export { LogoShaderMaterial }

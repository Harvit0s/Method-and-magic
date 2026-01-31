
'use client'

import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { LogoShaderMaterial } from './shaders/logoShader'

// Add props interface
interface LogoMeshProps {
    scale?: [number, number]
    offset?: [number, number]
}

// Define the custom material type to satisfy TypeScript
type LogoMaterialType = THREE.ShaderMaterial & {
    uTime: number
    uMouse: THREE.Vector2
    uMouseVel: THREE.Vector2
    uLiquidLevel: number
    uGridThreshold: number
    uLiquidThreshold: number
    uLiquidScale: THREE.Vector2
    uLiquidOffset: THREE.Vector2
}

const LogoMesh = ({ scale = [1.53, 1.53], offset = [0.00, 0.08] }: LogoMeshProps) => {
    const meshRef = useRef<THREE.Mesh>(null)
    // Fix: Explicitly type the ref so TS knows it has custom uniforms
    const materialRef = useRef<LogoMaterialType>(null)
    const [hovered, setHover] = useState(false)
    const { viewport } = useThree()

    // Load the FIXED transparent assets with cache busting
    // We append a random query string to force the browser to fetch the new files
    const [gridTex, liquidTex] = useTexture(['/grid_fixed.png?v=8', '/liquid_new.png?v=8'])

    const prevMouse = useRef(new THREE.Vector2(0, 0))
    const velocity = useRef(new THREE.Vector2(0, 0))


    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.getElapsedTime()

            // Map mouse from [-1, 1] to [0, 1] for the shader UV space
            // The shader uses 0..1 UVs. state.pointer is -1..1
            const uvMouse = new THREE.Vector2(
                (state.pointer.x + 1) / 2,
                (state.pointer.y + 1) / 2
            )
            materialRef.current.uMouse = uvMouse

            const deltaX = state.pointer.x - prevMouse.current.x
            const deltaY = state.pointer.y - prevMouse.current.y

            prevMouse.current.copy(state.pointer)

            velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, deltaX, 0.1)
            velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, deltaY, 0.1)

            materialRef.current.uMouseVel.set(velocity.current.x * 20.0, velocity.current.y * 20.0)
        }
    })

    return (
        <mesh
            ref={meshRef}
            // Clamp value (Max width ~ 10 units? or maybe tied to height?)
            // If viewport.width > 12, clamp it.
            // On mobile (portrait), width is small (~3-4), so logo fills screen.
            // On desktop (landscape), width is large (~20), so logo becomes huge.
            // Let's cap it at a reasonable physical size relative to viewport.
            // Using a responsive formula:
            scale={[Math.min(viewport.width * 0.9, 8), Math.min(viewport.width * 0.9, 8), 1]}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <planeGeometry args={[1, 1, 32, 32]} />
            {/* 
          // @ts-ignore */}
            <logoShaderMaterial
                ref={materialRef}
                key={LogoShaderMaterial.key}
                transparent={true}
                uGridTexture={gridTex}
                uLiquidTexture={liquidTex}
                uLiquidLevel={0.5} // Lowered to be more malleable/visible range
                uGridThreshold={0.5}
                uLiquidThreshold={0.02} // Very low threshold: Only remove PURE white
                uLiquidScale={new THREE.Vector2(scale[0], scale[1])}
                uLiquidOffset={new THREE.Vector2(offset[0], offset[1])}
            />
        </mesh>
    )
}

export default LogoMesh

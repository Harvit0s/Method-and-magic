'use client'

import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

// Geometry parameters
const HELIX_RADIUS = 2
const HELIX_HEIGHT = 60 // Much Taller
const TURNS = 6 // More turns to cover length
const TUBE_RADIUS = 0.4 // Slightly thicker to show texture
const POINTS_PER_TURN = 60

import { useTexture } from '@react-three/drei'

const HelixObject = () => {
    const groupRef = useRef<THREE.Group>(null)
    const scroll = useScroll()

    // Load branding texture
    const texture = useTexture('/liquid_new.png')
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 8) // Repeat along the tube length

    // Generate valid curves for the tubes
    const { tubeGeo1, tubeGeo2 } = useMemo(() => {
        const points1 = []
        const points2 = []

        const totalPoints = TURNS * POINTS_PER_TURN

        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints
            const angle = t * TURNS * Math.PI * 2
            const y = -t * HELIX_HEIGHT // Go downwards

            // Curve 1
            points1.push(new THREE.Vector3(
                Math.cos(angle) * HELIX_RADIUS,
                y,
                Math.sin(angle) * HELIX_RADIUS
            ))

            // Curve 2 (Offset by PI)
            points2.push(new THREE.Vector3(
                Math.cos(angle + Math.PI) * HELIX_RADIUS,
                y,
                Math.sin(angle + Math.PI) * HELIX_RADIUS
            ))
        }

        const curve1 = new THREE.CatmullRomCurve3(points1)
        const curve2 = new THREE.CatmullRomCurve3(points2)

        return {
            tubeGeo1: new THREE.TubeGeometry(curve1, 128, TUBE_RADIUS, 16, false),
            tubeGeo2: new THREE.TubeGeometry(curve2, 128, TUBE_RADIUS, 16, false)
        }
    }, [])

    // Material with texture
    // Using MeshPhysicalMaterial for glass/liquid feel + texture color
    const material = useMemo(() => new THREE.MeshPhysicalMaterial({
        map: texture,
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    }), [texture])

    useFrame((state) => {
        if (!groupRef.current || !scroll) return

        // Scroll Integration
        // Calculate offset based on scroll progress
        // We want the helix to "screw" upwards as we scroll down, or camera moves down
        // For now, let's rotate it constantly plus scroll influence

        const r1 = scroll.range(0, 1) // Full scroll range

        // Rotate the helix as user scrolls
        groupRef.current.rotation.y = r1 * Math.PI * 4

        // Move helix up/down? Or just have it static and "revealed"?
        // Let's have it statically placed below the logo for now, 
        // effectively appearing as we scroll if the camera moves.
    })

    return (
        <group ref={groupRef} position={[0, -5, 0]}> {/* Positioned below the logo */}
            <mesh geometry={tubeGeo1} material={material} />
            <mesh geometry={tubeGeo2} material={material} />
        </group>
    )
}

export default HelixObject

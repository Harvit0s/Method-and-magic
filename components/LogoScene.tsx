'use client'

import React, { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ScrollControls, Scroll, useScroll, Environment } from '@react-three/drei'
import LogoMesh from './LogoMesh'
import HelixObject from './HelixObject'

// 3D Scene Content (Helix, Logo)
const SceneContent = () => {
    const scroll = useScroll()
    const logoRef = useRef<THREE.Group>(null)
    const helixRef = useRef<THREE.Group>(null)

    useFrame(() => {
        // Timeline:
        // 0.0 - 0.2: Logo Hero.
        // 0.2 - 0.4: Logo leaves, Helix Enters (Solo).
        // 0.4 - 1.0: Content Cards over Helix.

        const r1 = scroll.range(0, 1)

        if (logoRef.current) {
            // Logo Scroll Logic
            // Move up and fade/scale down
            // 0 -> 1 scroll makes logo go from Y=0 to Y=10 (out of view)
            // Move up faster so it's gone by the time Helix is fully in
            logoRef.current.position.y = r1 * 20 // Faster exit

            // Optional: Rotate/Scale based on scroll for "Morph" feel
            const scale = 1 - r1 * 2.0 // Fade out faster
            logoRef.current.scale.setScalar(Math.max(0, scale))
            // Fade out logo? Shader alpha? For now scale is good.
        }

        if (helixRef.current) {
            // Helix Scroll Logic
            // Start closer to view (-8) so it appears immediately
            // Move much further up to show full length
            helixRef.current.position.y = -8 + (r1 * 50)

            // Rotate faster
            helixRef.current.rotation.y = r1 * Math.PI * 10
        }
    })

    return (
        <>
            <group ref={logoRef} position={[0, 0, 0]}>
                <LogoMesh />
            </group>

            <group ref={helixRef}>
                <HelixObject />
            </group>
        </>
    )
}

// HTML Overlay Content with Animations
const HtmlContent = () => {
    const scroll = useScroll()
    const aboutRef = useRef<HTMLDivElement>(null)
    const workRef = useRef<HTMLDivElement>(null)
    const contactRef = useRef<HTMLDivElement>(null)
    const footerRef = useRef<HTMLDivElement>(null)

    useFrame(() => {
        // Animate HTML elements based on scroll ranges
        // Pages = 6.
        // 0-1: Hero
        // 1-2: Helix Solo
        // 2-3: About
        // 3-4: Work
        // 4-5: Contact
        // 5-6: Footer

        // About Section (Left Side)
        // Range: 0.125 -> 0.375 (Duration 0.25)
        if (aboutRef.current) {
            const r = scroll.range(0.125, 0.25)
            // 0 (Start) -> 1 (End)
            // Rotation: Start at 75deg (Front/Side), End at -75deg (Back/Side)
            // This creates a continuous sweep "around" the helix
            const rotY = 75 - (r * 150)

            // Opacity: Peak at 0.5 (Center)
            // sin(0) = 0, sin(PI/2) = 1, sin(PI) = 0
            const opacity = Math.sin(r * Math.PI)

            aboutRef.current.style.transform = `perspective(1000px) rotateY(${rotY}deg) translateZ(${Math.abs(rotY)}px)`
            aboutRef.current.style.opacity = `${opacity}`
            // Reset pointer events when not roughly visible
            aboutRef.current.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        }

        // Work Section (Right Side)
        // Range: 0.275 -> 0.525 (Starts whilst About is finishing)
        if (workRef.current) {
            const r = scroll.range(0.275, 0.25)
            // Rotation: Start at -75 (Front/Side), End at 75 (Back/Side)
            const rotY = -75 + (r * 150)

            const opacity = Math.sin(r * Math.PI)

            workRef.current.style.transform = `perspective(1000px) rotateY(${rotY}deg) translateZ(${Math.abs(rotY)}px)`
            workRef.current.style.opacity = `${opacity}`
            workRef.current.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        }

        // Contact Section (Left Side)
        // Range: 0.425 -> 0.675
        if (contactRef.current) {
            const r = scroll.range(0.425, 0.25)
            const rotY = 75 - (r * 150)

            const opacity = Math.sin(r * Math.PI)

            contactRef.current.style.transform = `perspective(1000px) rotateY(${rotY}deg) translateZ(${Math.abs(rotY)}px)`
            contactRef.current.style.opacity = `${opacity}`
            contactRef.current.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        }

        // Footer (Visible at very end)
        if (footerRef.current) {
            // Fade in during the last 10% of scroll
            const range = scroll.range(0.85, 0.15)
            footerRef.current.style.opacity = `${range}`
        }
    })

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>

            {/* HERO TITLE */}
            <section className="absolute top-0 w-full h-full flex flex-col items-center justify-end pb-12">
                <div className="flex flex-col items-center transition-opacity duration-500">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] text-center mb-8 text-white bg-black/20 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10">
                        METHOD & MAGIC
                    </h1>
                    <div className="flex flex-col items-center gap-3 animate-bounce opacity-70 text-white">
                        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                            <path d="M12 5V19M12 19L5 12M12 19L19 12" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* ABOUT CARD - 0.25 * 600 = 150vh (Center of Range) */}
            <section className="absolute top-[150vh] w-full h-full flex items-center justify-start px-8 md:px-24">
                <div ref={aboutRef} className="max-w-md p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-white origin-right" style={{ opacity: 0 }}>
                    <h2 className="text-3xl font-bold mb-4 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">ABOUT</h2>
                    <p className="text-gray-300 leading-relaxed">
                        We operate at the intersection of rigorous methodology and creative alchemy.
                        Where data hardness meets liquid intuition.
                    </p>
                </div>
            </section>

            {/* WORK CARD - 0.4 * 600 = 240vh */}
            <section className="absolute top-[240vh] w-full h-full flex items-center justify-end px-8 md:px-24">
                <div ref={workRef} className="max-w-md p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-white origin-left text-right" style={{ opacity: 0 }}>
                    <h2 className="text-3xl font-bold mb-4 tracking-widest text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 to-teal-300">WORK</h2>
                    <p className="text-gray-300 leading-relaxed">
                        Impossible objects made real.
                        Quantum interface designs and holographic campaigns.
                        We shape the shapeless.
                    </p>
                </div>
            </section>

            {/* CONTACT CARD - 0.55 * 600 = 330vh */}
            <section className="absolute top-[330vh] w-full h-full flex items-center justify-start px-8 md:px-24">
                <div ref={contactRef} className="max-w-md p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-white origin-right" style={{ opacity: 0 }}>
                    <h2 className="text-3xl font-bold mb-4 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-300">CONTACT</h2>
                    <p className="text-gray-300 leading-relaxed mb-6">
                        Ready to undergo the process? Reach out.
                    </p>
                    <button className="px-6 py-2 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-colors tracking-wider pointer-events-auto">
                        INITIATE
                    </button>
                </div>
            </section>

            {/* FOOTER - Compact End */}
            <section className="absolute top-[510vh] w-full h-[40vh] flex items-end justify-center pb-8">
                <div ref={footerRef} className="text-center opacity-0">
                    <h3 className="text-xl font-bold tracking-[0.2em] text-white/80 mb-4">METHOD & MAGIC</h3>
                    <div className="flex gap-6 text-sm text-gray-400 uppercase tracking-wider justify-center">
                        <a href="#" className="hover:text-white transition-colors pointer-events-auto">Instagram</a>
                        <a href="#" className="hover:text-white transition-colors pointer-events-auto">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors pointer-events-auto">Twitter</a>
                    </div>
                    <p className="text-xs text-gray-600 mt-8">© 2026 Method & Magic. All rights reserved.</p>
                </div>
            </section>
        </div>
    )
}

const LogoScene = () => {
    return (
        <div className="w-full h-screen bg-black">
            <Canvas
                camera={{ fov: 45, position: [0, 0, 10] }} // Switched to perspective for better 3D depth on Helix
                className="w-full h-full"
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Environment preset="city" /> {/* Key for Mercury reflection */}

                <Suspense fallback={null}>
                    <ScrollControls pages={5.5} damping={0.2}>

                        {/* 3D Content */}
                        <Scroll>
                            <SceneContent />
                        </Scroll>

                        {/* HTML Overlay Content */}
                        <Scroll html>
                            <HtmlContent />
                        </Scroll>

                    </ScrollControls>
                </Suspense>
            </Canvas>
        </div>
    )
}

export default LogoScene

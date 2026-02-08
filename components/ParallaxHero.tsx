"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ParallaxHeroProps {
    children: React.ReactNode;
    className?: string;
}

// Smooth lerp function for buttery animations
function lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
}

export function ParallaxHero({ children, className = "" }: ParallaxHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    // Current animated values (for smooth interpolation)
    const currentTransform = useRef({
        rotateX: 8,
        translateY: 0,
        scale: 1,
        shadowBlur: 30,
        shinePosition: 100,
    });

    // Target values (what we're animating towards)
    const targetTransform = useRef({
        rotateX: 8,
        translateY: 0,
        scale: 1,
        shadowBlur: 30,
        shinePosition: 100,
    });

    const [transform, setTransform] = useState({
        rotateX: 8,
        translateY: 0,
        scale: 1,
        shadowBlur: 30,
        shinePosition: 100,
    });

    const updateTargetTransform = useCallback(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate how much of the element is visible
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;

        // Normalized position: -1 (element above viewport) to 1 (element below viewport)
        const normalizedPosition = (elementCenter - viewportCenter) / (windowHeight * 0.45);

        // Clamp the value between -1 and 1
        const clampedPosition = Math.max(-1, Math.min(1, normalizedPosition));

        // Calculate target transforms based on scroll position
        // STRONGER rotateX: starts at 16deg (tilted back), goes to -8deg (tilted forward)
        const rotateX = 4 + clampedPosition * 12;

        // STRONGER translateY: creates dramatic "floating" parallax effect
        const translateY = clampedPosition * 60;

        // scale: more noticeable scaling for depth
        const centeredness = 1 - Math.abs(clampedPosition);
        const scale = 0.94 + centeredness * 0.06;

        // Shadow blur increases as element gets closer (more prominent when centered)
        const shadowBlur = 25 + centeredness * 35;

        // Shine position: moves across the element as you scroll (0 = top, 100 = bottom)
        const shinePosition = 50 + clampedPosition * 60;

        targetTransform.current = { rotateX, translateY, scale, shadowBlur, shinePosition };
    }, []);

    const animate = useCallback(() => {
        // Lerp factor - lower = smoother but slower (0.06 is very smooth)
        const lerpFactor = 0.06;

        const current = currentTransform.current;
        const target = targetTransform.current;

        // Smoothly interpolate all values
        current.rotateX = lerp(current.rotateX, target.rotateX, lerpFactor);
        current.translateY = lerp(current.translateY, target.translateY, lerpFactor);
        current.scale = lerp(current.scale, target.scale, lerpFactor);
        current.shadowBlur = lerp(current.shadowBlur, target.shadowBlur, lerpFactor);
        current.shinePosition = lerp(current.shinePosition, target.shinePosition, lerpFactor);

        // Only update state if values have changed significantly (optimization)
        const hasChanged =
            Math.abs(current.rotateX - transform.rotateX) > 0.01 ||
            Math.abs(current.translateY - transform.translateY) > 0.1 ||
            Math.abs(current.scale - transform.scale) > 0.001 ||
            Math.abs(current.shadowBlur - transform.shadowBlur) > 0.1 ||
            Math.abs(current.shinePosition - transform.shinePosition) > 0.5;

        if (hasChanged) {
            setTransform({ ...current });
        }

        animationRef.current = requestAnimationFrame(animate);
    }, [transform]);

    useEffect(() => {
        // Initial calculation
        updateTargetTransform();

        // Start animation loop
        animationRef.current = requestAnimationFrame(animate);

        // Listen to scroll events (just update target, animation loop handles smoothing)
        const handleScroll = () => {
            updateTargetTransform();
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", updateTargetTransform, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", updateTargetTransform);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [updateTargetTransform, animate]);

    return (
        <div
            ref={containerRef}
            className={`parallax-hero-container ${className}`}
            style={{
                perspective: "1500px",
                perspectiveOrigin: "center center",
            }}
        >
            <div
                className="parallax-hero-inner relative overflow-hidden"
                style={{
                    transform: `
            perspective(1500px)
            rotateX(${transform.rotateX}deg)
            translateY(${transform.translateY}px)
            scale(${transform.scale})
          `,
                    transformOrigin: "center bottom",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    boxShadow: `
            0 ${transform.shadowBlur * 0.5}px ${transform.shadowBlur}px rgba(0, 0, 0, 0.1),
            0 ${transform.shadowBlur * 0.25}px ${transform.shadowBlur * 0.5}px rgba(0, 0, 0, 0.06),
            0 0 0 1px rgba(255, 255, 255, 0.1)
          `,
                    borderRadius: "1rem",
                }}
            >
                {children}
                {/* Animated shine/glare overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(
              ${105 + transform.rotateX * 2}deg,
              transparent 0%,
              transparent ${transform.shinePosition - 15}%,
              rgba(255, 255, 255, 0.08) ${transform.shinePosition - 5}%,
              rgba(255, 255, 255, 0.15) ${transform.shinePosition}%,
              rgba(255, 255, 255, 0.08) ${transform.shinePosition + 5}%,
              transparent ${transform.shinePosition + 15}%,
              transparent 100%
            )`,
                        borderRadius: "1rem",
                    }}
                />
                {/* Top edge highlight */}
                <div
                    className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{
                        background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 255, 255, 0.3) 20%, 
              rgba(255, 255, 255, 0.5) 50%, 
              rgba(255, 255, 255, 0.3) 80%, 
              transparent 100%
            )`,
                    }}
                />
            </div>
        </div>
    );
}

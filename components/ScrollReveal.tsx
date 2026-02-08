"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "fade";
    duration?: number;
    distance?: number;
}

export function ScrollReveal({
    children,
    className = "",
    delay = 0,
    direction = "up",
    duration = 700,
    distance = 40,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const getTransform = () => {
        if (isVisible) return "translate3d(0, 0, 0)";
        switch (direction) {
            case "up":
                return `translate3d(0, ${distance}px, 0)`;
            case "down":
                return `translate3d(0, -${distance}px, 0)`;
            case "left":
                return `translate3d(${distance}px, 0, 0)`;
            case "right":
                return `translate3d(-${distance}px, 0, 0)`;
            case "fade":
                return "translate3d(0, 0, 0)";
            default:
                return `translate3d(0, ${distance}px, 0)`;
        }
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTransform(),
                transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                willChange: "opacity, transform",
            }}
        >
            {children}
        </div>
    );
}

// Staggered children reveal - each child animates with a delay
interface StaggerRevealProps {
    children: ReactNode[];
    className?: string;
    childClassName?: string;
    staggerDelay?: number;
    direction?: "up" | "down" | "left" | "right" | "fade";
    duration?: number;
    distance?: number;
}

export function StaggerReveal({
    children,
    className = "",
    childClassName = "",
    staggerDelay = 100,
    direction = "up",
    duration = 600,
    distance = 30,
}: StaggerRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const getTransform = (visible: boolean) => {
        if (visible) return "translate3d(0, 0, 0)";
        switch (direction) {
            case "up":
                return `translate3d(0, ${distance}px, 0)`;
            case "down":
                return `translate3d(0, -${distance}px, 0)`;
            case "left":
                return `translate3d(${distance}px, 0, 0)`;
            case "right":
                return `translate3d(-${distance}px, 0, 0)`;
            case "fade":
                return "translate3d(0, 0, 0)";
            default:
                return `translate3d(0, ${distance}px, 0)`;
        }
    };

    return (
        <div ref={ref} className={className}>
            {children.map((child, index) => (
                <div
                    key={index}
                    className={childClassName}
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: getTransform(isVisible),
                        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${index * staggerDelay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${index * staggerDelay}ms`,
                        willChange: "opacity, transform",
                    }}
                >
                    {child}
                </div>
            ))}
        </div>
    );
}

// Counter animation for numbers
interface CountUpProps {
    end: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    className?: string;
}

export function CountUp({
    end,
    suffix = "",
    prefix = "",
    duration = 2000,
    className = "",
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                    observer.unobserve(element);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [hasStarted, end, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}{count}{suffix}
        </span>
    );
}

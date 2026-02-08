"use client";

import { useEffect, useRef, useState, RefObject } from "react";

interface UseScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
    options: UseScrollAnimationOptions = {}
): [RefObject<T>, boolean] {
    const { threshold = 0.1, rootMargin = "0px 0px -50px 0px", triggerOnce = true } = options;
    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return [ref, isVisible];
}

// Hook for staggered animations (multiple children)
export function useStaggeredAnimation<T extends HTMLElement = HTMLDivElement>(
    itemCount: number,
    options: UseScrollAnimationOptions & { staggerDelay?: number } = {}
): [RefObject<T>, boolean, (index: number) => string] {
    const { staggerDelay = 100, ...observerOptions } = options;
    const [ref, isVisible] = useScrollAnimation<T>(observerOptions);

    const getStaggerDelay = (index: number): string => {
        return `${index * staggerDelay}ms`;
    };

    return [ref, isVisible, getStaggerDelay];
}

"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";
import { ReactNode } from "react";

interface AnimatedHeroContentProps {
    children?: ReactNode;
}

export function AnimatedHeroContent({ children }: AnimatedHeroContentProps) {
    return (
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
            <ScrollReveal direction="up" delay={0} duration={800} distance={50}>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white">
                    Give your startup a real Runway
                </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150} duration={800} distance={40}>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-2xl text-center">
                    Plan weekly goals, follow through on them, and build a clear record of execution because progress should be visible, not assumed.
                </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300} duration={700} distance={30}>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Link
                        href="/signup"
                        className="group bg-black dark:bg-white dark:text-black text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 hover:shadow-xl text-center relative overflow-hidden"
                    >
                        <span className="relative z-10">Try Runway free</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                    <Link
                        href="#features"
                        className="border-2 border-gray-200 dark:border-gray-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:border-primary/50 hover:shadow-lg text-center"
                    >
                        See features
                    </Link>
                </div>
            </ScrollReveal>

            {children}
        </div>
    );
}

interface AnimatedSectionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "fade";
}

export function AnimatedSection({
    children,
    className = "",
    delay = 0,
    direction = "up"
}: AnimatedSectionProps) {
    return (
        <ScrollReveal
            className={className}
            delay={delay}
            direction={direction}
            duration={700}
            distance={35}
        >
            {children}
        </ScrollReveal>
    );
}

// Animated feature card with hover effects
interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    delay?: number;
}

export function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
    return (
        <ScrollReveal delay={delay} direction="up" duration={600} distance={30}>
            <div className="group p-6 rounded-2xl bg-white dark:bg-[#1a2530] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-[#5f6368] dark:text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </ScrollReveal>
    );
}

// Animated integration logo
interface IntegrationLogoProps {
    icon: string;
    name: string;
    delay?: number;
}

export function IntegrationLogo({ icon, name, delay = 0 }: IntegrationLogoProps) {
    return (
        <ScrollReveal delay={delay} direction="up" duration={500} distance={20}>
            <div className="flex items-center gap-2 text-[#111418] dark:text-white group cursor-pointer">
                <span className="material-symbols-outlined text-2xl text-primary group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </span>
                <span className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                    {name}
                </span>
            </div>
        </ScrollReveal>
    );
}

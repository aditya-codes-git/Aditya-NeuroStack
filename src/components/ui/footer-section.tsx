'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, Zap } from 'lucide-react';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Features', href: '#' },
			{ title: 'Pricing', href: '#' },
			{ title: 'Testimonials', href: '#' },
			{ title: 'Integration', href: '#' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'FAQs', href: '#' },
			{ title: 'About Us', href: '#' },
			{ title: 'Privacy Policy', href: '#' },
			{ title: 'Terms of Services', href: '#' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Blog', href: '#' },
			{ title: 'Changelog', href: '#' },
			{ title: 'Brand', href: '#' },
			{ title: 'Help', href: '#' },
		],
	},
	{
		label: 'Social Links',
		links: [
			{ title: 'Facebook', href: '#', icon: FacebookIcon },
			{ title: 'Instagram', href: '#', icon: InstagramIcon },
			{ title: 'Youtube', href: '#', icon: YoutubeIcon },
			{ title: 'LinkedIn', href: '#', icon: LinkedinIcon },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-border bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/2%),transparent)] px-6 py-12 lg:py-16 mt-20">
			<div className="bg-primary/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8 z-10">
				<AnimatedContainer className="space-y-4">
					<div className="flex items-center gap-2">
                        <Zap className="size-6 text-primary" />
                        <span className="font-bold text-lg text-text-primary tracking-tight">Context<span className="text-primary">Switch</span></span>
                    </div>
					<p className="text-text-secondary mt-8 text-sm md:mt-0 max-w-xs leading-relaxed">
                        Capture, preserve, and instantly resume your work context. Reduce context switching penalties.
					</p>
                    <p className="text-text-muted mt-8 text-xs md:mt-4">
						© {new Date().getFullYear()} ContextSwitch. All rights reserved.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">{section.label}</h3>
								<ul className="text-text-secondary mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-primary inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-2 size-4" />}
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
};

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: 8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid2x2PlusIcon, MenuIcon, Zap } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingHeader() {
	const [open, setOpen] = React.useState(false);
	const navigate = useNavigate();

	const links = [
		{
			label: 'Features',
			href: '#',
		},
		{
			label: 'Solutions',
			href: '#',
		},
		{
			label: 'Pricing',
			href: '#',
		},
	];

	return (
		<header
			className={cn(
				'sticky top-5 z-[100] transition-all duration-300',
				'mx-auto w-[95%] max-w-4xl rounded-2xl border border-white/10 shadow-2xl',
				'bg-white/[0.03] backdrop-blur-2xl ring-1 ring-white/10',
			)}
		>
			<nav className="mx-auto flex items-center justify-between p-2">
				<div 
					className="hover:bg-white/10 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 duration-200 transition-colors group"
					onClick={() => navigate('/')}
				>
					<div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
						<Zap className="size-4 text-primary fill-primary/20" />
					</div>
					<p className="text-base font-bold text-white tracking-tight">
						Context<span className="text-primary">Switch</span>
					</p>
				</div>
				
				<div className="hidden items-center gap-1 lg:flex ml-4">
					{links.map((link) => (
						<a
							key={link.label}
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'sm' }),
								"text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg px-4"
							)}
							href={link.href}
						>
							{link.label}
						</a>
					))}
				</div>

				<div className="flex items-center gap-2">
					<Button 
						size="sm" 
						variant="ghost" 
						className="hidden sm:flex text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
						onClick={() => navigate('/auth')}
					>
						Login
					</Button>
					<Button 
						size="sm" 
						className="bg-primary hover:bg-primary-light text-white rounded-xl px-5 shadow-lg shadow-primary/20"
						onClick={() => navigate('/auth')}
					>
						Get Started
					</Button>
					
					<Sheet open={open} onOpenChange={setOpen}>
						<Button
							size="icon"
							variant="ghost"
							onClick={() => setOpen(!open)}
							className="lg:hidden text-white hover:bg-white/5 rounded-xl"
						>
							<MenuIcon className="size-5" />
						</Button>
						<SheetContent
							className="bg-neutral-950/95 border-r border-white/10 backdrop-blur-2xl"
							showClose={true}
							side="left"
						>
							<div className="flex flex-col gap-6 p-6 mt-12">
								<div className="flex items-center gap-2 mb-4">
									<Zap className="size-6 text-primary" />
									<span className="text-xl font-bold text-white">ContextSwitch</span>
								</div>
								
								<div className="grid gap-y-2">
									{links.map((link) => (
										<a
											key={link.label}
											className={cn(
												buttonVariants({
													variant: 'ghost',
													className: 'justify-start h-12 text-lg rounded-xl',
												}),
												"text-neutral-400 hover:text-white hover:bg-white/5"
											)}
											href={link.href}
											onClick={() => setOpen(false)}
										>
											{link.label}
										</a>
									))}
								</div>
							</div>
							<SheetFooter className="p-6 flex flex-col gap-3 mt-auto">
								<Button 
									variant="outline" 
									className="w-full h-12 rounded-xl border-white/10 text-white bg-transparent hover:bg-white/5"
									onClick={() => navigate('/auth')}
								>
									Sign In
								</Button>
								<Button 
									className="w-full h-12 rounded-xl bg-primary hover:bg-primary-light text-white"
									onClick={() => navigate('/auth')}
								>
									Get Started
								</Button>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</header>
	);
}

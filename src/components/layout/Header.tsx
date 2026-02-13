
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusFront, Menu, MapPin, ExternalLink, ChevronDown, Route as RouteIcon, Bot, Map, Home, LogOut, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { stateTransportLinks } from "@/lib/state-transport-links";
import { Separator } from "../ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
  { href: "/nearby-stops", label: "Nearby", icon: <MapPin className="h-4 w-4" /> },
  { href: "/trip-planner", label: "AI Planner", icon: <Bot className="h-4 w-4" /> },
  { href: "/map-search", label: "Map", icon: <Map className="h-4 w-4" /> },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <>
      {/* Top Accent Bar */}
      <div className="h-1.5 w-full bg-vibrant-gradient sticky top-0 z-[60]" />

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "sticky top-1.5 z-50 w-full transition-all duration-500",
          isScrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-black/5 py-2 shadow-xl"
            : "bg-transparent py-4"
        )}
      >
        <div className="container flex h-14 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-vibrant-gradient p-2 rounded-xl group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-primary/20">
                <BusFront className="h-6 w-6 text-white" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight flex items-center gap-1">
                <span className="text-black">SmartBus</span>
                <span className="text-gradient-vibrant">Connect</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-bold transition-all rounded-xl",
                    pathname === link.href
                      ? "text-primary"
                      : "text-black/70 hover:text-black hover:bg-black/5"
                  )}
                >
                  {pathname === link.href && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {link.label}
                  </span>
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-xl gap-1 text-sm font-bold text-black/70 hover:text-black hover:bg-black/5">
                    Schedules <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-3 rounded-2xl glass border-white/20" align="start">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-violet-500" /> State Transport
                  </DropdownMenuLabel>
                  <ScrollArea className="h-[300px]">
                    <div className="grid gap-1">
                      {stateTransportLinks.map((link) => (
                        <DropdownMenuItem key={link.name} asChild className="rounded-xl focus:bg-primary/10 focus:text-primary transition-colors cursor-pointer group">
                          <Link
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-between w-full px-3 py-2.5"
                          >
                            <span className="text-sm font-medium">{link.name}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="hidden md:flex items-center">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-2xl border border-border/50 p-0 overflow-hidden hover:ring-4 hover:ring-primary/10 transition-all">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                        <AvatarFallback className="bg-vibrant-gradient text-white font-bold">{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-3 rounded-[2rem] glass border-white/20 shadow-2xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-xl">
                          <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                          <AvatarFallback className="bg-primary/10 font-black">{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-sm font-black italic">{user.displayName}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50 mb-2" />
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-primary/5">
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-3 h-4.5 w-4.5 text-primary" />
                        <span className="font-bold text-sm">My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-xl cursor-pointer p-3 text-destructive focus:text-destructive focus:bg-destructive/5">
                      <LogOut className="mr-3 h-4.5 w-4.5" />
                      <span className="font-bold text-sm">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className="rounded-xl px-8 h-10 shadow-lg shadow-primary/30 bg-vibrant-gradient font-black text-xs uppercase tracking-widest border-none hover:scale-105 transition-transform">
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </div>

            <Sheet open={isMenuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden rounded-xl border-border/50 bg-background/50 h-10 w-10 shadow-sm"
                >
                  <Menu className="h-5 w-5 text-black" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 border-l border-white/10 glass-dark">
                <div className="flex flex-col h-full">
                  <div className="p-8 border-b border-white/10">
                    <Link
                      href="/"
                      className="flex items-center space-x-3"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="bg-vibrant-gradient p-2.5 rounded-xl shadow-xl">
                        <BusFront className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-headline font-black text-xl text-white tracking-tighter italic">SmartBus</span>
                    </Link>
                  </div>

                  <ScrollArea className="flex-1 px-4 py-8">
                    <div className="space-y-2 mb-10">
                      <p className="px-5 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Core Navigation</p>
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-5 py-4 text-base font-bold transition-all rounded-[1.25rem]",
                            pathname === link.href
                              ? "bg-vibrant-gradient text-white shadow-xl shadow-primary/20"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className={cn(
                            "p-2 rounded-xl",
                            pathname === link.href ? "bg-white/20" : "bg-white/5"
                          )}>
                            {React.cloneElement(link.icon as React.ReactElement, { className: "h-4.5 w-4.5" })}
                          </span>
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="px-5 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Traffic Schedules</p>
                      <div className="grid gap-2">
                        {stateTransportLinks.slice(0, 6).map((link) => (
                          <Link
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-between px-6 py-4 text-sm font-bold text-white/80 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                          >
                            <span>{link.name}</span>
                            <ExternalLink className="h-4 w-4 text-white/30" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="p-8 border-t border-white/10 bg-black/40">
                    {user ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                          <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-2xl">
                            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                            <AvatarFallback className="bg-white/5 font-black text-white">{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-black text-white leading-none italic">{user.displayName}</p>
                            <p className="text-[10px] font-bold text-white/50 mt-1.5 tracking-wider truncate max-w-[160px]">{user.email}</p>
                          </div>
                        </div>
                        <Button asChild variant="outline" className="w-full rounded-2xl h-12 gap-3 font-bold text-xs uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={() => setMenuOpen(false)}>
                          <Link href="/profile">
                            <User className="h-4 w-4" /> My Profile
                          </Link>
                        </Button>
                        <Button variant="destructive" className="w-full rounded-2xl h-12 gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-destructive/10" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
                          <LogOut className="h-4 w-4" /> Sign Out
                        </Button>
                      </div>
                    ) : (
                      <Button asChild className="w-full h-14 rounded-2xl shadow-2xl shadow-primary/30 bg-vibrant-gradient font-black text-xs uppercase tracking-tighter" onClick={() => setMenuOpen(false)}>
                        <Link href="/login">Unlock All Features</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header >
    </>
  );
}

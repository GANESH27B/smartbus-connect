
import React from "react";
import Link from "next/link";
import { BusFront, ExternalLink, Github, Twitter, Linkedin, Mail, MapPin, Phone, Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border relative overflow-hidden">
      {/* Footer Accent Gradient */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-vibrant-gradient opacity-50" />

      <div className="container mx-auto py-20 px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-vibrant-gradient p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                <BusFront className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-headline font-black tracking-tighter italic">
                SmartBus <span className="text-gradient-vibrant">Connect</span>
              </span>
            </Link>
            <p className="text-base text-muted-foreground leading-relaxed font-medium">
              We're redefining how you navigate the city. Vibrant, intelligent, and always on time.
            </p>
            <div className="flex items-center space-x-4">
              {[
                { icon: <Twitter />, color: "hover:bg-[#1DA1F2] hover:text-white" },
                { icon: <Github />, color: "hover:bg-[#333] hover:text-white" },
                { icon: <Linkedin />, color: "hover:bg-[#0077b5] hover:text-white" }
              ].map((social, i) => (
                <Link key={i} href="#" className={`p-3 rounded-2xl bg-muted transition-all duration-300 ${social.color} shadow-sm`}>
                  {React.cloneElement(social.icon as React.ReactElement, { className: "h-5 w-5" })}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-headline font-black text-xs uppercase tracking-[0.3em] text-foreground opacity-40">The Platform</h3>
            <ul className="space-y-4">
              {[
                { label: "Nearby Stops", href: "/nearby-stops" },
                { label: "AI Trip Planner", href: "/trip-planner" },
                { label: "Interactive Map", href: "/map-search" }
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <h3 className="font-headline font-black text-xs uppercase tracking-[0.3em] text-foreground opacity-40">Knowledge</h3>
            <ul className="space-y-4">
              <li>
                <Link href="https://www.google.com/search?q=official+state+road+transport+corporation+websites" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Official Schedules <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </li>
              {["Help Center", "Privacy Policy", "Terms of Service"].map(link => (
                <li key={link}>
                  <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="font-headline font-black text-xs uppercase tracking-[0.3em] text-foreground opacity-40">Say Hello</h3>
            <ul className="space-y-5">
              <li className="flex items-start space-x-4">
                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-muted-foreground pt-1 leading-relaxed">
                  123 Transit Plaza, Vibrant Avenue <br /> Digital City, ST 56789
                </span>
              </li>
              <li className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-muted-foreground">+1 (555) BUS-LINE</span>
              </li>
              <li className="flex items-center space-x-4">
                <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-muted-foreground truncate">hello@smartbus.connect</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground italic">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span>for Urban Travelers</span>
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            &copy; {year} <span className="text-foreground">SmartBus Connect.</span> All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
    </footer>
  );
}

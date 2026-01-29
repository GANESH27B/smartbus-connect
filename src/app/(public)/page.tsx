
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Route, Bot, MapPin, Shield, Zap, Globe, Users, Clock, Navigation, Star, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const features = [
  {
    icon: <MapPin className="w-10 h-10" />,
    title: "Nearby Stops",
    description: "Instantly discover bus stops around you with precise real-time walking distances.",
    link: "/nearby-stops",
    cta: "Find Stops",
    gradient: "from-rose-500/20 to-orange-500/20",
    glow: "group-hover:shadow-rose-500/30",
    iconColor: "text-rose-500",
    badge: "Fastest",
  },
  {
    icon: <Bot className="w-10 h-10" />,
    title: "AI Trip Planner",
    description: "Our revolutionary AI analyzes traffic and routes to suggest the perfect journey.",
    link: "/trip-planner",
    cta: "Plan Smartly",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    glow: "group-hover:shadow-violet-500/30",
    iconColor: "text-violet-500",
    badge: "Smart",
  },
];

const stats = [
  { label: "Daily Commuters", value: "50K+", icon: <Users className="w-5 h-5 flex-shrink-0" />, color: "text-rose-500" },
  { label: "Active Routes", value: "200+", icon: <Route className="w-5 h-5 flex-shrink-0" />, color: "text-blue-500" },
  { label: "Live Buses", value: "850+", icon: <Navigation className="w-5 h-5 flex-shrink-0" />, color: "text-emerald-500" },
  { label: "Time Saved", value: "30%", icon: <Clock className="w-5 h-5 flex-shrink-0" />, color: "text-amber-500" },
];

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bus');
  const ctaImage = PlaceHolderImages.find(img => img.id === 'cta-background');

  return (
    <div className="flex flex-col relative overflow-hidden bg-background">
      {/* Background Blobs for more color */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-blob [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-blob [animation-delay:4s]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover scale-105 opacity-80"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        </div>

        <div className="container relative z-20 px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8 shadow-lg shadow-primary/5">
              <Sparkles className="w-4 h-4 text-violet-500 fill-violet-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">Premium Commuting Experience</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold font-headline leading-[1.1] mb-8">
              Navigate With <br />
              <span className="text-gradient-vibrant">Vibrant Power.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-xl leading-relaxed font-medium">
              We've brought color and intelligence to urban transit. Track every bus, plan every trip, and enjoy every mile.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Button asChild size="xl" className="rounded-2xl text-lg px-10 shadow-2xl shadow-primary/40 bg-vibrant-gradient hover:scale-105 transition-transform border-none">
                <Link href="/nearby-stops">
                  Find Stops <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Floating Colorful Display Card */}

      </section>

      {/* Re-imagined Stats section with more color */}
      <section className="py-20 relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                <div className="text-center space-y-4 p-6 glass border-none group-hover:bg-white/40 transition-all rounded-[2rem] shadow-none hover:shadow-xl hover:shadow-primary/5">
                  <div className={`mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-black/50 ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <div>
                    <h3 className="text-4xl font-black font-headline tracking-tighter mb-1">{stat.value}</h3>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - More Colorful Cards */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1 rounded-full bg-rose-500/10 text-rose-500 font-black text-xs uppercase tracking-[0.3em] mb-6"
            >
              Our Experience
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black font-headline mb-8 leading-tight italic">
              Designed For The <span className="text-rose-500">Bold</span> Commuter.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We didn't just build a tracker. We built a vibrant companion that guides you through the urban jungle with style and precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="group"
              >
                <Card className={`relative h-full transition-all duration-500 border-none shadow-xl hover:-translate-y-4 rounded-[3rem] overflow-hidden bg-card/40 backdrop-blur-xl ${feature.glow}`}>
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${feature.gradient.replace('/20', '')}`} />
                  <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${feature.gradient} blur-[80px] group-hover:scale-125 transition-transform duration-700`} />

                  <CardHeader className="relative z-10 pt-12 px-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`p-5 ${feature.iconColor} bg-white dark:bg-black/50 rounded-[2rem] shadow-xl group-hover:rotate-6 transition-transform duration-500`}>
                        {feature.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 bg-muted rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {feature.badge}
                      </span>
                    </div>
                    <CardTitle className="text-3xl font-black font-headline tracking-tight">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 px-10 pb-12 flex flex-col min-h-[200px]">
                    <p className="text-lg text-muted-foreground/80 leading-relaxed font-medium mb-10 flex-grow">
                      {feature.description}
                    </p>
                    <Button asChild className="w-full h-14 rounded-2xl group/btn text-base font-black shadow-xl border-none transition-all overflow-hidden" style={{ background: `linear-gradient(to right, ${feature.iconColor.replace('text-', '')}, ${feature.iconColor.replace('text-', '')}dd)` }}>
                      <Link href={feature.link} className="relative z-10 flex items-center justify-center gap-2 text-white">
                        {feature.cta} <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Colorful CTA Container */}
      <section className="py-24 px-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto"
        >
          <div className="relative rounded-[4rem] overflow-hidden p-12 md:p-24 shadow-[0_50px_100px_-20px_rgba(139,92,246,0.3)] min-h-[500px] flex items-center">
            {/* Extremely colorful overlay background */}
            <div className="absolute inset-0 bg-vibrant-gradient z-0 opacity-95" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay opacity-20 z-10" />

            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[100%] bg-white/20 blur-[150px] animate-blob rounded-full z-10" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[80%] bg-rose-400/30 blur-[120px] animate-blob [animation-delay:3s] rounded-full z-10" />

            <div className="relative z-20 grid lg:grid-cols-2 gap-20 items-center w-full">
              <div className="space-y-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/20 border border-white/20 backdrop-blur-md">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Rated 4.9/5 by Users</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black font-headline leading-[1] text-white italic">
                  Don't just commute. <br />
                  <span className="text-yellow-300">Dominate</span> the tracks.
                </h2>
                <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-xl">
                  Ready to embrace the most colorful and efficient transit experience ever created? Your bus is waiting.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                  <Button asChild size="xl" variant="secondary" className="rounded-2xl px-12 h-16 shadow-2xl text-lg font-black bg-white text-violet-600 hover:scale-105 transition-transform hover:bg-white hover:shadow-white/20 border-none">
                    <Link href="/login">Join Now — It's Free</Link>
                  </Button>
                  <Button asChild size="xl" variant="ghost" className="rounded-2xl px-12 h-16 glass text-white hover:bg-white/20 border-white/30 text-lg font-black">
                    <Link href="/about">Our Vision</Link>
                  </Button>
                </div>
              </div>

              <div className="hidden lg:flex justify-end">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-10 border-[1px] border-white/20 rounded-full border-dashed"
                  />
                  <div className="glass p-12 rounded-[3.5rem] border-white/40 shadow-2xl relative z-10 text-white max-w-sm space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="bg-white p-4 rounded-[1.5rem] shadow-xl">
                        <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                      </div>
                      <div className="font-headline font-black text-2xl tracking-tighter italic">City Approved</div>
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: "Transit Efficiency", value: "98%", color: "bg-emerald-400" },
                        { label: "Network Coverage", value: "100%", color: "bg-blue-400" },
                        { label: "Community Growth", value: "+240%", color: "bg-amber-400" }
                      ].map((item) => (
                        <div key={item.label} className="space-y-2">
                          <div className="flex justify-between text-xs font-black uppercase tracking-wider opacity-80">
                            <span>{item.label}</span>
                            <span>{item.value}</span>
                          </div>
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: item.value }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={`h-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Shield, ShieldAlert, HeartPulse, Eye, Navigation, BellRing, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SafeAndSecurePage() {
  const safetyFeatures = [
    {
      icon: <ShieldAlert className="w-8 h-8" />,
      title: "One-Tap Emergency / SOS",
      description: "Instantly alert authorities and transit operators with your exact live GPS location in case of an emergency.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Verified Drivers",
      description: "All our fleet operators go through rigorous background checks and are monitored in real-time.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Share Your Ride",
      description: "Generate a secure link to send to family members so they can track your bus live as you commute.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      icon: <BellRing className="w-8 h-8" />,
      title: "Incident Alerts",
      description: "Receive push notifications about any disruptions, detours, or verified security incidents along your route.",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20"
    }
  ];

  return (
    <div className="min-h-[90vh] bg-background relative overflow-hidden pt-20 pb-20">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-blob [animation-delay:2s]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold mb-6">
              <Shield className="w-4 h-4" />
              <span>Safety First Architecture</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black font-headline mb-6 tracking-tight">
              Your Safety Is Our <span className="text-rose-500">Priority.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We've built an advanced security network to ensure that every journey you take is monitored, protected, and completely secure.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {safetyFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className={`h-full border ${feature.border} shadow-xl bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-2 transition-transform`}>
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg ${feature.bg} ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black font-headline mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Live SOS CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-[3rem] overflow-hidden p-1 p-0.5 bg-gradient-to-br from-rose-500 to-orange-500 shadow-2xl shadow-rose-500/20">
            <div className="bg-background rounded-[2.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
              <div className="max-w-xl text-center md:text-left">
                <h3 className="text-3xl font-black font-headline mb-4 flex items-center justify-center md:justify-start gap-3">
                  <HeartPulse className="w-8 h-8 text-rose-500" /> Constant Monitoring
                </h3>
                <p className="text-lg text-muted-foreground font-medium">
                  Our central command center uses AI-driven anomaly detection on our <Navigation className="inline w-4 h-4 text-blue-500 mx-1"/> Live Fleet Tracking to automatically deploy help if a bus deviates unexpectedly.
                </p>
              </div>
              <Button size="lg" className="rounded-2xl h-16 px-10 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg shadow-xl shadow-rose-500/30 whitespace-nowrap">
                Review Safety Guidelines
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

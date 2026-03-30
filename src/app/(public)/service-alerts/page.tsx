"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CloudRain, Construction, ShieldAlert, Navigation, Search, Info } from "lucide-react";

// Mock Data for demonstration
const mockAlerts = [
  { id: "A1", type: "weather", severity: "high", reason: "Severe Thunderstorm Warning", affectedRoutes: ["All Express Routes", "Route 42"], description: "Expect significant delays across all express routes due to severe flooding. Please seek shelter.", time: "Updated 10 mins ago", icon: <CloudRain /> },
  { id: "A2", type: "detour", severity: "medium", reason: "Road Construction", affectedRoutes: ["Route 19", "Route 22", "Route 12"], description: "Main Street is closed. Buses will detour via 4th Avenue. Stops 204 to 209 are temporarily out of service.", time: "Updated 1 hr ago", icon: <Construction /> },
  { id: "A3", type: "traffic", severity: "medium", reason: "Traffic Accident", affectedRoutes: ["Route 7"], description: "Heavy traffic buildup on highway 101. Expect 15-20 minute delays on Southbound routes.", time: "Updated 30 mins ago", icon: <ShieldAlert /> },
  { id: "A4", type: "info", severity: "low", reason: "Holiday Schedule", affectedRoutes: ["All Routes"], description: "Tomorrow is a federal holiday. Transit will operate on a Sunday schedule.", time: "Updated 1 day ago", icon: <Info /> },
];

export default function ServiceAlertsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "high": return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500", glow: "shadow-red-500/30", color: "bg-red-500" };
      case "medium": return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", glow: "shadow-amber-500/30", color: "bg-amber-500" };
      case "low": return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", glow: "shadow-blue-500/30", color: "bg-blue-500" };
      default: return { bg: "bg-muted/50", border: "border-border", text: "text-muted-foreground", glow: "shadow-none", color: "bg-muted" };
    }
  };

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesSearch = alert.reason.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.affectedRoutes.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === "all" || alert.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-[90vh] bg-background relative overflow-hidden pt-20 pb-20">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full animate-blob outline-none" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-blob [animation-delay:4s] outline-none" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold mb-6">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Network Updates</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black font-headline mb-6 tracking-tight">
              Service <span className="text-red-500">Alerts & Detours.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Stay ahead of unexpected delays, weather disruptions, and route changes to ensure a smooth journey.
            </p>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-red-500/50 transition-all">
                <div className="p-3 text-muted-foreground">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search by route (e.g., 42, Express)" 
                  className="w-full bg-transparent border-none outline-none text-base font-medium px-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {[
                { id: "all", label: "All Alerts" },
                { id: "weather", label: "Weather" },
                { id: "detour", label: "Detours" },
                { id: "traffic", label: "Traffic" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`px-6 py-4 rounded-xl font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    filterType === filter.id 
                      ? "bg-foreground text-background shadow-lg shadow-foreground/20" 
                      : "bg-card/80 border border-border/50 hover:bg-card/100 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Alerts Feed */}
        <div className="max-w-4xl mx-auto space-y-6 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[39px] top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-red-500/40 via-amber-500/40 to-transparent -z-10 hidden md:block" />

          <AnimatePresence>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, idx) => {
                const styles = getSeverityStyles(alert.severity);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Timeline Dot icon */}
                      <div className={`hidden md:flex w-20 h-20 rounded-[2rem] flex-shrink-0 items-center justify-center p-5 text-white shadow-xl rotate-3 hover:rotate-6 transition-transform z-10 ${styles.color} ${styles.glow}`}>
                        <div className="[&>svg]:w-10 [&>svg]:h-10">
                          {alert.icon}
                        </div>
                      </div>

                      {/* Main Card */}
                      <Card className={`border ${styles.border} ${styles.bg} backdrop-blur-xl rounded-[2rem] overflow-hidden flex-grow w-full transition-colors group`}>
                        <CardContent className="p-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`md:hidden p-3 rounded-xl text-white ${styles.color} ${styles.glow}`}>
                                <div className="[&>svg]:w-6 [&>svg]:h-6">
                                  {alert.icon}
                                </div>
                              </div>
                              <h3 className={`text-2xl font-black font-headline ${styles.text}`}>
                                {alert.reason}
                              </h3>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-md whitespace-nowrap inline-flex self-start md:self-auto">
                              {alert.time}
                            </span>
                          </div>

                          <p className="text-lg text-foreground/90 font-medium leading-relaxed mb-6">
                            {alert.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {alert.affectedRoutes.map((route, r_idx) => (
                              <div key={r_idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/50 backdrop-blur-md rounded-lg text-sm font-bold shadow-sm">
                                <Navigation className={`w-3.5 h-3.5 ${styles.text}`} />
                                {route}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center p-16 bg-card/20 rounded-[2rem] border border-border/40 backdrop-blur-xl"
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black font-headline mb-3 text-emerald-500">All Clear!</h3>
                <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto">
                  There are no active alerts for your search. The transit network is running smoothly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

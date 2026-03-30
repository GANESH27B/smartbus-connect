"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye, Users, Bus, Info, Clock } from "lucide-react";

// Mock Data for demonstration
const mockBuses = [
  { id: "B402", route: "42", destination: "Central Station", eta: "2 min", occupancy: 95, status: "Full" },
  { id: "B118", route: "42", destination: "Central Station", eta: "15 min", occupancy: 40, status: "Moderate" },
  { id: "B295", route: "19", destination: "West End Plaza", eta: "5 min", occupancy: 12, status: "Empty" },
  { id: "B306", route: "19", destination: "West End Plaza", eta: "22 min", occupancy: 85, status: "Crowded" },
  { id: "B501", route: "7", destination: "University Campus", eta: "8 min", occupancy: 60, status: "Moderate" },
];

export default function CrowdInsightsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const getOccupancyColor = (level: number) => {
    if (level < 30) return "bg-emerald-500";
    if (level < 70) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getOccupancyText = (level: number) => {
    if (level < 30) return "text-emerald-500";
    if (level < 70) return "text-amber-500";
    return "text-rose-500";
  };

  const filteredBuses = mockBuses.filter(bus => 
    bus.route.includes(searchTerm) || bus.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[90vh] bg-background relative overflow-hidden pt-20 pb-20">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-20%] w-[60%] h-[60%] bg-orange-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 blur-[120px] rounded-full animate-blob [animation-delay:2s]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-bold mb-6">
              <Eye className="w-4 h-4" />
              <span>Live Occupancy Tracker</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black font-headline mb-6 tracking-tight">
              Know Before You <span className="text-orange-500">Board.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Check real-time crowding levels on incoming buses. Choose to squeeze in or wait for the empty one right behind it.
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-16 relative"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-xl">
              <div className="p-3 text-muted-foreground">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Search your route number or destination..." 
                className="flex-grow bg-transparent border-none outline-none text-lg font-medium px-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {filteredBuses.length > 0 ? (
              <div className="space-y-4">
                {filteredBuses.map((bus, idx) => (
                  <motion.div
                    key={bus.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-none shadow-xl bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden hover:bg-card/60 transition-colors group cursor-pointer relative">
                      {/* Occupancy Indicator Line */}
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-border/50">
                        <motion.div 
                          className={`w-full bottom-0 absolute ${getOccupancyColor(bus.occupancy)}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${bus.occupancy}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                      
                      <CardContent className="p-6 pl-8 flex flex-col md:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-lg pl-1 ${getOccupancyColor(bus.occupancy)} text-white`}>
                            {bus.route}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{bus.destination}</h3>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                              <Bus className="w-4 h-4" /> Bus {bus.id}
                              <span className="mx-1">•</span>
                              <Clock className="w-4 h-4" /> Arriving in {bus.eta}
                            </div>
                          </div>
                        </div>

                        {/* Occupancy Visualizer */}
                        <div className="flex flex-col items-end w-full md:w-auto bg-background/50 p-4 rounded-xl border border-border/50">
                          <div className="flex items-center justify-between w-full md:w-48 mb-2">
                            <span className={`text-sm font-bold uppercase tracking-wider ${getOccupancyText(bus.occupancy)}`}>
                              {bus.status}
                            </span>
                            <span className="text-sm font-bold flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" /> {bus.occupancy}%
                            </span>
                          </div>
                          <div className="h-2 w-full md:w-48 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bus.occupancy}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                              className={`h-full ${getOccupancyColor(bus.occupancy)}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center p-12 bg-card/20 rounded-[2rem] border border-border/40"
              >
                <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No buses found</h3>
                <p className="text-muted-foreground">Try searching for a different route or destination.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

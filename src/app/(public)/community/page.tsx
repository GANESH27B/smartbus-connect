"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Flag, MessageSquare, Award, ThumbsUp, MapPin, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock Data
const recentReports = [
  { id: 1, user: "Alex T.", route: "42 Express", issue: "Bus is very crowded. Standing room only.", time: "5 mins ago", verified: 12, icon: <Users /> },
  { id: 2, user: "Sam R.", route: "Main Station", issue: "Ticket machine 2 is out of paper.", time: "15 mins ago", verified: 4, icon: <MessageSquare /> },
  { id: 3, user: "Jordan M.", route: "Route 19", issue: "Stuck in heavy traffic near 4th avenue.", time: "22 mins ago", verified: 28, icon: <Flag /> },
];

const leaderboards = [
  { rank: 1, name: "Maria S.", points: 4500, title: "Transit Hero" },
  { rank: 2, name: "David L.", points: 3820, title: "Super Recruiter" },
  { rank: 3, name: "Sarah K.", points: 3150, title: "Local Guide" },
  { rank: 4, name: "You", points: 840, title: "Rising Star", isUser: true },
];

export default function CommunityPage() {
  const [reportText, setReportText] = useState("");

  return (
    <div className="min-h-[90vh] bg-background relative overflow-hidden pt-20 pb-20">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-blob [animation-delay:2s]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 text-sm font-bold mb-6">
              <Users className="w-4 h-4" />
              <span>Crowdsourced Transit</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black font-headline mb-6 tracking-tight">
              Powered by <span className="text-pink-500">You.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Join thousands of commuters helping each other navigate the city. Verify delays, report crowding, and earn points.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* Action Card: Submit Report */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-rose-500" />
              <CardHeader className="pt-10 px-8">
                <CardTitle className="flex items-center gap-3 text-3xl font-black font-headline">
                  <MessageSquare className="w-8 h-8 text-pink-500" />
                  Report Line Status
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Notice something off? Share exactly what's happening to help others reroute.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                <div>
                  <textarea 
                    placeholder="e.g., Heavy traffic near the stadium, Route 42 is delayed by 10 mins..." 
                    rows={4}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-medium resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <Button className="w-full h-14 rounded-xl text-base font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/30 transition-all flex items-center gap-2">
                    <Zap className="w-5 h-5 fill-current" /> Broadcast Update
                  </Button>
                  <Button variant="outline" className="h-14 w-14 rounded-xl shrink-0 p-0 text-muted-foreground hover:text-foreground">
                    <MapPin className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <h3 className="text-2xl font-black font-headline mt-8 mb-4 ml-4">Live Community Intel</h3>
            <div className="space-y-4">
              {recentReports.map((report, idx) => (
                <div key={report.id} className="p-6 rounded-2xl bg-card/60 border border-border/50 shadow-md flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    {report.icon}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold">{report.user} <span className="text-muted-foreground text-xs ml-2 font-normal">• {report.route}</span></div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{report.time}</span>
                    </div>
                    <p className="text-sm font-medium mb-3">{report.issue}</p>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 transition-colors text-xs font-bold shadow-sm">
                        <ThumbsUp className="w-3.5 h-3.5" /> Verify
                      </button>
                      <span className="text-xs text-muted-foreground font-bold">
                        {report.verified} verifications
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gamification / Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full border-none shadow-xl bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group">
              <CardHeader className="pt-10 px-8 pb-6 bg-gradient-to-b from-rose-500/5 to-transparent">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-3 text-3xl font-black font-headline">
                    <Award className="w-8 h-8 text-rose-500" />
                    Top Contributors
                  </CardTitle>
                  <TrendingUp className="w-6 h-6 text-muted-foreground opacity-50" />
                </div>
                <CardDescription className="text-base mt-2">
                  Earn points by reporting accurate statuses and verifying others.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-10">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-8 text-center shadow-inner">
                  <div className="text-sm font-bold text-rose-600/80 uppercase tracking-wider mb-2">Your Current Rank</div>
                  <div className="text-5xl font-black font-headline text-rose-500 mb-1">Top 15%</div>
                  <div className="text-xs text-muted-foreground font-medium">160 points to next tier</div>
                </div>

                <div className="space-y-4">
                  {leaderboards.map((user) => (
                    <div 
                      key={user.rank} 
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${user.isUser ? 'bg-rose-500 fill-white text-white shadow-lg shadow-rose-500/30 -mx-2 px-6' : 'bg-background border border-border/50'}`}
                    >
                      <div className={`font-black text-xl w-6 text-center ${user.isUser ? 'text-white' : 'text-muted-foreground'}`}>
                        {user.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <div className="font-bold text-sm">{user.name} {user.isUser && "(You)"}</div>
                        <div className={`text-xs ${user.isUser ? 'text-white/80' : 'text-rose-500 font-bold'}`}>
                          {user.title}
                        </div>
                      </div>
                      <div className="font-black">
                        {user.points.toLocaleString()} <span className="text-xs font-normal opacity-70">pts</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="ghost" className="w-full mt-6 text-rose-500 hover:text-rose-600 font-bold">
                  View Full Leaderboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

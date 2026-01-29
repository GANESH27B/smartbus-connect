"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, MapPin, Calendar, Clock, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TripHistoryItem {
    _id: string;
    origin: string;
    destination: string;
    date: string;
    plan: {
        totalTime: string;
        estimatedCost?: string;
        summary: string;
    };
}

export default function ProfilePage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [trips, setTrips] = useState<TripHistoryItem[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login"); // Redirect if not logged in
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchTrips();
        }
    }, [user]);

    const fetchTrips = async () => {
        try {
            const res = await fetch('/api/user/trips');
            const data = await res.json();
            if (data.success) {
                setTrips(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch trips", error);
        } finally {
            setLoadingTrips(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Get initials for avatar fallback
    const initials = user.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "U";

    return (
        <div className="container mx-auto py-12 px-4 md:px-6 max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
                {/* User Profile Card */}
                <div className="md:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 relative">
                                <Avatar className="h-24 w-24 border-4 border-primary/10">
                                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-background" title="Online"></div>
                            </div>
                            <CardTitle className="text-2xl">{user.displayName || "User"}</CardTitle>
                            <CardDescription className="break-all">{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase">Account Type</p>
                                    <p className="text-sm font-semibold">Standard Member</p>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full gap-2"
                                onClick={() => {
                                    signOut();
                                    router.push("/");
                                }}
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Trip History Section */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-2">My Trip History</h2>
                        <p className="text-muted-foreground">View your recent AI-planned journeys.</p>
                    </div>

                    {loadingTrips ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : trips.length > 0 ? (
                        <div className="grid gap-4">
                            {trips.map((trip) => (
                                <Card key={trip._id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-primary font-bold">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{trip.origin}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span>{trip.destination}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {trip.plan.summary}
                                                </p>
                                            </div>
                                            <div className="flex flex-row md:flex-col gap-2 md:items-end">
                                                <Badge variant="secondary" className="gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {trip.plan.totalTime}
                                                </Badge>
                                                {trip.plan.estimatedCost && (
                                                    <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                                        {trip.plan.estimatedCost}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(trip.date).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            {/* Could add a 'View Details' button here linking back to planner with pre-filled state */}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="bg-muted p-4 rounded-full mb-4">
                                    <MapPin className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No trips found</h3>
                                <p className="mb-6">You haven't planned any trips yet.</p>
                                <Button onClick={() => router.push("/trip-planner")}>Plan a Trip</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

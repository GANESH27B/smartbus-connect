
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext"; // Only import useAuth
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export function AuthForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { signInWithGoogle } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            toast({
                title: "Connecting...",
                description: "Redirecting to Google Secure Authentication.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Google Sign In Failed",
                description: "Could not complete authentication.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="border-border/50 shadow-2xl rounded-[3rem] overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-xl relative">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

                    <CardHeader className="space-y-4 pb-12 text-center pt-12">
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-headline font-black tracking-tighter italic">One-Tap Access</CardTitle>
                        <CardDescription className="text-lg font-medium px-8 leading-relaxed">
                            Sign in securely with Google to sync your AI trips and nearby stops.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-12 pb-12">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-16 rounded-2xl border-border bg-white hover:bg-muted dark:bg-background transition-all font-black text-lg gap-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <svg className="h-6 w-6" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                    </svg>
                                    <span>Continue with Google</span>
                                    <ArrowRight className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                </>
                            )}
                        </Button>
                    </CardContent>

                    <CardFooter className="bg-muted/30 py-8 border-t border-border/50 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 group cursor-help">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Encryption Active</p>
                        </div>
                        <p className="text-xs text-muted-foreground text-center px-10">
                            By continuing, you agree to our <Link href="#" className="underline hover:text-primary transition-colors">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}

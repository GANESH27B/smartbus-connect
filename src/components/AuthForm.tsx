
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
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth(); // Destructure
    const { toast } = useToast();
    const router = useRouter();

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const signupForm = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onLogin(values: z.infer<typeof loginSchema>) {
        setIsLoading(true);
        try {
            await signInWithEmail(values.email, values.password);
            toast({
                title: "Welcome back!",
                description: "Signed in successfully.",
            });
            router.push("/");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "Could not log in.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function onSignup(values: z.infer<typeof signupSchema>) {
        setIsLoading(true);
        try {
            await signUpWithEmail(values.name, values.email, values.password);
            toast({
                title: "Account created!",
                description: "Welcome to SmartBus Connect.",
            });
            router.push("/");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Sign Up Failed",
                description: error.message || "Something went wrong.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            toast({
                title: "Success",
                description: "Signed in with Google.",
            });
            router.push("/");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Google Sign In Failed",
                description: "Could not complete authentication.",
            });
        } finally {
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
                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted rounded-2xl h-14 border border-border/50 shadow-inner">
                        <TabsTrigger
                            value="login"
                            className="rounded-xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
                        >
                            Sign In
                        </TabsTrigger>
                        <TabsTrigger
                            value="signup"
                            className="rounded-xl text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
                        >
                            Create Account
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent value="login" key="login">
                            <Card className="border-border/50 shadow-2xl rounded-[2rem] overflow-hidden bg-card/80 backdrop-blur-sm">
                                <CardHeader className="space-y-1 pb-8 text-center pt-8">
                                    <CardTitle className="text-3xl font-headline font-bold italic">Welcome Back</CardTitle>
                                    <CardDescription className="text-base">Enter your details to track your commute.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 px-10">
                                    <Form {...loginForm}>
                                        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                                            <FormField
                                                control={loginForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="name@example.com" {...field} className="pl-10 h-11 rounded-xl border-border bg-background focus:ring-primary/20" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={loginForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5">
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input type="password" {...field} className="pl-10 h-11 rounded-xl border-border bg-background focus:ring-primary/20" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 group" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                            </Button>
                                        </form>
                                    </Form>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-border" />
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                                            <span className="bg-card px-4 text-muted-foreground">Or Connect with</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" type="button" className="w-full h-11 rounded-xl border-border hover:bg-muted transition-colors font-medium mb-6" onClick={handleGoogleSignIn} disabled={isLoading}>
                                        <svg className="mr-3 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                        </svg>
                                        Google Account
                                    </Button>
                                </CardContent>
                                <CardFooter className="bg-muted/30 py-6 border-t border-border/50 flex justify-center">
                                    <p className="text-xs text-muted-foreground text-center">
                                        By continuing, you agree to our <Link href="#" className="underline hover:text-primary">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary">Privacy Policy</Link>.
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="signup" key="signup">
                            <Card className="border-border/50 shadow-2xl rounded-[2rem] overflow-hidden bg-card/80 backdrop-blur-sm">
                                <CardHeader className="space-y-1 pb-8 text-center pt-8">
                                    <CardTitle className="text-3xl font-headline font-bold italic">Join SmartBus</CardTitle>
                                    <CardDescription className="text-base">Start your journey toward a better commute.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 px-10">
                                    <Form {...signupForm}>
                                        <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                                            <FormField
                                                control={signupForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="John Doe" {...field} className="pl-10 h-11 rounded-xl border-border bg-background" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={signupForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="name@example.com" {...field} className="pl-10 h-11 rounded-xl border-border bg-background" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={signupForm.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</FormLabel>
                                                            <FormControl>
                                                                <Input type="password" {...field} className="h-11 rounded-xl border-border bg-background" />
                                                            </FormControl>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={signupForm.control}
                                                    name="confirmPassword"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm</FormLabel>
                                                            <FormControl>
                                                                <Input type="password" {...field} className="h-11 rounded-xl border-border bg-background" />
                                                            </FormControl>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 mt-4" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Free Account"}
                                            </Button>
                                        </form>
                                    </Form>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-border" />
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                                            <span className="bg-card px-4 text-muted-foreground">Or Use Social</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" type="button" className="w-full h-11 rounded-xl border-border font-medium" onClick={handleGoogleSignIn} disabled={isLoading}>
                                        <svg className="mr-3 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                        </svg>
                                        Google
                                    </Button>
                                </CardContent>
                                <CardFooter className="bg-muted/30 py-6 border-t border-border/50 flex justify-center">
                                    <p className="text-xs text-muted-foreground text-center">
                                        Join our community of over 50,000 smart travelers.
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </motion.div>
        </div>
    );
}

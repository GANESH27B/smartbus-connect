import { AuthForm } from "@/components/AuthForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | SmartBus Connect",
    description: "Login or Sign up for SmartBus Connect",
};

export default function LoginPage() {
    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">SmartBus Connect</h1>
                <p className="text-muted-foreground mt-2">
                    Your smart companion for city transit
                </p>
            </div>
            <AuthForm />
        </div>
    );
}

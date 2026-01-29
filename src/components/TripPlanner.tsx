
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { planTripAction } from "@/app/(public)/trip-planner/actions";
import type { TripPlan } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowRight, Bot, Bus, Clock, Loader2, MapPin, PersonStanding, TramFront, ExternalLink, Mic, MicOff, Code, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Autocomplete } from "@react-google-maps/api";
import { useGoogleMaps } from "@/context/GoogleMapsContext";
import { useRef } from "react";

const formSchema = z.object({
  start: z.string().min(3, { message: "Please enter a valid starting location." }),
  destination: z.string().min(3, { message: "Please enter a valid destination." }),
  notes: z.string().optional(),
});

// A global variable to hold the SpeechRecognition instance, so it can be accessed across renders.
let speechRecognition: any = null;

export function TripPlanner() {
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useGoogleMaps();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: "",
      destination: "",
      notes: "",
    },
  });

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.lang = 'en-US';
      speechRecognition.interimResults = false;

      speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentNotes = form.getValues("notes");
        form.setValue("notes", currentNotes ? `${currentNotes} ${transcript}` : transcript);
        setIsListening(false);
      };

      speechRecognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      speechRecognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setHasSpeechSupport(false);
    }
  }, [form]);


  const [history, setHistory] = useState<{ inputs: z.infer<typeof formSchema>, plan: TripPlan, date: string }[]>([]);

  useEffect(() => {
    const savedPlan = localStorage.getItem("lastTripPlan");
    const savedInput = localStorage.getItem("lastTripInput");
    const savedHistory = localStorage.getItem("tripHistory");

    if (savedPlan) {
      try {
        setTripPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Failed to parse saved trip plan", e);
      }
    }

    if (savedInput) {
      try {
        const parsedInput = JSON.parse(savedInput);
        form.reset(parsedInput);
      } catch (e) {
        console.error("Failed to parse saved input", e);
      }
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setTripPlan(null);

    // Save inputs
    localStorage.setItem("lastTripInput", JSON.stringify(values));

    const result = await planTripAction(values);
    if (result.success && result.data) {
      setTripPlan(result.data);
      // Save result
      localStorage.setItem("lastTripPlan", JSON.stringify(result.data));

      // Update History
      const newHistoryItem = {
        inputs: values,
        plan: result.data,
        date: new Date().toISOString(),
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 5); // Keep last 5
      setHistory(updatedHistory);
      localStorage.setItem("tripHistory", JSON.stringify(updatedHistory));

    } else {
      setError(result.error || "An unknown error occurred.");
    }
    setIsLoading(false);
  }

  const loadFromHistory = (item: typeof history[0]) => {
    form.reset(item.inputs);
    setTripPlan(item.plan);
    localStorage.setItem("lastTripInput", JSON.stringify(item.inputs));
    localStorage.setItem("lastTripPlan", JSON.stringify(item.plan));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("tripHistory");
  }

  // ... (speech recognition handlers)
  const handleMicClick = () => {
    if (!speechRecognition) return;

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };


  const StepIcon = ({ instruction }: { instruction: string }) => {
    const lowerInstruction = instruction.toLowerCase();
    if (lowerInstruction.includes("walk")) return <PersonStanding className="h-6 w-6 text-accent" />;
    if (lowerInstruction.includes("bus")) return <Bus className="h-6 w-6 text-accent" />;
    if (lowerInstruction.includes("start")) return <MapPin className="h-6 w-6 text-foreground" />;
    if (lowerInstruction.includes("destination") || lowerInstruction.includes("arrive")) return <MapPin className="h-6 w-6 text-destructive" />;
    return <TramFront className="h-6 w-6 text-accent" />;
  }

  return (
    <div className="grid md:grid-cols-5 gap-8">
      <div className="md:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              AI Trip Planner
            </CardTitle>
            <CardDescription>
              Enter your start and end points, and we'll find the best route for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Starting Point
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      </FormLabel>
                      <FormControl>
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={(ac) => (startAutocompleteRef.current = ac)}
                            onPlaceChanged={() => {
                              const place = startAutocompleteRef.current?.getPlace();
                              if (place?.formatted_address) {
                                form.setValue("start", place.formatted_address);
                              }
                            }}
                          >
                            <Input placeholder="e.g., India Gate, New Delhi" {...field} className="rounded-xl border-white/10 bg-muted/40" />
                          </Autocomplete>
                        ) : (
                          <Input placeholder="Loading map engine..." disabled {...field} className="rounded-xl border-white/10 bg-muted/40" />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Destination
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                      </FormLabel>
                      <FormControl>
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={(ac) => (destinationAutocompleteRef.current = ac)}
                            onPlaceChanged={() => {
                              const place = destinationAutocompleteRef.current?.getPlace();
                              if (place?.formatted_address) {
                                form.setValue("destination", place.formatted_address);
                              }
                            }}
                          >
                            <Input placeholder="e.g., Red Fort, New Delhi" {...field} className="rounded-xl border-white/10 bg-muted/40" />
                          </Autocomplete>
                        ) : (
                          <Input placeholder="Loading map engine..." disabled {...field} className="rounded-xl border-white/10 bg-muted/40" />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes for Planner (Optional)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Textarea placeholder="e.g., Avoid transfers, prefer scenic route..." {...field} className={cn(hasSpeechSupport && "pr-12")} />
                        </FormControl>
                        {hasSpeechSupport && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleMicClick}
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary",
                              isListening && "text-destructive animate-pulse"
                            )}
                            aria-label={isListening ? "Stop listening" : "Start listening"}
                          >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Planning...
                    </>
                  ) : (
                    <>
                      Plan My Trip <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* History Section */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Searches</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-destructive">
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {history.map((item, i) => (
                  <li key={i} className="flex flex-col p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border" onClick={() => loadFromHistory(item)}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm truncate w-full">{item.inputs.start} → {item.inputs.destination}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      <span>{item.plan.totalTime}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="md:col-span-3">
        <Card className="min-h-full">
          <CardHeader>
            <CardTitle>Your Suggested Itinerary</CardTitle>
            <CardDescription>Follow these steps to reach your destination.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Our AI is planning the optimal route...</p>
                <p>This should only take a moment.</p>
              </div>
            )}
            {error && <p className="text-destructive">{error}</p>}
            {tripPlan && (
              <div className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center bg-muted/50 dark:bg-secondary p-4 rounded-2xl">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Time</h3>
                      <div className="flex items-center gap-2 text-xl font-bold text-primary">
                        <Clock className="h-5 w-5" />
                        <span>{tripPlan.totalTime}</span>
                      </div>
                    </div>
                  </div>
                  {tripPlan.estimatedCost && (
                    <div className="flex justify-between items-center bg-muted/50 dark:bg-secondary p-4 rounded-2xl border border-primary/10">
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Est. Fare</h3>
                        <div className="flex items-center gap-2 text-xl font-bold text-emerald-500">
                          <span className="text-2xl">₹</span>
                          <span>{tripPlan.estimatedCost.replace('₹', '')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-sm font-medium leading-relaxed italic">"{tripPlan.summary}"</p>
                </div>

                {tripPlan.mapsUrl && (
                  <Button asChild className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20">
                    <Link href={tripPlan.mapsUrl} target="_blank" rel="noopener noreferrer">
                      Launch Satellite Navigation
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <ul className="space-y-8">
                  {tripPlan.steps.map((step, index) => (
                    <li key={index} className="flex gap-6 relative group">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-110 transition-transform">
                          <StepIcon instruction={step.instruction} />
                        </div>
                        {index < tripPlan.steps.length - 1 && (
                          <div className="w-0.5 h-full bg-gradient-to-b from-primary/20 to-transparent my-2"></div>
                        )}
                      </div>

                      <div className="flex-grow pb-8">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-black text-lg tracking-tight">{step.instruction}</h4>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">{step.departureTime}</p>
                          </div>
                          {step.landmark && (
                            <div className="bg-orange-500/10 text-orange-600 text-[10px] font-black px-2 py-1 rounded-md uppercase border border-orange-500/20">
                              Landmark: {step.landmark}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {step.description}
                        </p>


                        {step.busNumber && (
                          <div className="inline-flex items-center gap-4 p-3 bg-primary text-white rounded-xl shadow-md border border-white/10">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <Bus className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xs">
                              <p className="font-black leading-none text-[14px]">BUS {step.busNumber}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {step.departureTime && (
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                    Dep: {step.departureTime}
                                  </span>
                                )}
                                {step.arrivalTime && (
                                  <span className="bg-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap border border-emerald-500/20">
                                    Arr: {step.arrivalTime}
                                  </span>
                                )}
                                <p className="opacity-80 text-[10px] font-bold uppercase tracking-tighter">Verified Schedule</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {tripPlan.debugPrompt && (
                  <Collapsible className="mt-8 border rounded-lg p-2 bg-muted/20">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 font-medium text-sm text-muted-foreground hover:text-foreground">
                      <span className="flex items-center gap-2"><Code className="w-4 h-4" /> View AI Prompt</span>
                      <ChevronDown className="w-4 h-4 transition-transform ui-open:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-4 bg-muted rounded-md overflow-x-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                          {tripPlan.debugPrompt}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}
            {!isLoading && !tripPlan && !error && (
              <div className="text-center text-muted-foreground py-16">
                <Bot className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Your trip plan will appear here.</p>
                <p>Fill out the form to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




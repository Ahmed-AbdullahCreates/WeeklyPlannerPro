import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userAuthSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle, ClipboardList, CheckSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(userAuthSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: { username: string; password: string }) {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 p-4 relative overflow-hidden">
      {/* Enhanced background patterns */}
      <div className="absolute inset-0 z-0">
        {/* Radial gradient centered on card */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_60%)]"></div>
        
        {/* Grid pattern with reduced opacity */}
        <div className="absolute inset-0 bg-grid-slate-200/[0.03] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"></div>
        
        {/* Animated gradient blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-50 via-indigo-100/50 to-transparent opacity-50 blur-3xl animate-blob"></div>
        <div className="absolute -bottom-48 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-50 via-slate-100/50 to-transparent opacity-50 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-indigo-50/40 via-slate-100/50 to-white opacity-50 blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 w-full max-w-md group">
        <Card className="relative border-slate-200/60 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-[2px] bg-white/95 transition-all duration-500 group-hover:shadow-[0_2px_50px_-12px_rgba(99,102,241,0.15)]">
          {/* Card inner glow on hover */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-100/50 via-white/90 to-white/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <CardHeader className="space-y-3 pb-8 relative">  
            {/* Logo section with enhanced animations */}
            <div className="flex items-center justify-center mb-2">
              <div className="relative group/logo">
                <div className="logo-container w-16 h-16 relative">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/80 to-white/0 opacity-0 group-hover/logo:opacity-100 rotate-[-35deg] transform translate-x-[-100%] animate-shine"></div>
                  
                  {/* Base with enhanced 3D */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg transform-gpu rotate-6 scale-95 transition-transform duration-300 group-hover/logo:rotate-12"></div>
                  
                  {/* Main face */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center transform-gpu transition-all duration-300 group-hover/logo:scale-105">
                    <CheckSquare className="h-7 w-7 text-white transform transition-all duration-300 group-hover/logo:scale-110 group-hover/logo:rotate-[-4deg]" />
                  </div>
                </div>

                {/* Enhanced sparkle effects */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover/logo:animate-sparkle-${i + 1}`}
                      style={{
                        top: `${25 * Math.sin(i * Math.PI / 2)}%`,
                        left: `${25 * Math.cos(i * Math.PI / 2)}%`,
                        animationDelay: `${i * 0.15}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced title and description */}
            <div className="space-y-1 text-center relative">
              <CardTitle className="text-2xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 animate-gradient inline-block">
                  WeeklyPlanner 
                </span>
              </CardTitle>
              <CardDescription className="text-slate-500/90">
                Royal American School Weekly Planning System
              </CardDescription>
            </div>
          </CardHeader>

          {/* Form section with enhanced interactions */}
          <CardContent>
            {/* Enhanced error alert */}
            {error && (
              <Alert variant="destructive" className="mb-6 border border-rose-100/50 bg-rose-50/50 text-rose-600 backdrop-blur-sm animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Enhanced form fields with floating labels */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="relative group/input">
                      <FormLabel className="text-slate-600 group-focus-within/input:text-indigo-500 transition-colors duration-200">
                        Username
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field}
                            placeholder="Enter your username" 
                            className="h-11 pl-10 border-slate-200 bg-white/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40 transition-all duration-200 group-hover/input:border-slate-300"
                          />
                          <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-rose-500 animate-slideDown" />
                    </FormItem>
                  )}
                />

                {/* Enhanced password field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="relative group/input">
                      <FormLabel className="text-slate-600 group-focus-within/input:text-indigo-500 transition-colors duration-200">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field}
                            type="password"
                            placeholder="••••••••" 
                            className="h-11 pl-10 border-slate-200 bg-white/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40 transition-all duration-200 group-hover/input:border-slate-300"
                          />
                          <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-rose-500 animate-slideDown" />
                    </FormItem>
                  )}
                />

                {/* Enhanced submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2 relative overflow-hidden group/button bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] translate-x-[-100%] group-hover/button:translate-x-[100%] transition-transform duration-700"></div>
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="animate-pulse">Signing in...</span>
                    </div>
                  ) : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center pb-8">
            <p className="text-sm text-slate-500/80 hover:text-slate-600 transition-colors duration-200">
              Contact your administrator if you need access
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

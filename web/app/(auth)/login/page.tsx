"use client";

import * as React from "react";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "owner@shelfsense.local",
      password: "password123",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const resData = await res.json();

      if (!res.ok) {
        const errorMsg =
          resData.message
            ? Array.isArray(resData.message)
              ? resData.message.join(", ")
              : resData.message
            : "Invalid credentials. Please verify your email and password.";
        setServerError(errorMsg);
        setIsLoading(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Welcome back!", {
        description: `Signed in as ${resData.user?.name || resData.user?.email || "User"}`,
      });

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to connect to authentication service.");
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: "OWNER" | "STAFF") => {
    const email = role === "OWNER" ? "owner@shelfsense.local" : "staff@shelfsense.local";
    const password = "password123";
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
    handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between antialiased transition-colors">
      {/* Top Brand Accent Bar */}
      <div className="h-1.5 w-full bg-primary" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M3 12h5l2-3 3 6 2-3h6" />
              <path d="M3 18h18" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="font-bold text-xl tracking-tight text-foreground leading-tight">
                ShelfSense
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Live
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
              Retail inventory
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Corner Care Retail • Cloud Synced</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-card rounded-2xl border border-border shadow-xl p-8 sm:p-9 relative">
            {/* Title & Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Store Portal
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Enter store credentials to access the inventory ledger.
              </p>
            </div>

            {/* Server Error Banner */}
            {serverError && (
              <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{serverError}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Work Email</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@cornercare.com"
                    className="pl-9"
                    error={!!errors.email}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="pl-9 pr-10"
                    error={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-ring"
                    {...register("rememberMe")}
                  />
                  <span className="text-xs text-muted-foreground">
                    Keep terminal signed in
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gap-2 mt-2"
                isLoading={isLoading}
              >
                <span>Authorize & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick Demo Access Buttons */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="text-center mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Fast Demo Access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDemo("OWNER")}
                  disabled={isLoading}
                  className="gap-1.5 text-xs h-9 justify-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Owner Account</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDemo("STAFF")}
                  disabled={isLoading}
                  className="gap-1.5 text-xs h-9 justify-center"
                >
                  <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Staff Account</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
        ShelfSense Retail Platform • Enterprise Inventory Ledger
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}

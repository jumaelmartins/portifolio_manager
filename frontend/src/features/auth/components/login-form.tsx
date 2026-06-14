"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginValues } from "../schemas";
import { FieldErrors } from "./field-errors";
import { PasswordField } from "./password-field";

function safeNextPath(nextPath?: string) {
  return nextPath?.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/dashboard";
}

export function LoginForm({
  nextPath,
  verified = false,
}: {
  nextPath?: string;
  verified?: boolean;
}) {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginValues) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      if (payload.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }

      form.setError("root", {
        message: payload.message ?? "Unable to sign in",
      });
      return;
    }

    router.replace(safeNextPath(nextPath));
    router.refresh();
  }

  const emailError = form.formState.errors.email;
  const passwordError = form.formState.errors.password;

  return (
    <div>
      <div className="text-center">
        <Image
          src="/brand/logo-mark.svg"
          alt=""
          width={72}
          height={72}
          className="mx-auto size-[72px]"
        />
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Portfolio Manager
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      {verified ? (
        <div
          className="mt-6 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-green-300"
          role="status"
        >
          Email verified. You can sign in now.
        </div>
      ) : null}

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="login-email">Email address</Label>
          <InputGroup className="h-11 rounded-[10px] bg-[#111113]">
            <InputGroupAddon className="pl-3">
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "login-email-error" : undefined}
              className="h-11 px-2"
              {...form.register("email")}
            />
          </InputGroup>
          <FieldErrors error={emailError} id="login-email-error" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="login-password">Password</Label>
            <span className="text-xs text-muted-foreground">
              Minimum 8 characters
            </span>
          </div>
          <PasswordField
            id="login-password"
            aria-label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError ? "login-password-error" : undefined
            }
            {...form.register("password")}
          />
          <FieldErrors error={passwordError} id="login-password-error" />
        </div>

        {form.formState.errors.root?.message ? (
          <p
            className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-[10px] text-sm font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          or
        </span>
        <Separator className="flex-1" />
      </div>

      <a
        href="/api/auth/google/start"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 w-full rounded-[10px] bg-[#11171d] font-semibold",
        )}
      >
        <span
          className="grid size-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285F4]"
          aria-hidden="true"
        >
          G
        </span>
        Continue with Google
      </a>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

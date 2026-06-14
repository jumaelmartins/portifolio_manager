"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Mail, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  registrationSchema,
  type RegistrationValues,
} from "../schemas";
import { FieldErrors } from "./field-errors";
import { PasswordField } from "./password-field";

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    criteriaMode: "all",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function submit(values: RegistrationValues) {
    const registration = {
      username: values.username,
      email: values.email,
      password: values.password,
    };
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(registration),
    });
    const payload = await response.json();

    if (!response.ok) {
      form.setError("root", {
        message: payload.message ?? "Unable to create the account",
      });
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
  }

  const errors = form.formState.errors;

  return (
    <div>
      <div className="text-center">
        <Image
          src="/brand/logo-mark.svg"
          alt=""
          width={64}
          height={64}
          className="mx-auto size-16"
        />
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Start building a portfolio you fully control.
        </p>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="register-username">Username</Label>
          <InputGroup className="h-11 rounded-[10px] bg-[#111113]">
            <InputGroupAddon className="pl-3">
              <UserRound aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="register-username"
              autoComplete="username"
              placeholder="yourname"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={
                errors.username ? "register-username-error" : undefined
              }
              className="h-11 px-2"
              {...form.register("username")}
            />
          </InputGroup>
          <FieldErrors
            error={errors.username}
            id="register-username-error"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email address</Label>
          <InputGroup className="h-11 rounded-[10px] bg-[#111113]">
            <InputGroupAddon className="pl-3">
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
              className="h-11 px-2"
              {...form.register("email")}
            />
          </InputGroup>
          <FieldErrors error={errors.email} id="register-email-error" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <PasswordField
            id="register-password"
            aria-label="Password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
            {...form.register("password")}
          />
          <FieldErrors error={errors.password} id="register-password-error" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <PasswordField
            id="register-confirm-password"
            aria-label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword
                ? "register-confirm-password-error"
                : undefined
            }
            {...form.register("confirmPassword")}
          />
          <FieldErrors
            error={errors.confirmPassword}
            id="register-confirm-password-error"
          />
        </div>

        {errors.root?.message ? (
          <p
            className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-[10px] font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

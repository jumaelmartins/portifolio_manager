"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, MailCheck, RotateCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  verificationSchema,
  type VerificationValues,
} from "../schemas";
import { FieldErrors } from "./field-errors";

export function VerificationForm({ email }: { email: string }) {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>();
  const [resendError, setResendError] = useState<string>();
  const form = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: "" },
  });
  const codeRegistration = form.register("code");

  async function submit(values: VerificationValues) {
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: values.code }),
    });
    const payload = await response.json();

    if (!response.ok) {
      form.setError("root", {
        message: payload.message ?? "Unable to verify email",
      });
      return;
    }

    router.replace("/login?verified=1");
    router.refresh();
  }

  async function resend() {
    setResending(true);
    setResendError(undefined);
    setResendMessage(undefined);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setResendError(
          payload.message ?? "Unable to resend the verification code",
        );
        return;
      }

      setResendMessage("A new verification code was sent.");
    } finally {
      setResending(false);
    }
  }

  const codeError = form.formState.errors.code;

  return (
    <div>
      <div className="text-center">
        <div className="relative mx-auto w-fit">
          <Image
            src="/brand/logo-mark.svg"
            alt=""
            width={64}
            height={64}
            className="size-16"
          />
          <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-4 border-[#0d141b] bg-primary text-primary-foreground">
            <MailCheck className="size-3.5" aria-hidden="true" />
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          Verify your email
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the six-digit code sent to{" "}
          <strong className="font-medium text-foreground">
            {email || "your email address"}
          </strong>
          .
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification code</Label>
          <Input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={Boolean(codeError)}
            aria-describedby={
              codeError ? "verification-code-error" : undefined
            }
            className="h-14 rounded-[10px] bg-[#111113] text-center font-mono text-2xl tracking-[0.45em] placeholder:tracking-[0.45em]"
            {...codeRegistration}
            onChange={(event) => {
              event.target.value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);
              codeRegistration.onChange(event);
            }}
          />
          <FieldErrors error={codeError} id="verification-code-error" />
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
          className="h-11 w-full rounded-[10px] font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 />
              Verify Email
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-1 text-primary hover:text-primary"
          onClick={resend}
          disabled={resending || !email}
        >
          <RotateCw className={resending ? "animate-spin" : undefined} />
          {resending ? "Sending..." : "Resend verification code"}
        </Button>
        {resendMessage ? (
          <p className="mt-2 text-sm text-green-300" role="status">
            {resendMessage}
          </p>
        ) : null}
        {resendError ? (
          <p className="mt-2 text-sm text-red-300" role="alert">
            {resendError}
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

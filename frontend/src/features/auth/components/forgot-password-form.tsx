"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { FieldErrors } from "./field-errors";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotPasswordValues) {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json();

      if (!response.ok) {
        const message =
          response.status === 400 && payload.message
            ? payload.message
            : "Ocorreu um erro. Tente novamente.";
        form.setError("root", { message });
        return;
      }

      setSubmitted(true);
    } catch {
      form.setError("root", { message: "Ocorreu um erro. Tente novamente." });
    }
  }

  const emailError = form.formState.errors.email;

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Verifique seu email
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Verifique sua caixa de entrada. Enviamos um link para redefinir sua
          senha.
        </p>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Esqueceu sua senha?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email address</Label>
          <InputGroup className="h-11 rounded-[10px] bg-[#111113]">
            <InputGroupAddon className="pl-3">
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
              className="h-11 px-2"
              {...form.register("email")}
            />
          </InputGroup>
          <FieldErrors error={emailError} id="forgot-email-error" />
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
              Enviando...
            </>
          ) : (
            <>
              Enviar link de redefinição
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Lembrou sua senha?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

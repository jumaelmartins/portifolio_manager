"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import { FieldErrors } from "./field-errors";
import { PasswordField } from "./password-field";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [invalidToken, setInvalidToken] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token || invalidToken) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Link inválido
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Este link de redefinição de senha é inválido ou expirou.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  async function submit(values: ResetPasswordValues) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    });
    const payload = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        setInvalidToken(true);
      } else {
        form.setError("root", {
          message: "Ocorreu um erro. Tente novamente.",
        });
      }
      return;
    }

    router.replace("/login?reset=success");
  }

  const passwordError = form.formState.errors.password;
  const confirmPasswordError = form.formState.errors.confirmPassword;

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Redefinir senha
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Digite sua nova senha abaixo.
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="reset-password">Nova senha</Label>
          <PasswordField
            id="reset-password"
            aria-label="Nova senha"
            autoComplete="new-password"
            placeholder="Enter your new password"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError ? "reset-password-error" : undefined
            }
            {...form.register("password")}
          />
          <FieldErrors error={passwordError} id="reset-password-error" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Confirmar senha</Label>
          <PasswordField
            id="reset-confirm-password"
            aria-label="Confirmar senha"
            autoComplete="new-password"
            placeholder="Confirm your new password"
            aria-invalid={Boolean(confirmPasswordError)}
            aria-describedby={
              confirmPasswordError
                ? "reset-confirm-password-error"
                : undefined
            }
            {...form.register("confirmPassword")}
          />
          <FieldErrors
            error={confirmPasswordError}
            id="reset-confirm-password-error"
          />
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
              Redefinindo...
            </>
          ) : (
            <>
              Redefinir senha
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

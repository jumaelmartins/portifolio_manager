"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState, type ComponentProps } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function PasswordField({
  "aria-label": ariaLabel,
  ...props
}: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className="h-11 rounded-[10px] bg-[#111113]">
      <InputGroupAddon className="pl-3">
        <LockKeyhole aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={ariaLabel}
        type={visible ? "text" : "password"}
        className="h-11 px-2"
        {...props}
      />
      <InputGroupAddon align="inline-end" className="pr-2">
        <InputGroupButton
          aria-label={visible ? `Hide ${ariaLabel}` : `Show ${ariaLabel}`}
          onClick={() => setVisible((current) => !current)}
          size="icon-xs"
        >
          {visible ? (
            <EyeOff aria-hidden="true" />
          ) : (
            <Eye aria-hidden="true" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

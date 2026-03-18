'use client';

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormFieldRenderProps = {
  errorId: string;
  describedBy?: string;
  invalid: boolean;
  invalidClassName: string;
};

interface FormFieldProps {
  id: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  labelClassName?: string;
  children: (props: FormFieldRenderProps) => ReactNode;
}

const INVALID_CLASS = "border-destructive focus-visible:ring-destructive";

export const FormField = ({
  id,
  label,
  required,
  error,
  className,
  labelClassName,
  children,
}: FormFieldProps) => {
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = invalid ? errorId : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label htmlFor={id} className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
      ) : null}
      {children({ errorId, describedBy, invalid, invalidClassName: INVALID_CLASS })}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};

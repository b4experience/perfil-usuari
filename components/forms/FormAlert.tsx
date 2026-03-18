'use client';

interface FormAlertProps {
  message?: string | null;
}

export const FormAlert = ({ message }: FormAlertProps) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
};

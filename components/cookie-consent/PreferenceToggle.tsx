type PreferenceToggleProps = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  alwaysOnLabel?: string;
};

export const PreferenceToggle = ({
  id,
  title,
  description,
  checked,
  disabled,
  onToggle,
  alwaysOnLabel,
}: PreferenceToggleProps) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold leading-tight text-primary-foreground"
      >
        {title}
      </label>
      <p
        id={`${id}-description`}
        className="text-xs leading-relaxed text-primary-foreground/75"
      >
        {description}
      </p>
      {disabled && alwaysOnLabel && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          {alwaysOnLabel}
        </p>
      )}
    </div>

    <div className="ml-auto">
      <label
        htmlFor={id}
        className="relative inline-flex h-6 w-11 cursor-pointer items-center"
      >
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          aria-describedby={`${id}-description`}
          checked={checked}
          disabled={disabled}
          onChange={() => {
            if (!disabled) onToggle?.();
          }}
        />
        <span className="absolute inset-0 rounded-full bg-white/25 transition peer-checked:bg-primary peer-disabled:bg-white/15" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 peer-disabled:bg-white/70" />
      </label>
    </div>
  </div>
);

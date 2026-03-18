'use client';

import { useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/useT";
import { useLocalizedPath } from "@/utils/localizedPaths";
import { useLanguage } from "@/context/LanguageContext";
import { phonePrefixOptions } from "@/data/phonePrefixes";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormField } from "@/components/forms/FormField";
import { cn } from "@/lib/utils";
import { focusFirstInvalidField } from "@/utils/formUtils";
import { isValidEmail, isValidPhone, required } from "@/utils/validators";

interface ContactFormProps {
  travelId?: string;
  travelTitle?: string;
  sourceUrl?: string;
  cookiesHref?: string;
  actividadInteres?: string;
  preferredMonth?: string | null;
  className?: string;
}

const actividadMap: Record<string, string> = {
  ski: "Ski",
  "ski touring": "Ski Touring",
  skitouring: "Ski Touring",
  freeride: "Freeride",
  heliski: "Heliski",
  "cat-ski": "Cat-ski",
  trek: "Trekking",
  trekking: "Trekking",
  hiking: "Trekking",
  alpinism: "Alpinism",
  mountaineering: "Alpinism",
  "trail running": "Trail Running",
  running: "Trail Running",
  sailing: "Sailing",
  sail: "Sailing",
};

function normalizeActividad(src?: string) {
  const s = (src ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!s) return "ContactoWeb";
  return actividadMap[s] || (src ?? "").replace(/\s+/g, " ").trim();
}

export default function ContactForm({
  travelId,
  travelTitle,
  sourceUrl,
  cookiesHref,
  actividadInteres,
  preferredMonth,
  className,
}: ContactFormProps) {
  const { t } = useT();
  const buildPath = useLocalizedPath();
  const { language } = useLanguage();

  const currentLanguage = useMemo(() => {
    if (language === "ES") return 83;
    if (language === "FR") return 1;
    return 1;
  }, [language]);
  const currentLanguageCode = useMemo(() => {
    if (language === "ES") return "es_ES";
    if (language === "FR") return "fr_FR";
    return "en_US";
  }, [language]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phonePrefix: "",
    phone: "",
    subject: "",
    message: "",
    cookies: false,
    publicidad: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const tituloViajeValue = (travelTitle || "Consulta Web").trim();
  const travelIdValue = travelId ?? "";
  const safeHref = typeof window !== "undefined" ? window.location.href : (sourceUrl ?? "");
  const sourceUrlValue = sourceUrl || safeHref;
  const cookiesLink = cookiesHref ?? buildPath("/cookies-policy");
  const termsLink = buildPath("/terms-and-conditions");
  const preferredMonthValue = preferredMonth?.trim() || "";

  const errorTexts = useMemo(
    () => ({
      summary: t("form.errors.summary"),
      required: t("form.errors.required"),
      email: t("form.errors.email"),
      phone: t("form.errors.phone"),
    }),
    [t],
  );

  const validateField = (name: string, values: typeof form) => {
    const trimmedName = values.name.trim();
    const trimmedEmail = values.email.trim();
    const trimmedPhone = values.phone.trim();
    const trimmedMessage = values.message.trim();
    const trimmedPrefix = values.phonePrefix.trim();

    switch (name) {
      case "name":
        return required(trimmedName) ? "" : errorTexts.required;
      case "email":
        if (!required(trimmedEmail)) return errorTexts.required;
        return isValidEmail(trimmedEmail) ? "" : errorTexts.email;
      case "phonePrefix":
        if (!trimmedPhone) return "";
        return required(trimmedPrefix) ? "" : errorTexts.required;
      case "phone":
        if (!trimmedPhone) return "";
        return isValidPhone(`${trimmedPrefix} ${trimmedPhone}`.trim()) ? "" : errorTexts.phone;
      case "message":
        return required(trimmedMessage) ? "" : errorTexts.required;
      case "cookies":
        return values.cookies ? "" : errorTexts.required;
      default:
        return "";
    }
  };

  const validateForm = (values: typeof form) => {
    const fields = ["name", "email", "phonePrefix", "phone", "message", "cookies"] as const;
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, values);
      if (error) nextErrors[field] = error;
    });
    return nextErrors;
  };

  const updateField = (name: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        if (prevErrors[name]) {
          nextErrors[name] = validateField(name, next);
        }
        if ((name === "phone" || name === "phonePrefix") && (prevErrors.phone || prevErrors.phonePrefix)) {
          nextErrors.phone = validateField("phone", next);
          nextErrors.phonePrefix = validateField("phonePrefix", next);
        }
        if (name === "email" && prevErrors.email) {
          nextErrors.email = validateField("email", next);
        }
        if (name === "name" && prevErrors.name) {
          nextErrors.name = validateField("name", next);
        }
        if (name === "message" && prevErrors.message) {
          nextErrors.message = validateField("message", next);
        }
        if (name === "cookies" && prevErrors.cookies) {
          nextErrors.cookies = validateField("cookies", next);
        }
        return nextErrors;
      });
      return next;
    });
  };

  const handleBlur = (name: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, form),
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormAlert(errorTexts.summary);
      focusFirstInvalidField(formRef.current, 96);
      return;
    }
    setFormAlert(null);
    setStatus("loading");

    try {

      const actividad = normalizeActividad(actividadInteres);
      
      const hasPhone = Boolean(form.phone.trim());
      const phoneValue = hasPhone
        ? [form.phonePrefix.trim(), form.phone.trim()].filter(Boolean).join(" ")
        : null;

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: phoneValue,
        subject: form.subject.trim() || tituloViajeValue,
        message: form.message.trim(),
        idioma: currentLanguage,
        idioma_code: currentLanguageCode,
        // Edge Function
        tituloViaje: tituloViajeValue,
        preferred_month: preferredMonthValue || null,
        cookies: form.cookies ? "true" : "false",
        publicidad: form.publicidad ? "true" : "false",
        actividad_interes: actividad,
        entrada_consulta_web: "quiz",
        source_url: sourceUrlValue,
        consultaProducto: Boolean(travelIdValue),
        conditions: form.cookies,
        travel_id: travelIdValue || null,
      };

      console.debug("Contact | Sending payload:", payload);

      // 🔧 Fix: forzar body stringificado para evitar Content-Length: 0
      const { data, error } = await supabase.functions.invoke("contact", {
        body: JSON.stringify(payload),
      });

      if (error) {
        console.error("invoke error:", error.name, error.message);
        const res = (error as any).context?.response as Response | undefined;
        if (res) {
          const txt = await res.text();
          console.error("EdgeFunction HTTP:", res.status, txt);
        }
        setStatus("error");
        setFormAlert(t("contact.form.error"));
        return;
      }

      setStatus("success");
      setForm({
        name: "",
        email: "",
        phonePrefix: "",
        phone: "",
        subject: "",
        message: "",
        cookies: false,
        publicidad: false,
      });
      setErrors({});
      setFormAlert(null);
    } catch (err) {
      console.error("❌ Error enviando:", err);
      setStatus("error");
      setFormAlert(t("contact.form.error"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      ref={formRef}
      noValidate
      className={`flex flex-col gap-3 max-w-lg mx-auto p-4 border rounded-lg shadow ${className ?? ""}`}
    >
      <input type="hidden" name="preferred_month" value={preferredMonthValue} />
      <FormField
        id="contact-name"
        label={t("contact.form.name")}
        required
        error={errors.name}
        labelClassName="sr-only"
      >
        {({ describedBy, invalid, invalidClassName }) => (
          <input
            id="contact-name"
            name="name"
            type="text"
            placeholder={t("contact.form.name")}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            required
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn("border p-2 rounded w-full", invalid && invalidClassName)}
          />
        )}
      </FormField>
      <FormField
        id="contact-email"
        label={t("contact.form.email")}
        required
        error={errors.email}
        labelClassName="sr-only"
      >
        {({ describedBy, invalid, invalidClassName }) => (
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder={t("contact.form.email")}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            required
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn("border p-2 rounded w-full", invalid && invalidClassName)}
          />
        )}
      </FormField>
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <FormField
          id="contact-phone-prefix"
          label={t("contact.form.phonePrefix")}
          error={errors.phonePrefix}
          labelClassName="sr-only"
        >
          {({ describedBy, invalid, invalidClassName }) => (
            <select
              id="contact-phone-prefix"
              name="phonePrefix"
              value={form.phonePrefix}
              onChange={(e) => updateField("phonePrefix", e.target.value)}
              onBlur={() => handleBlur("phonePrefix")}
              required={Boolean(form.phone.trim())}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={cn(
                "border p-2 rounded w-full bg-white",
                invalid && invalidClassName,
              )}
            >
              <option value="">{t("contact.form.phonePrefix")}</option>
              {phonePrefixOptions.map((opt) => (
                <option key={opt.code} value={opt.prefix}>
                  {`${opt.country} (${opt.prefix})`}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField
          id="contact-phone"
          label={t("contact.form.phone")}
          error={errors.phone}
          labelClassName="sr-only"
        >
        {({ describedBy, invalid, invalidClassName }) => (
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            placeholder={t("contact.form.phone")}
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn("border p-2 rounded w-full", invalid && invalidClassName)}
          />
        )}
      </FormField>
      </div>
      <FormField id="contact-subject" label={t("contact.form.subject")} labelClassName="sr-only">
        {({ describedBy }) => (
          <input
            id="contact-subject"
            name="subject"
            type="text"
            placeholder={t("contact.form.subject")}
            value={form.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            aria-describedby={describedBy}
            className="border p-2 rounded w-full"
          />
        )}
      </FormField>
      <FormField
        id="contact-message"
        label={t("contact.form.message")}
        required
        error={errors.message}
        labelClassName="sr-only"
      >
        {({ describedBy, invalid, invalidClassName }) => (
          <textarea
            id="contact-message"
            name="message"
            placeholder={t("contact.form.message")}
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            required
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn("border p-2 rounded min-h-[120px] w-full", invalid && invalidClassName)}
          />
        )}
      </FormField>

      <div className="space-y-3">
        <FormField id="contact-cookies" error={errors.cookies}>
          {({ describedBy, invalid, invalidClassName }) => (
            <label className="flex items-center space-x-3 cursor-pointer text-sm">
              <input
                id="contact-cookies"
                name="cookies"
                type="checkbox"
                checked={form.cookies}
                onChange={(e) => updateField("cookies", e.target.checked)}
                onBlur={() => handleBlur("cookies")}
                required
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className={cn("w-4 h-4 rounded border-input", invalid && invalidClassName)}
              />
              <span className={cn(invalid && "text-destructive")}>
                {t("contact.form.accept")}{" "}
                <a
                  href={cookiesLink}
                  target="_blank"
                  title={t("contact.form.cookies")}
                  rel="noopener noreferrer nofollow"
                  className="text-primary underline"
                >
                  {t("contact.form.cookies")}
                </a>{" "}
                {t("contact.form.and")}{" "}
                <a
                  href={termsLink}
                  target="_blank"
                  title={t("contact.form.conditions")}
                  rel="noopener noreferrer nofollow"
                  className="text-primary underline"
                >
                  {t("contact.form.conditions")}
                </a>{" "}
                *
              </span>
            </label>
          )}
        </FormField>
        <FormField id="contact-publicidad">
          {() => (
            <label className="flex items-center space-x-3 cursor-pointer text-sm">
              <input
                id="contact-publicidad"
                name="publicidad"
                type="checkbox"
                checked={form.publicidad}
                onChange={(e) => updateField("publicidad", e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span>{t("checkout.acceptAdvertising")}</span>
            </label>
          )}
        </FormField>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {status === "loading" ? t("contact.form.sending") : t("contact.form.submit")}
      </button>
      <FormAlert message={formAlert} />

      {status === "success" && <p className="text-green-600 text-sm">✅ {t("contact.form.success")}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalizedPath } from "@/utils/localizedPaths";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Feedback = {
  tone: "success" | "error";
  text: string;
};

export const NewsletterStrip = () => {
  const { t } = useT();
  const { language } = useLanguage();
  const buildPath = useLocalizedPath();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [validationError, setValidationError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;

    const trimmedEmail = email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      setFeedback({ tone: "error", text: t("newsletter.form.invalid") });
      setValidationError(true);
      return;
    }

    setStatus("loading");
    setFeedback(null);
    setValidationError(false);

    try {
      const langCode = language === "ES" ? 83 : language === "FR" ? 30 : 1;
      const response = await fetch(
        "https://b4experience.app.n8n.cloud/webhook/newsletter",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, lang: langCode }),
        }
      );

      if (!response.ok) {
        throw new Error(`Newsletter webhook failed: ${response.status}`);
      }
      setEmail("");
      setFeedback({ tone: "success", text: t("newsletter.form.success") });
      setValidationError(false);
    } catch (err) {
      console.error("Newsletter signup failed:", err);
      setFeedback({ tone: "error", text: t("newsletter.form.error") });
      setValidationError(false);
    } finally {
      setStatus("idle");
    }
  };

  const messageId = "newsletter-feedback";
  const isLoading = status === "loading";
  const privacyHref = buildPath("/privacy-policy");
  const termsHref = buildPath("/terms-and-conditions");

  return (
    <section className="border-t border-primary-foreground/10 bg-slate-950 text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <h2 className="text-xl font-semibold md:text-2xl">
              {t("newsletter.title")}
            </h2>
            <ul className="space-y-2 text-sm text-primary-foreground/80 list-disc pl-4">
              <li>{t("newsletter.bullets.1")}</li>
              <li>{t("newsletter.bullets.2")}</li>
              <li>{t("newsletter.bullets.3")}</li>
            </ul>
          </div>

          <div className="w-full max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-3" aria-busy={isLoading}>
              <label htmlFor="newsletter-email" className="sr-only">
                {t("newsletter.form.label")}
              </label>
              <div className="flex w-full">
                <input
                  id="newsletter-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={t("newsletter.form.placeholder")}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (feedback) setFeedback(null);
                    if (validationError) setValidationError(false);
                  }}
                  disabled={isLoading}
                  aria-invalid={validationError || undefined}
                  aria-describedby={feedback ? messageId : undefined}
                  className="flex-1 rounded-l-xl border border-white/20 border-r-0 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center rounded-r-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? t("btn.loading") : t("newsletter.form.button")}
                </button>
              </div>
              {feedback && (
                <p
                  id={messageId}
                  role="status"
                  aria-live="polite"
                  className={`text-xs ${
                    feedback.tone === "success"
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {feedback.text}
                </p>
              )}
              <p className="text-xs text-primary-foreground/60">
                {t("newsletter.legal.beforePrivacy")}{" "}
                <Link
                  href={privacyHref}
                  className="underline decoration-primary-foreground/60 underline-offset-2 transition-colors hover:text-primary-foreground"
                  title={"View privacy policy"}>
                  {t("footer.privacyPolicy")}
                </Link>
                {t("newsletter.legal.between")}
                <Link
                  href={termsHref}
                  className="underline decoration-primary-foreground/60 underline-offset-2 transition-colors hover:text-primary-foreground"
                  title={"View terms and conditions"}>
                  {t("footer.termsConditions")}
                </Link>
                {t("newsletter.legal.after")}
              </p>
              <p className="text-xs text-primary-foreground/60">
                {t("newsletter.legal.unsubscribe")}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

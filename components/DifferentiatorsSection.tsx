import { useT } from "@/i18n/useT";
import { BadgeCheck, Sparkles, ShieldCheck } from "lucide-react";

const DIFFERENTIATOR_KEYS = [
  {
    title: "home.differentiators.items.levels.title",
    description: "home.differentiators.items.levels.description",
    icon: BadgeCheck,
  },
  {
    title: "home.differentiators.items.groups.title",
    description: "home.differentiators.items.groups.description",
    icon: Sparkles,
  },
  {
    title: "home.differentiators.items.support.title",
    description: "home.differentiators.items.support.description",
    icon: ShieldCheck,
  },
];

export const DifferentiatorsSection = () => {
  const { t } = useT();
  const title = t("hero.title");
  const subtitle = t("home.differentiators.subtitle");

  return (
    <section className="bg-slate-100 py-14">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <h1 className="text-3xl font-semibold tracking-tight text-center text-slate-900 mb-2 capitalize md:text-4xl">
          {title}
        </h1>
        <h2 className="text-lg font-medium tracking-tight text-center text-slate-600 mb-10 md:text-xl">
          {subtitle}
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {DIFFERENTIATOR_KEYS.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-slate-900">
                  {t(title)}
                </h3>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">
                {t(description)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

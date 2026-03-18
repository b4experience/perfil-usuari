// components/SectionDetailCategory.tsx
import { motion } from "framer-motion";
import { HTMLContent } from "@/components/HTMLContent";
import { Bookmark } from "lucide-react";

interface SectionDetailCategoryProps {
  title?: string;
  description?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const SectionDetailCategory = ({
  title,
  description,
  fallbackTitle,
  fallbackDescription,
}: SectionDetailCategoryProps) => {
  if (!title && !description && !fallbackTitle && !fallbackDescription) {
    return null;
  }

  const displayTitle = title || fallbackTitle;
  const displayDescription = description || fallbackDescription;

  if (!displayTitle && !displayDescription) {
    return null;
  }

  return (
    <section className="mt-16 rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-purple-50/60 to-blue-50/60 px-6 py-10 shadow-[0_25px_80px_rgba(15,23,42,0.08)] md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mt-5 space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {displayTitle && (
            <HTMLContent
              content={displayTitle}
              className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 mt-3 [&_h1]:text-xl [&_h2]:text-xl [&_h3]:text-xl [&_h4]:text-xl [&_h5]:text-xl [&_h6]:text-xl md:[&_h1]:text-2xl md:[&_h2]:text-2xl md:[&_h3]:text-2xl md:[&_h4]:text-2xl md:[&_h5]:text-2xl md:[&_h6]:text-2xl"
            />
          )}

          {displayDescription && (
            <div className="text-base leading-relaxed text-slate-700 [&_*]:font-inherit [&_.row]:grid [&_.row]:gap-6 [&_.row]:md:grid-cols-2 [&_.col-6]:space-y-4">
              <HTMLContent content={displayDescription} />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

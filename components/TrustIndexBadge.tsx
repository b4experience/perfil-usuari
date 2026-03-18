import { useTrustIndexEmbed } from "@/hooks/useTrustIndexEmbed";

const TRUSTINDEX_BADGE_ID = "1fbfc5058b577058eb56bc30680";

export const TrustIndexBadge = () => {
  const { containerRef } = useTrustIndexEmbed(TRUSTINDEX_BADGE_ID);

  return (
    <div className="mt-6 flex justify-center" aria-live="polite">
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
};

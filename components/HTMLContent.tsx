import { cn } from "@/lib/utils";

interface HTMLContentProps {
  content: string;
  className?: string;
  variant?: 'default' | 'itinerary' | 'details' | 'small';
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'span';
}

export const HTMLContent = ({ content, className, variant = 'default', as = 'div' }: HTMLContentProps) => {
  if (!content?.trim()) return null;

  const Tag = as;
  const baseClasses = "html-content";
  const variantClasses = {
    default: "text-base",
    itinerary: "text-sm leading-relaxed",
    details: "text-sm",
    small: "text-xs"
  };

  return (
    <Tag
      className={cn(baseClasses, variantClasses[variant], className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

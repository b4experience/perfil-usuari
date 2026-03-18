import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SearchFiltersLeftBarProps = {
  children: ReactNode;
  className?: string;
};

const defaultClasses =
  "hidden flex-shrink-0 lg:block lg:w-80 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-120px)]";

export const SearchFiltersLeftBar = ({ children, className }: SearchFiltersLeftBarProps) => {
  return <div className={cn(defaultClasses, className)}>{children}</div>;
};

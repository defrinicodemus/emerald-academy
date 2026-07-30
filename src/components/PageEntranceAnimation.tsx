"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function PageEntranceAnimation({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setAnimate(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn(animate && "animate-in fade-in slide-in-from-bottom-4 duration-500")}>
      {children}
    </div>
  );
}

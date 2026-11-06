"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// The staff layout persists between pages, so its scroll area would keep the
// previous page's scroll position. Reset it (and the window, which scrolls on
// mobile) to the top whenever the route changes.
export default function PageScroller({ className, children }) {
  const ref = useRef(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    ref.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

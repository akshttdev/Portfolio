import type { ReactNode } from "react";
import ColumnWipe from "./ColumnWipe";

/** Wraps a page with the column-wipe enter transition. */
export default function HorizontalTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <ColumnWipe />
      <div className="relative z-10">{children}</div>
    </>
  );
}

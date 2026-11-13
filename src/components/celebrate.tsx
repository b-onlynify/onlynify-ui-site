"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Celebration } from "./motion";

/** One-time pop-up after signing up (?joined=1) or after a Pro purchase (?welcome=1); then drops the flag. */
export function AccountCelebration({ title, message, cta }: { title: string; message: string; cta: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return <Celebration open={open} title={title} message={message} cta={cta} onClose={() => (setOpen(false), router.replace("/account", { scroll: false }))} />;
}

import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return <LegalDocument which="terms" />;
}

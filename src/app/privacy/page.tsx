import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return <LegalDocument which="privacy" />;
}

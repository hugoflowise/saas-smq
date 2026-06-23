import { LegalFooter } from "@/components/legal-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 bg-surface px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
      <LegalFooter />
    </div>
  );
}

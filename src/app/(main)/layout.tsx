import Shell from "@/components/shell";
import { AdsProvider } from "@/store/ads";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdsProvider>
      <Shell>{children}</Shell>
    </AdsProvider>
  );
}

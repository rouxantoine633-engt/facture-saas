import { Sidebar } from "@/components/app/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar />
      <main id="contenu" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}

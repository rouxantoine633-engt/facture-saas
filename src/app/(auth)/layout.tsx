export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenu" className="px-4 pb-16">
      {children}
    </main>
  );
}

// Force dynamic rendering for auth pages to avoid prerendering
// when Supabase env vars aren't available during build
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

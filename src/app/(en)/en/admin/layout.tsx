import AdminShell from "@/components/admin/AdminShell";

export default function AdminEnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell lang="en" pageTitle="Dashboard">{children}</AdminShell>;
}
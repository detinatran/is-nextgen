import AdminShell from "@/components/admin/AdminShell";

export default function AdminViLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell lang="vi" pageTitle="Bảng điều khiển">{children}</AdminShell>;
}
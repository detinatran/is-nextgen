import RootDocument from "@/components/RootDocument";

export { viewport } from "@/components/RootDocument";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="vi">{children}</RootDocument>;
}

import { ProtectedRoute } from "@/components/auth/protected-route"

interface PartnerDetailPageProps {
  params: {
    id: string
  }
}

export default function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  return (
    <ProtectedRoute requiredPermission="partners:manage">
      <div className="flex min-h-screen w-full flex\

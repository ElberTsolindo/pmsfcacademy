"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

// Update the RoleGuard to handle the new role types
export default function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.tipo)) {
    return (
      fallback || (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Você não tem permissão para acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}

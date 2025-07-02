"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Shield, User } from "lucide-react"

interface LoginFormProps {
  onLogin: (email: string, password: string, cpf?: string) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [adminCredentials, setAdminCredentials] = useState({ email: "", password: "" })
  const [clienteCpf, setClienteCpf] = useState("")
  const [activeTab, setActiveTab] = useState("admin")

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(adminCredentials.email, adminCredentials.password)
  }

  const handleClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin("", "", clienteCpf)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Academia Pública</CardTitle>
          <CardDescription>Sistema de Gerenciamento de Frequência</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Administração</span>
              </TabsTrigger>
              <TabsTrigger value="cliente" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Aluno</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Usuário</Label>
                  <Input
                    id="email"
                    placeholder="admin"
                    value={adminCredentials.email}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Entrar como Administrador
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>© 2025. Departamento de Tecnologia - Todos os direitos reservados. Versão: 1.0</p>
              </div>
            </TabsContent>

            <TabsContent value="cliente">
              <form onSubmit={handleClienteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={clienteCpf}
                    onChange={(e) => setClienteCpf(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Consultar Informações
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>
                  <strong>Credenciais disponíveis para consulta:</strong>
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <p>• CPF (documento principal)</p>
                  <p>• Nome completo</p>
                  <p>• Data de nascimento</p>
                  <p>• Telefone de contato</p>
                  <p>• Endereço residencial</p>
                  <p>• Horário de treino</p>
                  <p>• Status do atestado médico</p>
                  <p>• Histórico de frequência</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

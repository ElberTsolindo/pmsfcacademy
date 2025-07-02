"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Clock,
  Calendar,
  BarChart3,
  UserPlus,
  Search,
  Download,
  Settings,
  FileText,
  AlertTriangle,
} from "lucide-react"
// Update imports to use aluno instead of cliente
import AlunoForm from "@/components/aluno-form"
import AlunoList from "@/components/aluno-list"
import HorarioManager from "@/components/horario-manager"
import PresencaControl from "@/components/presenca-control"
import AdminManager from "@/components/admin-manager"
import { useAuth } from "@/hooks/use-auth"
import LoginForm from "@/components/login-form"
// Update the import for AlunoDashboard
import AlunoDashboard from "@/components/cliente-dashboard"
import JustificativasManager from "@/components/justificativas-manager"
import InatividadeResolver from "@/components/inatividade-resolver"
import RoleGuard from "@/components/role-guard"
import DailyAttendanceEnforcer from "@/components/daily-attendance-enforcer"

// Add import
import NotificationSystem from "@/components/notification-system"
import AutomaticInactivityManager from "@/components/automatic-inactivity-manager"

// Update the main app to use the new role structure and components
import GestorFrequenciaScreen from "@/components/gestor-frequencia-screen"
import EnhancedRelatorioGenerator from "@/components/enhanced-relatorio-generator"

export default function AcademiaApp() {
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  if (!user) {
    return <LoginForm onLogin={login} />
  }

  // Se for cliente, mostrar dashboard específico
  // Update the reference in the component
  if (user.tipo === "aluno") {
    return <AlunoDashboard alunoId={user.id} onLogout={logout} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DailyAttendanceEnforcer />
      <AutomaticInactivityManager />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Academia Pública</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <NotificationSystem />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Update the TabsList to show appropriate tabs based on user roles */}
          <TabsList className={`flex flex-wrap gap-1 ${user.tipo === "admin" ? "justify-start" : "justify-between"}`}>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>

            {(user.tipo === "admin" || user.tipo === "gestor_cadastro") && (
              <>
                <TabsTrigger value="clientes" className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Clientes</span>
                </TabsTrigger>
                <TabsTrigger value="horarios" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Horários</span>
                </TabsTrigger>
              </>
            )}

            {(user.tipo === "admin" || user.tipo === "gestor_frequencia") && (
              <>
                <TabsTrigger value="registro-frequencia" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Registro</span>
                </TabsTrigger>
                <TabsTrigger value="justificativas" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Justificativas</span>
                </TabsTrigger>
                <TabsTrigger value="inatividade" className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Inatividade</span>
                </TabsTrigger>
              </>
            )}

            <TabsTrigger value="relatorios" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Gerador de Relatórios</span>
            </TabsTrigger>

            {user.tipo === "admin" && (
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardContent />
          </TabsContent>

          {/* Add the new tab content for frequency registration */}
          <TabsContent value="registro-frequencia">
            <RoleGuard allowedRoles={["admin", "gestor_frequencia"]}>
              <GestorFrequenciaScreen />
            </RoleGuard>
          </TabsContent>

          {/* Update the role guards for existing tabs */}
          <TabsContent value="clientes">
            <RoleGuard allowedRoles={["admin", "gestor_cadastro"]}>
              <div className="space-y-6">
                <AlunoForm />
                <AlunoList />
              </div>
            </RoleGuard>
          </TabsContent>

          <TabsContent value="horarios">
            <RoleGuard allowedRoles={["admin", "gestor_cadastro"]}>
              <HorarioManager />
            </RoleGuard>
          </TabsContent>

          <TabsContent value="presenca">
            <RoleGuard allowedRoles={["admin", "gestor_frequencia"]}>
              <PresencaControl />
            </RoleGuard>
          </TabsContent>

          <TabsContent value="justificativas">
            <RoleGuard allowedRoles={["admin", "gestor_frequencia"]}>
              <JustificativasManager />
            </RoleGuard>
          </TabsContent>

          <TabsContent value="inatividade">
            <RoleGuard allowedRoles={["admin", "gestor_frequencia"]}>
              <InatividadeResolver />
            </RoleGuard>
          </TabsContent>

          {/* Update the reports tab to use the enhanced generator */}
          <TabsContent value="relatorios">
            <EnhancedRelatorioGenerator />
          </TabsContent>

          <TabsContent value="busca">
            <BuscaAvancada />
          </TabsContent>

          {user.tipo === "admin" && (
            <TabsContent value="admin">
              <AdminManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

function DashboardContent() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesHoje: 0,
    horariosDisponiveis: 0,
    ocupacaoMedia: 0,
  })

  useEffect(() => {
    // Simular carregamento de estatísticas
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const horarios = JSON.parse(localStorage.getItem("horarios") || "[]")
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")

    const hoje = new Date().toISOString().split("T")[0]
    const presencasHoje = presencas.filter((p: any) => p.data === hoje)

    setStats({
      totalClientes: clientes.length,
      clientesHoje: presencasHoje.length,
      horariosDisponiveis: horarios.filter((h: any) => h.ativo).length,
      ocupacaoMedia: horarios.length > 0 ? Math.round((clientes.length / (horarios.length * 20)) * 100) : 0,
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Visão geral da academia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presenças Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesHoje}</div>
            <p className="text-xs text-muted-foreground">Check-ins realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horários Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.horariosDisponiveis}</div>
            <p className="text-xs text-muted-foreground">Horários disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ocupacaoMedia}%</div>
            <p className="text-xs text-muted-foreground">Capacidade utilizada</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Horários Mais Procurados</CardTitle>
            <CardDescription>Top 5 horários com mais clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["07:00 - 08:00", "18:00 - 19:00", "19:00 - 20:00", "06:00 - 07:00", "20:00 - 21:00"].map(
                (horario, index) => (
                  <div key={horario} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{horario}</span>
                    <Badge variant="secondary">{20 - index * 2} clientes</Badge>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Cliente João Silva fez check-in às 07:30</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Nova cliente Maria Santos cadastrada</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Horário 21:00-22:00 atingiu capacidade máxima</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Relatório mensal gerado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BuscaAvancada() {
  const [filtros, setFiltros] = useState({
    nome: "",
    horario: "",
    dataInicio: "",
    dataFim: "",
    frequenciaMin: "",
  })
  const [resultados, setResultados] = useState([])

  const buscar = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")

    let resultadosFiltrados = clientes.filter((cliente: any) => {
      let match = true

      if (filtros.nome && !cliente.nome.toLowerCase().includes(filtros.nome.toLowerCase())) {
        match = false
      }

      if (filtros.horario && cliente.horario !== filtros.horario) {
        match = false
      }

      return match
    })

    // Adicionar frequência aos resultados
    resultadosFiltrados = resultadosFiltrados.map((cliente: any) => {
      const presencasCliente = presencas.filter((p: any) => p.clienteId === cliente.id)
      return {
        ...cliente,
        frequencia: presencasCliente.length,
      }
    })

    if (filtros.frequenciaMin) {
      resultadosFiltrados = resultadosFiltrados.filter(
        (cliente: any) => cliente.frequencia >= Number.parseInt(filtros.frequenciaMin),
      )
    }

    setResultados(resultadosFiltrados)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Busca Avançada</h2>
        <p className="text-gray-600">Encontre clientes usando filtros específicos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente</Label>
              <Input
                id="nome"
                placeholder="Digite o nome..."
                value={filtros.nome}
                onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário</Label>
              <Input
                id="horario"
                placeholder="Ex: 07:00-08:00"
                value={filtros.horario}
                onChange={(e) => setFiltros({ ...filtros, horario: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequencia">Frequência Mínima</Label>
              <Input
                id="frequencia"
                type="number"
                placeholder="Número de presenças"
                value={filtros.frequenciaMin}
                onChange={(e) => setFiltros({ ...filtros, frequenciaMin: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={buscar} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
            <CardDescription>{resultados.length} cliente(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resultados.map((cliente: any) => (
                <div key={cliente.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{cliente.nome}</h3>
                    <p className="text-sm text-gray-600">CPF: {cliente.cpf}</p>
                    <p className="text-sm text-gray-600">Horário: {cliente.horario}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{cliente.frequencia} presenças</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

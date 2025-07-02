"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Edit, Trash2, Shield, Activity, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminManager() {
  const { toast } = useToast()
  const [administradores, setAdministradores] = useState([])
  const [logs, setLogs] = useState([])
  const [novoAdmin, setNovoAdmin] = useState({ nome: "", email: "", senha: "", tipo: "gestor" })
  const [adminEditando, setAdminEditando] = useState(null)
  const [dialogAberto, setDialogAberto] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = () => {
    const adminsSalvos = JSON.parse(localStorage.getItem("administradores") || "[]")
    const logsSalvos = JSON.parse(localStorage.getItem("logs") || "[]")

    // Inicializar com admin padrão se não existir
    if (adminsSalvos.length === 0) {
      const adminPadrao = {
        id: "1",
        nome: "Administrador",
        email: "admin@academia.gov.br",
        senha: "admin123",
        ativo: true,
        dataCriacao: new Date().toISOString(),
        tipo: "admin",
      }
      adminsSalvos.push(adminPadrao)
      localStorage.setItem("administradores", JSON.stringify(adminsSalvos))
    }

    setAdministradores(adminsSalvos)
    setLogs(logsSalvos.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }

  const criarAdmin = () => {
    if (!novoAdmin.nome || !novoAdmin.email || !novoAdmin.senha) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Verificar se email já existe
    if (administradores.some((admin: any) => admin.email === novoAdmin.email)) {
      toast({
        title: "Erro",
        description: "Este email já está em uso.",
        variant: "destructive",
      })
      return
    }

    const novoAdministrador = {
      id: Date.now().toString(),
      ...novoAdmin,
      ativo: true,
      dataCriacao: new Date().toISOString(),
    }

    const adminsAtualizados = [...administradores, novoAdministrador]
    localStorage.setItem("administradores", JSON.stringify(adminsAtualizados))
    setAdministradores(adminsAtualizados)

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Criação de Administrador",
      detalhes: `Novo administrador ${novoAdmin.nome} criado`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Sucesso",
      description: "Administrador criado com sucesso!",
    })

    setNovoAdmin({ nome: "", email: "", senha: "", tipo: "gestor" })
  }

  const editarAdmin = (admin: any) => {
    setAdminEditando({ ...admin })
    setDialogAberto(true)
  }

  const salvarEdicao = () => {
    if (!adminEditando) return

    const adminsAtualizados = administradores.map((admin: any) =>
      admin.id === adminEditando.id ? adminEditando : admin,
    )

    localStorage.setItem("administradores", JSON.stringify(adminsAtualizados))
    setAdministradores(adminsAtualizados)

    toast({
      title: "Sucesso",
      description: "Administrador atualizado com sucesso!",
    })

    setDialogAberto(false)
    setAdminEditando(null)
  }

  const excluirAdmin = (id: string) => {
    if (administradores.length <= 1) {
      toast({
        title: "Erro",
        description: "Deve haver pelo menos um administrador ativo.",
        variant: "destructive",
      })
      return
    }

    const admin = administradores.find((a: any) => a.id === id)
    const adminsAtualizados = administradores.filter((admin: any) => admin.id !== id)

    localStorage.setItem("administradores", JSON.stringify(adminsAtualizados))
    setAdministradores(adminsAtualizados)

    toast({
      title: "Administrador Excluído",
      description: `${admin?.nome} foi removido do sistema.`,
    })
  }

  const realizarBackup = () => {
    const dados = {
      clientes: JSON.parse(localStorage.getItem("clientes") || "[]"),
      horarios: JSON.parse(localStorage.getItem("horarios") || "[]"),
      presencas: JSON.parse(localStorage.getItem("presencas") || "[]"),
      administradores: JSON.parse(localStorage.getItem("administradores") || "[]"),
      logs: JSON.parse(localStorage.getItem("logs") || "[]"),
      dataBackup: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(dados, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `backup_academia_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Backup Realizado",
      description: "Dados exportados com sucesso!",
    })
  }

  const restaurarBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string)

        // Validar estrutura do backup
        if (!dados.clientes || !dados.horarios || !dados.presencas) {
          throw new Error("Arquivo de backup inválido")
        }

        // Restaurar dados
        localStorage.setItem("clientes", JSON.stringify(dados.clientes))
        localStorage.setItem("horarios", JSON.stringify(dados.horarios))
        localStorage.setItem("presencas", JSON.stringify(dados.presencas))
        localStorage.setItem("administradores", JSON.stringify(dados.administradores))
        localStorage.setItem("logs", JSON.stringify(dados.logs))

        toast({
          title: "Backup Restaurado",
          description: "Dados importados com sucesso! Recarregue a página.",
        })

        // Recarregar dados
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Arquivo de backup inválido ou corrompido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Administração</h2>
        <p className="text-gray-600">Gerencie administradores, logs e backup do sistema</p>
      </div>

      <Tabs defaultValue="admins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="logs">Logs de Atividade</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restauração</TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Administrador</CardTitle>
              <CardDescription>Adicione um novo usuário administrador ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    placeholder="Digite o nome"
                    value={novoAdmin.nome}
                    onChange={(e) => setNovoAdmin({ ...novoAdmin, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@academia.gov.br"
                    value={novoAdmin.email}
                    onChange={(e) => setNovoAdmin({ ...novoAdmin, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite a senha"
                    value={novoAdmin.senha}
                    onChange={(e) => setNovoAdmin({ ...novoAdmin, senha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Usuário</Label>
                  <Select value={novoAdmin.tipo} onValueChange={(value) => setNovoAdmin({ ...novoAdmin, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor_cadastro">Gestor de Cadastro</SelectItem>
                      <SelectItem value="gestor_frequencia">Gestor de Frequência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={criarAdmin} className="mt-4">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Administrador
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Administradores</CardTitle>
              <CardDescription>Gerencie os usuários com acesso ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {administradores.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{admin.nome}</h3>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <p className="text-xs text-gray-500">
                          {admin.tipo === "admin"
                            ? "Administrador"
                            : admin.tipo === "gestor_cadastro"
                              ? "Gestor de Cadastro"
                              : admin.tipo === "gestor_frequencia"
                                ? "Gestor de Frequência"
                                : "Gestor"}{" "}
                          - Criado em {new Date(admin.dataCriacao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={admin.ativo ? "default" : "secondary"}>{admin.ativo ? "Ativo" : "Inativo"}</Badge>
                      <Button variant="outline" size="sm" onClick={() => editarAdmin(admin)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => excluirAdmin(admin.id)}
                        disabled={administradores.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Logs de Atividade</span>
              </CardTitle>
              <CardDescription>Histórico de todas as ações realizadas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{log.acao}</h4>
                        <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.detalhes}</p>
                      <p className="text-xs text-gray-500">Por: {log.usuario}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Nenhuma atividade registrada ainda.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Backup dos Dados</span>
                </CardTitle>
                <CardDescription>Exporte todos os dados do sistema para um arquivo de backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  O backup incluirá todos os clientes, horários, presenças, administradores e logs do sistema.
                </p>
                <Button onClick={realizarBackup} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Realizar Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Restaurar Backup</span>
                </CardTitle>
                <CardDescription>Importe dados de um arquivo de backup anterior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">⚠️ Esta ação substituirá todos os dados atuais do sistema.</p>
                <div className="space-y-2">
                  <Label htmlFor="backup-file">Selecionar Arquivo de Backup</Label>
                  <Input id="backup-file" type="file" accept=".json" onChange={restaurarBackup} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {JSON.parse(localStorage.getItem("clientes") || "[]").length}
                  </div>
                  <div className="text-sm text-blue-700">Clientes</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {JSON.parse(localStorage.getItem("presencas") || "[]").length}
                  </div>
                  <div className="text-sm text-green-700">Presenças</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{administradores.length}</div>
                  <div className="text-sm text-purple-700">Administradores</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{logs.length}</div>
                  <div className="text-sm text-orange-700">Logs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
            <DialogDescription>Altere as informações do administrador</DialogDescription>
          </DialogHeader>
          {adminEditando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input
                  id="edit-nome"
                  value={adminEditando.nome}
                  onChange={(e) => setAdminEditando({ ...adminEditando, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={adminEditando.email}
                  onChange={(e) => setAdminEditando({ ...adminEditando, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-senha">Nova Senha (deixe em branco para manter)</Label>
                <Input
                  id="edit-senha"
                  type="password"
                  placeholder="Nova senha"
                  onChange={(e) => setAdminEditando({ ...adminEditando, senha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo de Usuário</Label>
                <Select
                  value={adminEditando.tipo || "gestor_cadastro"}
                  onValueChange={(value) => setAdminEditando({ ...adminEditando, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor_cadastro">Gestor de Cadastro</SelectItem>
                    <SelectItem value="gestor_frequencia">Gestor de Frequência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={salvarEdicao}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

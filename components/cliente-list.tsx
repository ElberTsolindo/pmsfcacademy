"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Search, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ClientDetailScreen from "@/components/client-detail-screen"
import RoleGuard from "@/components/role-guard"

export default function ClienteList() {
  const { toast } = useToast()
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState("")
  const [clienteEditando, setClienteEditando] = useState(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [clienteDetalhes, setClienteDetalhes] = useState<string | null>(null)

  const horarios = [
    "05:00 - 06:00",
    "06:00 - 07:00",
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
  ]

  useEffect(() => {
    carregarClientes()
  }, [])

  const carregarClientes = () => {
    const clientesSalvos = JSON.parse(localStorage.getItem("clientes") || "[]")
    setClientes(clientesSalvos)
  }

  const clientesFiltrados = clientes.filter(
    (cliente: any) =>
      cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.horario.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.cpf.includes(filtro),
  )

  const editarCliente = (cliente: any) => {
    setClienteEditando(cliente)
    setDialogAberto(true)
  }

  const salvarEdicao = () => {
    if (!clienteEditando) return

    const clientesAtualizados = clientes.map((c: any) => (c.id === clienteEditando.id ? clienteEditando : c))

    localStorage.setItem("clientes", JSON.stringify(clientesAtualizados))
    setClientes(clientesAtualizados)

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Edição de Cliente",
      detalhes: `Cliente ${clienteEditando.nome} foi editado`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Sucesso",
      description: "Cliente atualizado com sucesso!",
    })

    setDialogAberto(false)
    setClienteEditando(null)
  }

  const excluirCliente = (id: string) => {
    const cliente = clientes.find((c: any) => c.id === id)
    const clientesAtualizados = clientes.filter((c: any) => c.id !== id)

    localStorage.setItem("clientes", JSON.stringify(clientesAtualizados))
    setClientes(clientesAtualizados)

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Exclusão de Cliente",
      detalhes: `Cliente ${cliente?.nome} foi excluído`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Cliente Excluído",
      description: "Cliente removido com sucesso!",
    })
  }

  const verDetalhes = (clienteId: string) => {
    setClienteDetalhes(clienteId)
  }

  return (
    <RoleGuard allowedRoles={["admin", "gestor_cadastro"]}>
      {clienteDetalhes ? (
        <ClientDetailScreen clienteId={clienteDetalhes} onBack={() => setClienteDetalhes(null)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Gerencie os clientes cadastrados na academia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, horário ou CPF..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="space-y-3">
                {clientesFiltrados.map((cliente: any) => (
                  <div key={cliente.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{cliente.nome}</h3>
                      <p className="text-sm text-gray-600">
                        CPF: {cliente.cpf} | RG: {cliente.rg}
                      </p>
                      <p className="text-sm text-gray-600">Endereço: {cliente.endereco}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{cliente.horario}</Badge>
                        {cliente.observacoes && <Badge variant="secondary">Com observações</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => verDetalhes(cliente.id)}>
                        <User className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => editarCliente(cliente)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => excluirCliente(cliente.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {clientesFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filtro ? "Nenhum cliente encontrado com os filtros aplicados." : "Nenhum cliente cadastrado ainda."}
                </div>
              )}
            </div>
          </CardContent>

          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
                <DialogDescription>Faça as alterações necessárias nos dados do cliente.</DialogDescription>
              </DialogHeader>
              {clienteEditando && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nome">Nome Completo</Label>
                    <Input
                      id="edit-nome"
                      value={clienteEditando.nome}
                      onChange={(e) => setClienteEditando({ ...clienteEditando, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cpf">CPF</Label>
                    <Input
                      id="edit-cpf"
                      value={clienteEditando.cpf}
                      onChange={(e) => setClienteEditando({ ...clienteEditando, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rg">RG</Label>
                    <Input
                      id="edit-rg"
                      value={clienteEditando.rg}
                      onChange={(e) => setClienteEditando({ ...clienteEditando, rg: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endereco">Endereço</Label>
                    <Input
                      id="edit-endereco"
                      value={clienteEditando.endereco}
                      onChange={(e) => setClienteEditando({ ...clienteEditando, endereco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-horario">Horário</Label>
                    <Select
                      value={clienteEditando.horario}
                      onValueChange={(value) => setClienteEditando({ ...clienteEditando, horario: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {horarios.map((horario) => (
                          <SelectItem key={horario} value={horario}>
                            {horario}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-observacoes">Observações</Label>
                    <Textarea
                      id="edit-observacoes"
                      value={clienteEditando.observacoes}
                      onChange={(e) => setClienteEditando({ ...clienteEditando, observacoes: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" onClick={salvarEdicao}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      )}
    </RoleGuard>
  )
}

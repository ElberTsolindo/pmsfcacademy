"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, AlertTriangle, CheckCircle, FileText, RefreshCw } from "lucide-react"
import { format, addMonths } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function InatividadeResolver() {
  const { toast } = useToast()
  const [clientesInativos, setClientesInativos] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [justificativaTexto, setJustificativaTexto] = useState("")
  const [dataJustificativa, setDataJustificativa] = useState(new Date())

  useEffect(() => {
    carregarClientesInativos()
  }, [])

  // Modificar a função carregarClientesInativos
  const carregarClientesInativos = () => {
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")

    // Filtrar apenas alunos com status inativo
    const inativos = alunos.filter((aluno: any) => aluno.status === "inativo")

    setClientesInativos(inativos)
  }

  const calcularFaltasConsecutivas = (clienteId: string, presencas: any[], justificativas: any[]) => {
    const presencasCliente = presencas.filter((p: any) => p.clienteId === clienteId)
    const justificativasCliente = justificativas.filter((j: any) => j.clienteId === clienteId)

    let consecutivas = 0
    const hoje = new Date()

    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      const temPresenca = presencasCliente.some((p: any) => p.data === dataStr)
      const temJustificativa = justificativasCliente.some((j: any) => j.data === dataStr)

      if (!temPresenca && !temJustificativa && data.getDay() >= 1 && data.getDay() <= 5) {
        consecutivas++
      } else if (temPresenca || temJustificativa) {
        break
      }
    }

    return consecutivas
  }

  const justificarFalta = () => {
    if (!clienteSelecionado || !justificativaTexto) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e digite a justificativa.",
        variant: "destructive",
      })
      return
    }

    const dataStr = format(dataJustificativa, "yyyy-MM-dd")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    const novaJustificativa = {
      id: Date.now().toString(),
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nome,
      data: dataStr,
      motivo: "Justificativa para reativação",
      observacoes: justificativaTexto,
      timestamp: new Date().toISOString(),
    }

    justificativas.push(novaJustificativa)
    localStorage.setItem("justificativas", JSON.stringify(justificativas))

    toast({
      title: "Justificativa Registrada",
      description: "Falta justificada com sucesso!",
    })

    setJustificativaTexto("")
    carregarClientesInativos()
  }

  const renovarAtestado = (cliente: any) => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const clienteIndex = clientes.findIndex((c: any) => c.id === cliente.id)

    if (clienteIndex !== -1) {
      clientes[clienteIndex].dataAtestado = format(new Date(), "yyyy-MM-dd")
      localStorage.setItem("clientes", JSON.stringify(clientes))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Renovação de Atestado",
        detalhes: `Atestado de ${cliente.nome} renovado`,
        timestamp: new Date().toISOString(),
        usuario: "Admin",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Atestado Renovado",
        description: `Atestado de ${cliente.nome} renovado com sucesso!`,
      })

      carregarClientesInativos()
    }
  }

  // Modificar a função reativarCliente
  const reativarCliente = (cliente: any) => {
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
    const faltasConsecutivas = calcularFaltasConsecutivas(cliente.id, presencas, justificativas)

    // Verificar se ainda tem faltas não justificadas
    if (faltasConsecutivas >= 7) {
      toast({
        title: "Erro",
        description: "Aluno ainda possui faltas não justificadas.",
        variant: "destructive",
      })
      return
    }

    // Verificar atestado se necessário
    if (cliente.dataAtestado) {
      const dataAtestado = new Date(cliente.dataAtestado)
      const dataVencimento = addMonths(dataAtestado, 6)

      if (new Date() > dataVencimento) {
        toast({
          title: "Erro",
          description: "Atestado médico vencido. Renove o atestado primeiro.",
          variant: "destructive",
        })
        return
      }
    }

    // Reativar aluno
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const alunoIndex = alunos.findIndex((a: any) => a.id === cliente.id)

    if (alunoIndex !== -1) {
      alunos[alunoIndex].status = "ativo"
      localStorage.setItem("alunos", JSON.stringify(alunos))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Reativação de Aluno",
        detalhes: `Aluno ${cliente.nome} foi reativado`,
        timestamp: new Date().toISOString(),
        usuario: "Admin",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Aluno Reativado",
        description: `${cliente.nome} foi reativado com sucesso!`,
      })

      carregarClientesInativos()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resolução de Inatividade</h2>
        <p className="text-gray-600">Gerencie clientes inativos por faltas consecutivas</p>
      </div>

      {clientesInativos.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Não há clientes inativos no momento. Todos os clientes estão em situação regular.
          </AlertDescription>
        </Alert>
      )}

      {clientesInativos.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{clientesInativos.length} cliente(s) inativo(s)</strong> por 7 ou mais faltas consecutivas não
            justificadas.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes Inativos</CardTitle>
            <CardDescription>Lista de clientes que precisam regularizar sua situação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientesInativos.map((cliente: any) => {
                const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
                const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
                const faltasConsecutivas = calcularFaltasConsecutivas(cliente.id, presencas, justificativas)

                // Verificar status do atestado
                let atestadoVencido = false
                if (cliente.dataAtestado) {
                  const dataAtestado = new Date(cliente.dataAtestado)
                  const dataVencimento = addMonths(dataAtestado, 6)
                  atestadoVencido = new Date() > dataVencimento
                }

                return (
                  <div key={cliente.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{cliente.nome}</h3>
                        <p className="text-sm text-gray-600">
                          CPF: {cliente.cpf} | Horário: {cliente.horario}
                        </p>
                      </div>
                      <Badge variant="destructive">{faltasConsecutivas} faltas consecutivas</Badge>
                    </div>

                    {atestadoVencido && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">Atestado médico vencido</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setClienteSelecionado(cliente)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Justificar Falta
                      </Button>

                      {atestadoVencido && (
                        <Button variant="outline" size="sm" onClick={() => renovarAtestado(cliente)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renovar Atestado
                        </Button>
                      )}

                      <Button variant="default" size="sm" onClick={() => reativarCliente(cliente)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Reativar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {clienteSelecionado && (
          <Card>
            <CardHeader>
              <CardTitle>Justificar Falta</CardTitle>
              <CardDescription>Registre uma justificativa para {clienteSelecionado.nome}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data da Falta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dataJustificativa, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataJustificativa}
                      onSelect={(date) => date && setDataJustificativa(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa</Label>
                <Textarea
                  id="justificativa"
                  placeholder="Digite o motivo da falta..."
                  value={justificativaTexto}
                  onChange={(e) => setJustificativaTexto(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={justificarFalta} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Registrar Justificativa
                </Button>
                <Button variant="outline" onClick={() => setClienteSelecionado(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

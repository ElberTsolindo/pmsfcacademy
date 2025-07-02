"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, FileText, CheckCircle, Search } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import JustificativasMultiplasModal from "@/components/justificativas-multiplas-modal"

export default function JustificativasManager() {
  const { toast } = useToast()
  const [clientes, setClientes] = useState([])
  const [justificativas, setJustificativas] = useState([])
  const [presencas, setPresencas] = useState([])
  const [cpfBusca, setCpfBusca] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [diasFalta, setDiasFalta] = useState([])
  const [novaJustificativa, setNovaJustificativa] = useState({
    clienteId: "",
    data: new Date(),
    motivo: "",
    observacoes: "",
  })
  const [modoMultiplo, setModoMultiplo] = useState(false)
  const [showMultiplasModal, setShowMultiplasModal] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = () => {
    const clientesSalvos = JSON.parse(localStorage.getItem("clientes") || "[]")
    const justificativasSalvas = JSON.parse(localStorage.getItem("justificativas") || "[]")
    const presencasSalvas = JSON.parse(localStorage.getItem("presencas") || "[]")
    setClientes(clientesSalvos)
    setJustificativas(justificativasSalvas)
    setPresencas(presencasSalvas)
  }

  const buscarClientePorCPF = () => {
    if (!cpfBusca.trim()) {
      toast({
        title: "Erro",
        description: "Digite um CPF para buscar",
        variant: "destructive",
      })
      return
    }

    const cliente = clientes.find((c) => c.cpf === cpfBusca.trim())
    if (!cliente) {
      toast({
        title: "Cliente não encontrado",
        description: "Nenhum cliente encontrado com este CPF",
        variant: "destructive",
      })
      setClienteSelecionado(null)
      setDiasFalta([])
      return
    }

    setClienteSelecionado(cliente)
    setNovaJustificativa({
      ...novaJustificativa,
      clienteId: cliente.id,
    })

    // Calcular dias de falta nos últimos 30 dias
    const hoje = new Date()
    const diasFaltaCalculados = []

    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      // Verificar se é dia útil (segunda a sexta)
      if (data.getDay() >= 1 && data.getDay() <= 5) {
        // Verificar se não tem presença neste dia
        const temPresenca = presencas.some((p) => p.clienteId === cliente.id && p.data === dataStr)
        // Verificar se não tem justificativa neste dia
        const temJustificativa = justificativas.some((j) => j.clienteId === cliente.id && j.data === dataStr)

        if (!temPresenca && !temJustificativa) {
          diasFaltaCalculados.push({
            data: data,
            dataFormatada: format(data, "dd/MM/yyyy"),
          })
        }
      }
    }

    setDiasFalta(diasFaltaCalculados)
  }

  const adicionarJustificativa = () => {
    if (!novaJustificativa.clienteId || !novaJustificativa.motivo) {
      toast({
        title: "Erro",
        description: "Cliente e motivo são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const cliente = clientes.find((c) => c.id === novaJustificativa.clienteId)
    const dataStr = format(novaJustificativa.data, "yyyy-MM-dd")

    // Verificar se já existe justificativa para esta data
    const jaExiste = justificativas.some((j) => j.clienteId === novaJustificativa.clienteId && j.data === dataStr)

    if (jaExiste) {
      toast({
        title: "Erro",
        description: "Já existe uma justificativa para este cliente nesta data.",
        variant: "destructive",
      })
      return
    }

    const justificativa = {
      id: Date.now().toString(),
      clienteId: novaJustificativa.clienteId,
      clienteNome: cliente?.nome,
      data: dataStr,
      motivo: novaJustificativa.motivo,
      observacoes: novaJustificativa.observacoes,
      timestamp: new Date().toISOString(),
    }

    const justificativasAtualizadas = [...justificativas, justificativa]
    localStorage.setItem("justificativas", JSON.stringify(justificativasAtualizadas))
    setJustificativas(justificativasAtualizadas)

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Justificativa de Falta",
      detalhes: `Falta justificada para ${cliente?.nome} em ${format(novaJustificativa.data, "dd/MM/yyyy")}`,
      timestamp: new Date().toISOString(),
      usuario: "Gestor de Frequência",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Sucesso",
      description: "Justificativa registrada com sucesso!",
    })

    // Atualizar dias de falta
    setDiasFalta(diasFalta.filter((dia) => format(dia.data, "yyyy-MM-dd") !== dataStr))

    setNovaJustificativa({
      clienteId: clienteSelecionado ? clienteSelecionado.id : "",
      data: new Date(),
      motivo: "",
      observacoes: "",
    })
  }

  const motivosComuns = [
    "Atestado médico",
    "Compromisso familiar",
    "Viagem",
    "Problema de saúde",
    "Compromisso profissional",
    "Outros",
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Justificativas de Faltas</h2>
        <p className="text-gray-600">Gerencie as justificativas de ausência dos clientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Cliente por CPF</CardTitle>
          <CardDescription>Digite o CPF do cliente para registrar uma justificativa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Digite o CPF do cliente..."
                value={cpfBusca}
                onChange={(e) => setCpfBusca(e.target.value)}
              />
            </div>
            <Button onClick={buscarClientePorCPF}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {clienteSelecionado && (
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium text-lg">{clienteSelecionado.nome}</h3>
              <p className="text-sm text-gray-600">CPF: {clienteSelecionado.cpf}</p>
              <p className="text-sm text-gray-600">Horário: {clienteSelecionado.horario}</p>

              {diasFalta.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-medium">Dias de falta nos últimos 30 dias:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {diasFalta.map((dia) => (
                      <Badge key={dia.dataFormatada} variant="outline" className="bg-red-50">
                        {dia.dataFormatada}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-green-600">Nenhuma falta não justificada nos últimos 30 dias.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {clienteSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Justificativa</CardTitle>
            <CardDescription>Registre uma justificativa de falta para {clienteSelecionado.nome}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data da Falta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(novaJustificativa.data, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={novaJustificativa.data}
                    onSelect={(date) => date && setNovaJustificativa({ ...novaJustificativa, data: date })}
                    initialFocus
                    disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Falta</Label>
              <Select
                value={novaJustificativa.motivo}
                onValueChange={(value) => setNovaJustificativa({ ...novaJustificativa, motivo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {motivosComuns.map((motivo) => (
                    <SelectItem key={motivo} value={motivo}>
                      {motivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Detalhes adicionais sobre a justificativa"
                value={novaJustificativa.observacoes}
                onChange={(e) => setNovaJustificativa({ ...novaJustificativa, observacoes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={adicionarJustificativa} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Registrar Justificativa
              </Button>
              <Button variant="outline" onClick={() => setShowMultiplasModal(true)} disabled={!clienteSelecionado}>
                Múltiplas Faltas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Justificativas Registradas</CardTitle>
          <CardDescription>Lista de todas as justificativas de faltas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {justificativas
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((justificativa) => (
                <div key={justificativa.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h3 className="font-medium">{justificativa.clienteNome}</h3>
                      <Badge variant="outline">{format(new Date(justificativa.data), "dd/MM/yyyy")}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Motivo:</strong> {justificativa.motivo}
                    </p>
                    {justificativa.observacoes && (
                      <p className="text-sm text-gray-600">
                        <strong>Observações:</strong> {justificativa.observacoes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Registrado em {format(new Date(justificativa.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            {justificativas.length === 0 && (
              <div className="text-center py-8 text-gray-500">Nenhuma justificativa registrada ainda.</div>
            )}
          </div>
        </CardContent>
      </Card>
      <JustificativasMultiplasModal
        open={showMultiplasModal}
        onOpenChange={setShowMultiplasModal}
        aluno={clienteSelecionado}
        onSuccess={carregarDados}
      />
    </div>
  )
}

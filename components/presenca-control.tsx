"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function PresencaControl() {
  const { toast } = useToast()
  const [clientes, setClientes] = useState([])
  const [presencas, setPresencas] = useState([])
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroHorario, setFiltroHorario] = useState("Todos os horários")
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [clientesFiltrados, setClientesFiltrados] = useState([])
  const [processandoPresenca, setProcessandoPresenca] = useState<string | null>(null)

  const horarios = [
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
    "21:00 - 22:00",
  ]

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    filtrarClientes()
  }, [clientes, filtroNome, filtroHorario])

  const carregarDados = () => {
    const clientesSalvos = JSON.parse(localStorage.getItem("clientes") || "[]")
    const presencasSalvas = JSON.parse(localStorage.getItem("presencas") || "[]")
    setClientes(clientesSalvos)
    setPresencas(presencasSalvas)
  }

  const filtrarClientes = () => {
    let filtrados = clientes.filter((cliente: any) => {
      const matchNome = cliente.nome.toLowerCase().includes(filtroNome.toLowerCase())
      const matchHorario = filtroHorario === "Todos os horários" || cliente.horario === filtroHorario
      return matchNome && matchHorario
    })

    // Adicionar informação de presença para a data selecionada
    const dataStr = format(dataSelecionada, "yyyy-MM-dd")
    filtrados = filtrados.map((cliente: any) => {
      const presencaHoje = presencas.find((p: any) => p.clienteId === cliente.id && p.data === dataStr)
      return {
        ...cliente,
        presenteHoje: !!presencaHoje,
        horarioPresenca: presencaHoje?.horario,
      }
    })

    setClientesFiltrados(filtrados)
  }

  const marcarPresenca = async (cliente: any) => {
    if (processandoPresenca === cliente.id) return // Evitar duplo clique

    setProcessandoPresenca(cliente.id)

    try {
      const dataStr = format(dataSelecionada, "yyyy-MM-dd")

      // Check if client already has attendance for this date - STRICT ENFORCEMENT
      const presencaExistente = presencas.find((p: any) => p.clienteId === cliente.id && p.data === dataStr)

      if (presencaExistente) {
        toast({
          title: "Presença já registrada",
          description: "Este cliente já possui presença registrada para esta data.",
          variant: "destructive",
        })
        return
      }

      const agora = new Date()
      const horarioAtual = format(agora, "HH:mm")

      // Verificar se cliente está inativo
      const faltasConsecutivas = calcularFaltasConsecutivas(cliente.id)
      if (faltasConsecutivas >= 7) {
        toast({
          title: "Cliente Inativo",
          description: "Este cliente possui 7 faltas consecutivas e está inativo.",
          variant: "destructive",
        })
        return
      }

      // Verificar atestado
      if (cliente.dataAtestado) {
        const dataAtestado = new Date(cliente.dataAtestado)
        const dataVencimento = new Date(dataAtestado)
        dataVencimento.setMonth(dataVencimento.getMonth() + 6)

        if (new Date() > dataVencimento) {
          toast({
            title: "Atestado Vencido",
            description: "O atestado médico deste cliente está vencido.",
            variant: "destructive",
          })
          return
        }
      }

      const novaPresenca = {
        id: Date.now().toString(),
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        data: dataStr,
        horario: horarioAtual,
        horarioTreino: cliente.horario,
        timestamp: agora.toISOString(),
      }

      const presencasAtualizadas = [...presencas, novaPresenca]
      localStorage.setItem("presencas", JSON.stringify(presencasAtualizadas))
      setPresencas(presencasAtualizadas)

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Registro de Presença",
        detalhes: `${cliente.nome} fez check-in às ${horarioAtual}`,
        timestamp: agora.toISOString(),
        usuario: "Gestor de Frequência",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Presença Registrada",
        description: `Check-in de ${cliente.nome} realizado com sucesso!`,
      })

      filtrarClientes()
    } finally {
      setProcessandoPresenca(null)
    }
  }

  const calcularFaltasConsecutivas = (clienteId: string) => {
    const presencasCliente = presencas.filter((p: any) => p.clienteId === clienteId)
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
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

  const removerPresenca = (cliente: any) => {
    const dataStr = format(dataSelecionada, "yyyy-MM-dd")
    const presencasAtualizadas = presencas.filter((p: any) => !(p.clienteId === cliente.id && p.data === dataStr))

    localStorage.setItem("presencas", JSON.stringify(presencasAtualizadas))
    setPresencas(presencasAtualizadas)

    toast({
      title: "Presença Removida",
      description: `Check-in de ${cliente.nome} foi removido.`,
    })

    filtrarClientes()
  }

  const getPresencasHoje = () => {
    const dataStr = format(dataSelecionada, "yyyy-MM-dd")
    return presencas.filter((p: any) => p.data === dataStr)
  }

  const getPresencasPorHorario = () => {
    const presencasHoje = getPresencasHoje()
    const porHorario: { [key: string]: number } = {}

    horarios.forEach((horario) => {
      porHorario[horario] = presencasHoje.filter((p: any) => p.horarioTreino === horario).length
    })

    return porHorario
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Controle de Presença</h2>
        <p className="text-gray-600">Registre a presença dos clientes na academia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Registro de Presença</CardTitle>
            <CardDescription>
              Marque a presença dos clientes para {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar cliente por nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filtroHorario} onValueChange={setFiltroHorario}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos os horários">Todos os horários</SelectItem>
                  {horarios.map((horario) => (
                    <SelectItem key={horario} value={horario}>
                      {horario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {clientesFiltrados.map((cliente: any) => (
                <div key={cliente.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{cliente.nome}</h3>
                    <p className="text-sm text-gray-600">
                      Horário: {cliente.horario} | CPF: {cliente.cpf}
                    </p>
                    {cliente.presenteHoje && (
                      <p className="text-sm text-green-600">Check-in realizado às {cliente.horarioPresenca}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {cliente.presenteHoje ? (
                      <>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Presente
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => removerPresenca(cliente)}>
                          Remover
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => marcarPresenca(cliente)}
                        disabled={processandoPresenca === cliente.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {processandoPresenca === cliente.id ? "Processando..." : "Marcar Presença"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {clientesFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">Nenhum cliente encontrado com os filtros aplicados.</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecionar Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataSelecionada, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={(date) => date && setDataSelecionada(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total de Presenças:</span>
                <Badge variant="outline">{getPresencasHoje().length}</Badge>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Por Horário:</h4>
                {Object.entries(getPresencasPorHorario()).map(
                  ([horario, count]) =>
                    count > 0 && (
                      <div key={horario} className="flex justify-between items-center text-sm">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {horario}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

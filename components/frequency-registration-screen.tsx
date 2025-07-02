"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, User, Clock, Calendar, FileText } from "lucide-react"
import { format, addMonths, differenceInDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import JustificativasMultiplas from "@/components/justificativas-multiplas"

export default function FrequencyRegistrationScreen() {
  const { toast } = useToast()
  const [cpf, setCpf] = useState("")
  const [cliente, setCliente] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [jaRegistrouHoje, setJaRegistrouHoje] = useState(false)
  const [statusAtestado, setStatusAtestado] = useState<any>(null)
  const [clienteInativo, setClienteInativo] = useState(false)
  const [mostrarJustificativas, setMostrarJustificativas] = useState(false)

  const buscarCliente = async () => {
    if (!cpf.trim()) {
      toast({
        title: "Erro",
        description: "Digite um CPF válido.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
      const clienteEncontrado = clientes.find((c: any) => c.cpf === cpf.trim())

      if (!clienteEncontrado) {
        toast({
          title: "Cliente não encontrado",
          description: "CPF não cadastrado no sistema.",
          variant: "destructive",
        })
        setCliente(null)
        return
      }

      // Verificar se já registrou presença hoje
      const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
      const hoje = format(new Date(), "yyyy-MM-dd")
      const presencaHoje = presencas.find((p: any) => p.clienteId === clienteEncontrado.id && p.data === hoje)

      setJaRegistrouHoje(!!presencaHoje)

      // Verificar status do atestado
      let statusAtestadoInfo = null
      if (clienteEncontrado.dataAtestado) {
        const dataAtestado = new Date(clienteEncontrado.dataAtestado)
        const dataVencimento = addMonths(dataAtestado, 6)
        const diasParaVencer = differenceInDays(dataVencimento, new Date())

        statusAtestadoInfo = {
          dataEmissao: dataAtestado,
          dataVencimento,
          diasParaVencer,
          vencido: diasParaVencer < 0,
          proximoVencimento: diasParaVencer <= 30 && diasParaVencer > 0,
        }
      }

      // Verificar se cliente está inativo (7 faltas consecutivas)
      const faltasConsecutivas = calcularFaltasConsecutivas(clienteEncontrado.id)
      setClienteInativo(faltasConsecutivas >= 7)

      setCliente(clienteEncontrado)
      setStatusAtestado(statusAtestadoInfo)
    } finally {
      setLoading(false)
    }
  }

  const calcularFaltasConsecutivas = (clienteId: string) => {
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")

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

  const registrarPresenca = async () => {
    if (!cliente) return

    try {
      const hoje = format(new Date(), "yyyy-MM-dd")
      const agora = new Date()
      const horarioAtual = format(agora, "HH:mm")

      const novaPresenca = {
        id: Date.now().toString(),
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        data: hoje,
        horario: horarioAtual,
        horarioTreino: cliente.horario,
        timestamp: agora.toISOString(),
      }

      const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
      const presencasAtualizadas = [...presencas, novaPresenca]
      localStorage.setItem("presencas", JSON.stringify(presencasAtualizadas))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Registro de Presença",
        detalhes: `${cliente.nome} registrou presença às ${horarioAtual}`,
        timestamp: agora.toISOString(),
        usuario: "Frequency Manager",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Presença Registrada",
        description: `Presença de ${cliente.nome} registrada com sucesso!`,
      })

      setJaRegistrouHoje(true)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar presença. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const limparBusca = () => {
    setCpf("")
    setCliente(null)
    setJaRegistrouHoje(false)
    setStatusAtestado(null)
    setClienteInativo(false)
  }

  const podeRegistrarPresenca = () => {
    return cliente && !jaRegistrouHoje && !clienteInativo && !statusAtestado?.vencido
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Frequência</h2>
        <p className="text-gray-600">Digite o CPF do cliente para registrar a presença</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Cliente</CardTitle>
          <CardDescription>Digite o CPF para localizar o cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cpf">CPF do Cliente</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && buscarCliente()}
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={buscarCliente} disabled={loading}>
                {loading ? "Buscando..." : "Buscar"}
              </Button>
              <Button variant="outline" onClick={limparBusca}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setMostrarJustificativas(!mostrarJustificativas)}>
          <FileText className="h-4 w-4 mr-2" />
          {mostrarJustificativas ? "Voltar ao Registro" : "Justificar Múltiplas Faltas"}
        </Button>
      </div>

      {mostrarJustificativas ? (
        <JustificativasMultiplas />
      ) : (
        <div className="space-y-6">
          {/* Alertas */}
          {clienteInativo && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Cliente Inativo:</strong> Este cliente possui 7 faltas consecutivas não justificadas e não pode
                registrar presença.
              </AlertDescription>
            </Alert>
          )}

          {statusAtestado?.vencido && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atestado Vencido:</strong> O atestado médico venceu em{" "}
                {format(statusAtestado.dataVencimento, "dd/MM/yyyy")}. Renovação necessária.
              </AlertDescription>
            </Alert>
          )}

          {statusAtestado?.proximoVencimento && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Atestado próximo do vencimento:</strong> O atestado vence em {statusAtestado.diasParaVencer}{" "}
                dias ({format(statusAtestado.dataVencimento, "dd/MM/yyyy")}).
              </AlertDescription>
            </Alert>
          )}

          {jaRegistrouHoje && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Presença já registrada:</strong> Este cliente já registrou presença hoje.
              </AlertDescription>
            </Alert>
          )}

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações do Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome Completo</p>
                  <p className="font-medium text-lg">{cliente.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPF</p>
                  <p className="font-medium">{cliente.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horário de Treino</p>
                  <Badge variant="outline" className="text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {cliente.horario}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={clienteInativo ? "destructive" : "default"}>
                    {clienteInativo ? "Inativo" : "Ativo"}
                  </Badge>
                </div>
              </div>

              {statusAtestado && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Atestado Médico
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700">Emissão:</span> {format(statusAtestado.dataEmissao, "dd/MM/yyyy")}
                    </div>
                    <div>
                      <span className="text-blue-700">Vencimento:</span>{" "}
                      {format(statusAtestado.dataVencimento, "dd/MM/yyyy")}
                    </div>
                    <div>
                      <span className="text-blue-700">Status:</span>
                      <Badge
                        variant={
                          statusAtestado.vencido
                            ? "destructive"
                            : statusAtestado.proximoVencimento
                              ? "secondary"
                              : "default"
                        }
                        className="ml-2"
                      >
                        {statusAtestado.vencido
                          ? "Vencido"
                          : statusAtestado.proximoVencimento
                            ? "Próximo do vencimento"
                            : "Válido"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de Registro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Registro de Presença</span>
              </CardTitle>
              <CardDescription>
                Data: {format(new Date(), "dd/MM/yyyy")} - Horário: {format(new Date(), "HH:mm")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={registrarPresenca}
                disabled={!podeRegistrarPresenca()}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {jaRegistrouHoje ? "Presença Já Registrada" : "Registrar Presença"}
              </Button>

              {!podeRegistrarPresenca() && !jaRegistrouHoje && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  {clienteInativo
                    ? "Cliente inativo - não é possível registrar presença"
                    : statusAtestado?.vencido
                      ? "Atestado vencido - renovação necessária"
                      : "Não é possível registrar presença"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

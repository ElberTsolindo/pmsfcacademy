"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, FileText, AlertTriangle } from "lucide-react"
import { format, differenceInDays, addMonths } from "date-fns"

interface ClientDetailScreenProps {
  clienteId: string
  onBack: () => void
}

export default function ClientDetailScreen({ clienteId, onBack }: ClientDetailScreenProps) {
  const [cliente, setCliente] = useState<any>(null)
  const [presencas, setPresencas] = useState([])
  const [justificativas, setJustificativas] = useState([])
  const [statusAtestado, setStatusAtestado] = useState<any>(null)
  const [faltasConsecutivas, setFaltasConsecutivas] = useState(0)

  useEffect(() => {
    carregarDadosCliente()
  }, [clienteId])

  const carregarDadosCliente = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const clienteEncontrado = clientes.find((c: any) => c.id === clienteId)

    if (!clienteEncontrado) return

    const presencasSalvas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativasSalvas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    const presencasCliente = presencasSalvas.filter((p: any) => p.clienteId === clienteId)
    const justificativasCliente = justificativasSalvas.filter((j: any) => j.clienteId === clienteId)

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

    // Calcular faltas consecutivas
    const faltas = calcularFaltasConsecutivas(clienteId, presencasCliente, justificativasCliente)

    setCliente(clienteEncontrado)
    setPresencas(presencasCliente)
    setJustificativas(justificativasCliente)
    setStatusAtestado(statusAtestadoInfo)
    setFaltasConsecutivas(faltas)
  }

  const calcularFaltasConsecutivas = (clienteId: string, presencas: any[], justificativas: any[]) => {
    let consecutivas = 0
    const hoje = new Date()

    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      const temPresenca = presencas.some((p: any) => p.data === dataStr)
      const temJustificativa = justificativas.some((j: any) => j.data === dataStr)

      if (!temPresenca && !temJustificativa && data.getDay() >= 1 && data.getDay() <= 5) {
        consecutivas++
      } else if (temPresenca || temJustificativa) {
        break
      }
    }

    return consecutivas
  }

  if (!cliente) {
    return <div>Cliente não encontrado</div>
  }

  const clienteInativo = faltasConsecutivas >= 7

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Detalhes do Cliente</h2>
          <p className="text-gray-600">Informações completas e histórico</p>
        </div>
      </div>

      {/* Alertas */}
      {clienteInativo && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Cliente Inativo:</strong> {faltasConsecutivas} faltas consecutivas não justificadas.
          </AlertDescription>
        </Alert>
      )}

      {statusAtestado?.vencido && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atestado Vencido:</strong> Venceu em {format(statusAtestado.dataVencimento, "dd/MM/yyyy")}.
          </AlertDescription>
        </Alert>
      )}

      {statusAtestado?.proximoVencimento && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Atestado próximo do vencimento:</strong> Vence em {statusAtestado.diasParaVencer} dias.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informações Pessoais</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nome Completo</p>
              <p className="font-medium">{cliente.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CPF</p>
              <p className="font-medium">{cliente.cpf}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RG</p>
              <p className="font-medium">{cliente.rg}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horário de Treino</p>
              <Badge variant="outline">{cliente.horario}</Badge>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Endereço</p>
              <p className="font-medium">{cliente.endereco}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data de Cadastro</p>
              <p className="font-medium">{format(new Date(cliente.dataCadastro), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={clienteInativo ? "destructive" : "default"}>{clienteInativo ? "Inativo" : "Ativo"}</Badge>
            </div>
          </div>

          {cliente.observacoes && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Observações</p>
              <p className="font-medium">{cliente.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Presenças</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presencas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltas Consecutivas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${faltasConsecutivas >= 7 ? "text-red-600" : faltasConsecutivas >= 5 ? "text-orange-600" : "text-green-600"}`}
            >
              {faltasConsecutivas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Justificativas</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{justificativas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência Mensal</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(
                (presencas.filter((p) => {
                  const dataPresenca = new Date(p.data)
                  const agora = new Date()
                  return (
                    dataPresenca.getMonth() === agora.getMonth() && dataPresenca.getFullYear() === agora.getFullYear()
                  )
                }).length /
                  30) *
                  100,
              )}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atestado Médico */}
      {statusAtestado && (
        <Card>
          <CardHeader>
            <CardTitle>Atestado Médico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Data de Emissão</p>
                <p className="font-medium">{format(statusAtestado.dataEmissao, "dd/MM/yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data de Vencimento</p>
                <p className="font-medium">{format(statusAtestado.dataVencimento, "dd/MM/yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge
                  variant={
                    statusAtestado.vencido ? "destructive" : statusAtestado.proximoVencimento ? "secondary" : "default"
                  }
                >
                  {statusAtestado.vencido
                    ? "Vencido"
                    : statusAtestado.proximoVencimento
                      ? "Próximo do vencimento"
                      : "Válido"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Presenças */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Presenças</CardTitle>
            <CardDescription>Histórico de check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {presencas
                .slice(-10)
                .reverse()
                .map((presenca: any) => (
                  <div key={presenca.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(presenca.data), "dd/MM/yyyy")}</p>
                      <p className="text-sm text-gray-600">Check-in: {presenca.horario}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              {presencas.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma presença registrada.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Justificativas</CardTitle>
            <CardDescription>Faltas justificadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {justificativas
                .slice(-10)
                .reverse()
                .map((justificativa: any) => (
                  <div key={justificativa.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(justificativa.data), "dd/MM/yyyy")}</p>
                      <p className="text-sm text-gray-600">{justificativa.motivo}</p>
                      {justificativa.observacoes && (
                        <p className="text-xs text-gray-500">{justificativa.observacoes}</p>
                      )}
                    </div>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                ))}
              {justificativas.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma justificativa registrada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

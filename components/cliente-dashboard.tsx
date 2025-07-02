"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react"
import { format, differenceInDays, addMonths } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

// Rename component and update references
export default function AlunoDashboard({ alunoId, onLogout }: { alunoId: string; onLogout: () => void }) {
  const { toast } = useToast()
  const [aluno, setAluno] = useState<any>(null)
  const [presencas, setPresencas] = useState([])
  const [faltas, setFaltas] = useState([])
  const [justificativas, setJustificativas] = useState([])
  const [statusAtestado, setStatusAtestado] = useState<any>(null)

  useEffect(() => {
    carregarDadosAluno()
  }, [alunoId])

  const carregarDadosAluno = () => {
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const alunoEncontrado = alunos.find((c: any) => c.id === alunoId)

    if (!alunoEncontrado) return

    const presencasSalvas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativasSalvas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    const presencasAluno = presencasSalvas.filter((p: any) => p.alunoId === alunoId)
    const justificativasAluno = justificativasSalvas.filter((j: any) => j.alunoId === alunoId)

    // Calcular faltas reais baseadas nos últimos 30 dias úteis
    const faltasReais = []
    const hoje = new Date()

    for (let i = 1; i <= 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      // Verificar se é dia útil
      if (data.getDay() >= 1 && data.getDay() <= 5) {
        const temPresenca = presencasAluno.some((p: any) => p.data === dataStr)
        const temJustificativa = justificativasAluno.some((j: any) => j.data === dataStr)

        if (!temPresenca && !temJustificativa) {
          faltasReais.push({
            data: dataStr,
            justificada: false,
          })
        }
      }
    }

    // Verificar status do atestado
    let statusAtestadoInfo = null
    if (alunoEncontrado.dataAtestado) {
      const dataAtestado = new Date(alunoEncontrado.dataAtestado)
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

    setAluno(alunoEncontrado)
    setPresencas(presencasAluno)
    setFaltas(faltasReais)
    setJustificativas(justificativasAluno)
    setStatusAtestado(statusAtestadoInfo)
  }

  const getFaltasConsecutivas = () => {
    let consecutivas = 0
    const hoje = new Date()

    for (let i = 1; i <= 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      // Verificar se é dia útil (segunda a sexta)
      if (data.getDay() >= 1 && data.getDay() <= 5) {
        const temPresenca = presencas.some((p: any) => p.data === dataStr)
        const temJustificativa = justificativas.some((j: any) => j.data === dataStr)

        if (!temPresenca && !temJustificativa) {
          consecutivas++
        } else {
          break // Para ao encontrar uma presença ou justificativa
        }
      }
    }

    return consecutivas
  }

  const faltasConsecutivas = getFaltasConsecutivas()
  const alunoInativo = faltasConsecutivas >= 7

  if (!aluno) {
    return <div>Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Meu Perfil - Academia Pública</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {aluno?.nome}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Alertas */}
          {alunoInativo && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Conta Inativa:</strong> Você atingiu 7 faltas consecutivas não justificadas. Entre em contato
                com a administração para regularizar sua situação.
              </AlertDescription>
            </Alert>
          )}

          {statusAtestado?.vencido && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atestado Vencido:</strong> Seu atestado médico venceu em{" "}
                {format(statusAtestado.dataVencimento, "dd/MM/yyyy")}. Renovação necessária.
              </AlertDescription>
            </Alert>
          )}

          {statusAtestado?.proximoVencimento && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Atestado próximo do vencimento:</strong> Seu atestado vence em {statusAtestado.diasParaVencer}{" "}
                dias ({format(statusAtestado.dataVencimento, "dd/MM/yyyy")}).
              </AlertDescription>
            </Alert>
          )}

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome Completo</p>
                  <p className="font-medium">{aluno.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPF</p>
                  <p className="font-medium">{aluno.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">RG</p>
                  <p className="font-medium">{aluno.rg}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horário de Treino</p>
                  <Badge variant="outline">{aluno.horario}</Badge>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{aluno.endereco}</p>
                </div>
              </div>
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
                <CardTitle className="text-sm font-medium">Total de Faltas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{faltas.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faltas Consecutivas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
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
                        statusAtestado.vencido
                          ? "destructive"
                          : statusAtestado.proximoVencimento
                            ? "secondary"
                            : "default"
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

          {/* Últimas Presenças */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Presenças</CardTitle>
                <CardDescription>Seus últimos check-ins na academia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  {presencas.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Nenhuma presença registrada ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Justificativas de Faltas</CardTitle>
                <CardDescription>Suas justificativas registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {justificativas
                    .slice(-10)
                    .reverse()
                    .map((justificativa: any) => (
                      <div key={justificativa.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{format(new Date(justificativa.data), "dd/MM/yyyy")}</p>
                          <p className="text-sm text-gray-600">{justificativa.motivo}</p>
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
      </div>
    </div>
  )
}

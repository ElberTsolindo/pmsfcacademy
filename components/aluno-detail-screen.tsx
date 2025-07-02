"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addMonths, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Calendar, Clock, FileText, Phone, User, Users, AlertTriangle, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AlunoDetailScreenProps {
  alunoId: string
  onBack: () => void
}

export default function AlunoDetailScreen({ alunoId, onBack }: AlunoDetailScreenProps) {
  const [aluno, setAluno] = useState<any>(null)
  const [presencas, setPresencas] = useState<any[]>([])
  const [justificativas, setJustificativas] = useState<any[]>([])
  const [statusAtestado, setStatusAtestado] = useState<any>(null)
  const [faltasConsecutivas, setFaltasConsecutivas] = useState(0)

  useEffect(() => {
    carregarDados()
  }, [alunoId])

  const carregarDados = () => {
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const alunoEncontrado = alunos.find((c: any) => c.id === alunoId)

    if (alunoEncontrado) {
      setAluno(alunoEncontrado)

      // Carregar presenças
      const todasPresencas = JSON.parse(localStorage.getItem("presencas") || "[]")
      const presencasAluno = todasPresencas.filter((p: any) => p.alunoId === alunoId)
      setPresencas(presencasAluno)

      // Carregar justificativas
      const todasJustificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
      const justificativasAluno = todasJustificativas.filter((j: any) => j.alunoId === alunoId)
      setJustificativas(justificativasAluno)

      // Verificar status do atestado
      if (alunoEncontrado.dataAtestado) {
        const dataAtestado = new Date(alunoEncontrado.dataAtestado)
        const dataVencimento = addMonths(dataAtestado, 6)
        const diasParaVencer = differenceInDays(dataVencimento, new Date())

        setStatusAtestado({
          dataEmissao: dataAtestado,
          dataVencimento,
          diasParaVencer,
          vencido: diasParaVencer < 0,
          proximoVencimento: diasParaVencer <= 30 && diasParaVencer > 0,
        })
      }

      // Calcular faltas consecutivas
      const faltas = calcularFaltasConsecutivas(alunoId)
      setFaltasConsecutivas(faltas)
    }
  }

  const calcularFaltasConsecutivas = (alunoId: string) => {
    const todasPresencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const presencasAluno = todasPresencas.filter((p: any) => p.alunoId === alunoId)

    const todasJustificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
    const justificativasAluno = todasJustificativas.filter((j: any) => j.alunoId === alunoId)

    let consecutivas = 0
    const hoje = new Date()

    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      const temPresenca = presencasAluno.some((p: any) => p.data === dataStr)
      const temJustificativa = justificativasAluno.some((j: any) => j.data === dataStr)

      if (!temPresenca && !temJustificativa && data.getDay() >= 1 && data.getDay() <= 5) {
        consecutivas++
      } else if (temPresenca || temJustificativa) {
        break
      }
    }

    return consecutivas
  }

  const formatarTelefone = (telefone: string) => {
    if (!telefone) return "-"

    const apenasNumeros = telefone.replace(/\D/g, "")
    if (apenasNumeros.length !== 11) return telefone

    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7)}`
  }

  const renovarAtestado = () => {
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const alunoIndex = alunos.findIndex((c: any) => c.id === aluno.id)

    if (alunoIndex !== -1) {
      alunos[alunoIndex].dataAtestado = format(new Date(), "yyyy-MM-dd")
      localStorage.setItem("alunos", JSON.stringify(alunos))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Renovação de Atestado",
        detalhes: `Atestado de ${aluno.nome} renovado`,
        timestamp: new Date().toISOString(),
        usuario: "Admin",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Atestado Renovado",
        description: `Atestado de ${aluno.nome} renovado com sucesso!`,
      })

      carregarDados()
    }
  }

  if (!aluno) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p>Aluno não encontrado.</p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Detalhes do Aluno</h2>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {aluno.nome}
            </CardTitle>
            <Badge variant={faltasConsecutivas >= 7 ? "destructive" : "outline"}>
              {faltasConsecutivas >= 7 ? "Inativo" : "Ativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="presencas">Presenças</TabsTrigger>
              <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CPF</h3>
                  <p>{aluno.cpf}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">RG</h3>
                  <p>{aluno.rg}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contato</h3>
                  <p className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {formatarTelefone(aluno.contato)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contato de Emergência</h3>
                  <p className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {formatarTelefone(aluno.contatoEmergencia)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome do Pai</h3>
                  <p>{aluno.nomePai || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome da Mãe</h3>
                  <p>{aluno.nomeMae || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
                  <p>{aluno.endereco}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Horário de Treino</h3>
                  <p className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {aluno.horario}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Cadastro</h3>
                  <p>{format(new Date(aluno.dataCadastro), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Faltas Consecutivas</h3>
                  <p>
                    {faltasConsecutivas} {faltasConsecutivas === 1 ? "dia" : "dias"}
                  </p>
                </div>
              </div>

              {aluno.menorDe18 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Informações do Responsável Legal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Nome</h4>
                      <p>{aluno.responsavelLegal || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Parentesco</h4>
                      <p>{aluno.parentesco || "-"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Contato</h4>
                      <p>{formatarTelefone(aluno.contatoResponsavel) || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {aluno.usaMedicamento && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <h3 className="font-medium text-amber-900 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Uso de Medicamento
                  </h3>
                  <p className="text-amber-800 whitespace-pre-wrap">{aluno.qualMedicamento || "-"}</p>
                </div>
              )}

              {aluno.possuiDoenca && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Condição de Saúde
                  </h3>
                  <p className="text-red-800 whitespace-pre-wrap">{aluno.qualDoenca || "-"}</p>
                </div>
              )}

              {statusAtestado && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Atestado Médico
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => renovarAtestado()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renovar Atestado
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Data de Emissão</h4>
                      <p>{format(statusAtestado.dataEmissao, "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Data de Vencimento</h4>
                      <p>{format(statusAtestado.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Status</h4>
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
                  {statusAtestado.vencido && (
                    <div className="mt-2 flex items-start text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-1 mt-0.5" />
                      <p className="text-sm">
                        O atestado está vencido há {Math.abs(statusAtestado.diasParaVencer)} dias. É necessário
                        apresentar um novo atestado.
                      </p>
                    </div>
                  )}
                  {statusAtestado.proximoVencimento && (
                    <div className="mt-2 flex items-start text-amber-600">
                      <AlertTriangle className="h-4 w-4 mr-1 mt-0.5" />
                      <p className="text-sm">
                        O atestado vencerá em {statusAtestado.diasParaVencer} dias. Recomenda-se providenciar um novo
                        atestado.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {aluno.observacoes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{aluno.observacoes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="presencas">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Histórico de Presenças</h3>
                  <Badge variant="outline">{presencas.length} registros</Badge>
                </div>

                {presencas.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horário de Check-in
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horário de Treino
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {presencas
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((presenca) => (
                            <tr key={presenca.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(presenca.data), "dd/MM/yyyy", { locale: ptBR })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{presenca.horario}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {presenca.horarioTreino}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border rounded-md">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Nenhum registro de presença encontrado.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="justificativas">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Justificativas de Faltas</h3>
                  <Badge variant="outline">{justificativas.length} registros</Badge>
                </div>

                {justificativas.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {justificativas
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((justificativa) => (
                            <tr key={justificativa.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(justificativa.data), "dd/MM/yyyy", { locale: ptBR })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {justificativa.motivo}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{justificativa.observacoes || "-"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border rounded-md">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Nenhuma justificativa de falta registrada.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

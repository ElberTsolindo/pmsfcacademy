"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Clock, Calendar } from "lucide-react"
import { format, addMonths, differenceInDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function GestorFrequenciaScreen() {
  const { toast } = useToast()
  const [horarioSelecionado, setHorarioSelecionado] = useState("")
  const [horarios, setHorarios] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])
  const [alunosFiltrados, setAlunosFiltrados] = useState<any[]>([])
  const [presencas, setPresencas] = useState<{ [key: string]: boolean }>({})
  const [faltas, setFaltas] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [dataAtual] = useState(new Date())

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (horarioSelecionado) {
      filtrarAlunosPorHorario()
    } else {
      setAlunosFiltrados([])
    }
  }, [horarioSelecionado, alunos])

  const carregarDados = () => {
    const horariosConfig = JSON.parse(localStorage.getItem("horarios") || "[]")
    const alunosCadastrados = JSON.parse(localStorage.getItem("alunos") || "[]")

    setHorarios(horariosConfig.filter((h: any) => h.ativo))
    setAlunos(alunosCadastrados)
  }

  const filtrarAlunosPorHorario = () => {
    const filtrados = alunos.filter((aluno) => aluno.horario === horarioSelecionado)

    // Verificar presenças já registradas hoje
    const dataStr = format(dataAtual, "yyyy-MM-dd")
    const presencasHoje = JSON.parse(localStorage.getItem("presencas") || "[]").filter((p: any) => p.data === dataStr)

    // Inicializar estados de presença/falta
    const presencasIniciais: { [key: string]: boolean } = {}
    const faltasIniciais: { [key: string]: boolean } = {}

    filtrados.forEach((aluno) => {
      const temPresenca = presencasHoje.some((p: any) => p.alunoId === aluno.id)
      presencasIniciais[aluno.id] = temPresenca
      faltasIniciais[aluno.id] = false
    })

    setPresencas(presencasIniciais)
    setFaltas(faltasIniciais)
    setAlunosFiltrados(filtrados)
  }

  const verificarStatusAtestado = (aluno: any) => {
    if (!aluno.dataAtestado) return null

    const dataAtestado = new Date(aluno.dataAtestado)
    const dataVencimento = addMonths(dataAtestado, 6)
    const diasParaVencer = differenceInDays(dataVencimento, new Date())

    return {
      dataEmissao: dataAtestado,
      dataVencimento,
      diasParaVencer,
      vencido: diasParaVencer < 0,
      proximoVencimento: diasParaVencer <= 30 && diasParaVencer > 0,
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

  const handlePresencaChange = (alunoId: string, checked: boolean) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: checked,
    }))

    // Se marcar presença, desmarcar falta
    if (checked) {
      setFaltas((prev) => ({
        ...prev,
        [alunoId]: false,
      }))
    }
  }

  const handleFaltaChange = (alunoId: string, checked: boolean) => {
    setFaltas((prev) => ({
      ...prev,
      [alunoId]: checked,
    }))

    // Se marcar falta, desmarcar presença
    if (checked) {
      setPresencas((prev) => ({
        ...prev,
        [alunoId]: false,
      }))
    }
  }

  const finalizarFrequencia = async () => {
    if (alunosFiltrados.length === 0) {
      toast({
        title: "Erro",
        description: "Não há alunos para registrar frequência neste horário.",
        variant: "destructive",
      })
      return
    }

    // Verificar se todos os alunos têm presença ou falta marcada
    const alunosSemRegistro = alunosFiltrados.filter((aluno) => !presencas[aluno.id] && !faltas[aluno.id])

    if (alunosSemRegistro.length > 0) {
      toast({
        title: "Atenção",
        description: `${alunosSemRegistro.length} aluno(s) sem registro de presença ou falta.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const dataStr = format(dataAtual, "yyyy-MM-dd")
      const horarioAtual = format(new Date(), "HH:mm")
      const todasPresencas = JSON.parse(localStorage.getItem("presencas") || "[]")

      // Remover presenças existentes para estes alunos nesta data
      const presencasFiltradas = todasPresencas.filter(
        (p: any) => !(p.data === dataStr && alunosFiltrados.some((a) => a.id === p.alunoId)),
      )

      // Adicionar novas presenças
      const novasPresencas = []

      for (const aluno of alunosFiltrados) {
        if (presencas[aluno.id]) {
          novasPresencas.push({
            id: Date.now().toString() + aluno.id,
            alunoId: aluno.id,
            alunoNome: aluno.nome,
            data: dataStr,
            horario: horarioAtual,
            horarioTreino: aluno.horario,
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Salvar presenças atualizadas
      const presencasAtualizadas = [...presencasFiltradas, ...novasPresencas]
      localStorage.setItem("presencas", JSON.stringify(presencasAtualizadas))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Registro de Frequência",
        detalhes: `Frequência registrada para ${novasPresencas.length} alunos no horário ${horarioSelecionado}`,
        timestamp: new Date().toISOString(),
        usuario: "Gestor de Frequência",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Sucesso",
        description: `Frequência registrada para ${novasPresencas.length} alunos.`,
      })

      // Limpar seleções
      setHorarioSelecionado("")
      setAlunosFiltrados([])
      setPresencas({})
      setFaltas({})
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar frequência. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Frequência</h2>
        <p className="text-gray-600">Selecione um horário para registrar a frequência dos alunos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Horário</CardTitle>
          <CardDescription>
            Data: {format(dataAtual, "dd/MM/yyyy")} - Selecione o horário para listar os alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Select value={horarioSelecionado} onValueChange={setHorarioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {horarios.map((horario) => (
                    <SelectItem key={horario.horario} value={horario.horario}>
                      {horario.horario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {horarioSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Alunos do Horário: {horarioSelecionado}</span>
            </CardTitle>
            <CardDescription>Total de alunos: {alunosFiltrados.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {alunosFiltrados.length > 0 ? (
              <div className="space-y-6">
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atestado
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Presença
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alunosFiltrados.map((aluno) => {
                        const statusAtestado = verificarStatusAtestado(aluno)
                        const faltasConsecutivas = calcularFaltasConsecutivas(aluno.id)
                        const alunoInativo = faltasConsecutivas >= 7

                        return (
                          <tr key={aluno.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{aluno.nome}</div>
                                  {alunoInativo && (
                                    <Badge variant="destructive" className="mt-1">
                                      Inativo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{aluno.horario}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {statusAtestado ? (
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
                              ) : (
                                <Badge variant="outline">Sem atestado</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex justify-center space-x-8">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`presenca-${aluno.id}`}
                                    checked={presencas[aluno.id] || false}
                                    onCheckedChange={(checked) => handlePresencaChange(aluno.id, checked === true)}
                                    disabled={loading}
                                  />
                                  <Label htmlFor={`presenca-${aluno.id}`} className="text-green-600 font-medium">
                                    SIM
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`falta-${aluno.id}`}
                                    checked={faltas[aluno.id] || false}
                                    onCheckedChange={(checked) => handleFaltaChange(aluno.id, checked === true)}
                                    disabled={loading}
                                  />
                                  <Label htmlFor={`falta-${aluno.id}`} className="text-red-600 font-medium">
                                    NÃO
                                  </Label>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <Button onClick={finalizarFrequencia} disabled={loading} className="w-full">
                  {loading ? "Processando..." : "Finalizar Registro de Frequência"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Nenhum aluno encontrado para este horário.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

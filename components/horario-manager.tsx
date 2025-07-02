"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function HorarioManager() {
  const { toast } = useToast()
  const [horarios, setHorarios] = useState([])
  const [alunos, setAlunos] = useState([])

  // Modificar a lista de horários disponíveis para remover 21:00 - 22:00 e adicionar 05:00 - 06:00
  const horariosDisponiveis = [
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
    // Forçar carregamento após um pequeno delay
    const timer = setTimeout(() => {
      carregarDados()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    // Verificar horários lotados e mostrar notificação
    const horariosLotados = horarios.filter((h: any) => {
      if (!h.ativo) return false
      const ocupacao = getOcupacaoPercentual(h.horario, h.limiteMaximo)
      return ocupacao >= 100
    })

    if (horariosLotados.length > 0) {
      const horariosNomes = horariosLotados.map((h: any) => h.horario).join(", ")
      toast({
        title: "Horários Lotados",
        description: `Os seguintes horários atingiram a capacidade máxima: ${horariosNomes}`,
        variant: "destructive",
      })
    }
  }, [horarios, alunos])

  const carregarDados = () => {
    const horariosConfig = JSON.parse(localStorage.getItem("horarios") || "[]")
    const alunosCadastrados = JSON.parse(localStorage.getItem("alunos") || "[]")

    // Inicializar horários se não existirem
    if (horariosConfig.length === 0) {
      const horariosIniciais = horariosDisponiveis.map((horario) => ({
        id: horario,
        horario,
        ativo: true,
        limiteMaximo: 20,
      }))
      localStorage.setItem("horarios", JSON.stringify(horariosIniciais))
      setHorarios(horariosIniciais)
    } else {
      setHorarios(horariosConfig)
    }

    setAlunos(alunosCadastrados)
  }

  const toggleHorario = (horarioId: string) => {
    const horariosAtualizados = horarios.map((h: any) => (h.id === horarioId ? { ...h, ativo: !h.ativo } : h))

    localStorage.setItem("horarios", JSON.stringify(horariosAtualizados))
    setHorarios(horariosAtualizados)

    const horario = horariosAtualizados.find((h: any) => h.id === horarioId)

    toast({
      title: horario?.ativo ? "Horário Ativado" : "Horário Desativado",
      description: `Horário ${horarioId} foi ${horario?.ativo ? "ativado" : "desativado"}.`,
    })
  }

  const getAlunosNoHorario = (horario: string) => {
    return alunos.filter((a: any) => a.horario === horario)
  }

  const getOcupacaoPercentual = (horario: string, limite: number) => {
    const alunosNoHorario = getAlunosNoHorario(horario)
    return Math.round((alunosNoHorario.length / limite) * 100)
  }

  const getStatusColor = (ocupacao: number) => {
    if (ocupacao >= 100) return "text-red-600"
    if (ocupacao >= 80) return "text-orange-600"
    if (ocupacao >= 60) return "text-yellow-600"
    return "text-green-600"
  }

  const getStatusBadge = (ocupacao: number, ativo: boolean) => {
    if (!ativo) return <Badge variant="secondary">Inativo</Badge>
    if (ocupacao >= 100) return <Badge variant="destructive">Lotado</Badge>
    if (ocupacao >= 80)
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-600">
          Quase Lotado
        </Badge>
      )
    return (
      <Badge variant="outline" className="border-green-500 text-green-600">
        Disponível
      </Badge>
    )
  }

  const isHorarioLotado = (horario: string) => {
    const alunosNoHorario = getAlunosNoHorario(horario)
    return alunosNoHorario.length >= 20
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Horários</h2>
        <p className="text-gray-600">Controle os horários de funcionamento e capacidade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {horarios.map((horario: any) => {
          const alunosNoHorario = getAlunosNoHorario(horario.horario)
          const ocupacao = getOcupacaoPercentual(horario.horario, horario.limiteMaximo)

          return (
            <Card key={horario.id} className={`${!horario.ativo ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{horario.horario}</span>
                  </CardTitle>
                  {getStatusBadge(ocupacao, horario.ativo)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`switch-${horario.id}`} className="text-sm font-medium">
                    Horário Ativo
                  </Label>
                  <Switch
                    id={`switch-${horario.id}`}
                    checked={horario.ativo}
                    onCheckedChange={() => toggleHorario(horario.id)}
                  />
                </div>

                {horario.ativo && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Ocupação</span>
                        </span>
                        <span className={`font-medium ${getStatusColor(ocupacao)}`}>
                          {alunosNoHorario.length}/{horario.limiteMaximo}
                        </span>
                      </div>
                      <Progress value={ocupacao} className="h-2" />
                      <div className="text-xs text-gray-500 text-center">{ocupacao}% da capacidade</div>
                    </div>

                    {ocupacao >= 90 && (
                      <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-700">Horário próximo da capacidade máxima</span>
                      </div>
                    )}

                    {ocupacao >= 100 && (
                      <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-700">
                          Horário lotado - não é possível adicionar mais clientes
                        </span>
                      </div>
                    )}

                    {alunosNoHorario.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Clientes Cadastrados:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {alunosNoHorario.slice(0, 5).map((cliente: any) => (
                            <div key={cliente.id} className="text-xs text-gray-600 truncate">
                              • {cliente.nome}
                            </div>
                          ))}
                          {alunosNoHorario.length > 5 && (
                            <div className="text-xs text-gray-500">+{alunosNoHorario.length - 5} outros clientes</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Horários</CardTitle>
          <CardDescription>Visão geral da ocupação por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {horarios.filter((h: any) => h.ativo && getOcupacaoPercentual(h.horario, h.limiteMaximo) < 80).length}
              </div>
              <div className="text-sm text-green-700">Horários Disponíveis</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {
                  horarios.filter(
                    (h: any) =>
                      h.ativo &&
                      getOcupacaoPercentual(h.horario, h.limiteMaximo) >= 80 &&
                      getOcupacaoPercentual(h.horario, h.limiteMaximo) < 100,
                  ).length
                }
              </div>
              <div className="text-sm text-orange-700">Quase Lotados</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {horarios.filter((h: any) => h.ativo && getOcupacaoPercentual(h.horario, h.limiteMaximo) >= 100).length}
              </div>
              <div className="text-sm text-red-700">Horários Lotados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

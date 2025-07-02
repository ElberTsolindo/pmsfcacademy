"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { format, subDays, isWeekend } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function JustificativasMultiplas() {
  const { toast } = useToast()
  const [cpf, setCpf] = useState("")
  const [aluno, setAluno] = useState<any>(null)
  const [diasSelecionados, setDiasSelecionados] = useState<Date[]>([])
  const [motivo, setMotivo] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(false)

  // Gerar últimos 30 dias úteis para seleção
  const gerarDiasUteis = () => {
    const dias = []
    const hoje = new Date()

    for (let i = 1; i <= 30; i++) {
      const data = subDays(hoje, i)
      if (!isWeekend(data)) {
        dias.push(data)
      }
    }

    return dias.slice(0, 20) // Últimos 20 dias úteis
  }

  const diasUteis = gerarDiasUteis()

  const buscarAluno = () => {
    if (!cpf.trim()) {
      toast({
        title: "Erro",
        description: "Digite um CPF válido.",
        variant: "destructive",
      })
      return
    }

    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const alunoEncontrado = alunos.find((a: any) => a.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, ""))

    if (!alunoEncontrado) {
      toast({
        title: "Aluno não encontrado",
        description: "CPF não cadastrado no sistema.",
        variant: "destructive",
      })
      setAluno(null)
      return
    }

    setAluno(alunoEncontrado)
  }

  const toggleDia = (dia: Date) => {
    const dataStr = format(dia, "yyyy-MM-dd")
    const jaExiste = diasSelecionados.some((d) => format(d, "yyyy-MM-dd") === dataStr)

    if (jaExiste) {
      setDiasSelecionados(diasSelecionados.filter((d) => format(d, "yyyy-MM-dd") !== dataStr))
    } else {
      setDiasSelecionados([...diasSelecionados, dia])
    }
  }

  const verificarSeJaJustificado = (dia: Date) => {
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
    const dataStr = format(dia, "yyyy-MM-dd")

    return justificativas.some((j: any) => j.alunoId === aluno?.id && j.data === dataStr)
  }

  const verificarSeTemPresenca = (dia: Date) => {
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const dataStr = format(dia, "yyyy-MM-dd")

    return presencas.some((p: any) => p.alunoId === aluno?.id && p.data === dataStr)
  }

  const salvarJustificativas = async () => {
    if (!aluno || diasSelecionados.length === 0 || !motivo.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e selecione pelo menos um dia.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
      const novasJustificativas = []

      for (const dia of diasSelecionados) {
        const dataStr = format(dia, "yyyy-MM-dd")

        // Verificar se já não existe justificativa para este dia
        const jaExiste = justificativas.some((j: any) => j.alunoId === aluno.id && j.data === dataStr)

        if (!jaExiste) {
          const novaJustificativa = {
            id: `${Date.now()}-${Math.random()}`,
            alunoId: aluno.id,
            alunoNome: aluno.nome,
            data: dataStr,
            motivo,
            observacoes,
            timestamp: new Date().toISOString(),
          }

          novasJustificativas.push(novaJustificativa)
          justificativas.push(novaJustificativa)
        }
      }

      localStorage.setItem("justificativas", JSON.stringify(justificativas))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Justificativas Múltiplas",
        detalhes: `${novasJustificativas.length} justificativas adicionadas para ${aluno.nome}`,
        timestamp: new Date().toISOString(),
        usuario: "Admin",
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      toast({
        title: "Sucesso",
        description: `${novasJustificativas.length} justificativas foram registradas com sucesso!`,
      })

      // Limpar formulário
      setDiasSelecionados([])
      setMotivo("")
      setObservacoes("")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar justificativas. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Justificar Múltiplas Faltas</h2>
        <p className="text-gray-600">Justifique várias faltas de uma vez para um aluno</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Aluno</CardTitle>
          <CardDescription>Digite o CPF para localizar o aluno</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cpf">CPF do Aluno</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && buscarAluno()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={buscarAluno}>Buscar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {aluno && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aluno Encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{aluno.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horário</p>
                  <p className="font-medium">{aluno.horario}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selecionar Dias para Justificar</CardTitle>
              <CardDescription>Selecione os dias que deseja justificar (últimos 20 dias úteis)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {diasUteis.map((dia) => {
                  const dataStr = format(dia, "yyyy-MM-dd")
                  const selecionado = diasSelecionados.some((d) => format(d, "yyyy-MM-dd") === dataStr)
                  const jaJustificado = verificarSeJaJustificado(dia)
                  const temPresenca = verificarSeTemPresenca(dia)
                  const desabilitado = jaJustificado || temPresenca

                  return (
                    <div
                      key={dataStr}
                      className={`
                        p-3 border rounded-lg cursor-pointer text-center text-sm
                        ${selecionado ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}
                        ${desabilitado ? "opacity-50 cursor-not-allowed bg-gray-100" : "hover:bg-gray-50"}
                      `}
                      onClick={() => !desabilitado && toggleDia(dia)}
                    >
                      <div className="font-medium">{format(dia, "dd/MM")}</div>
                      <div className="text-xs text-gray-500">{format(dia, "EEE", { locale: ptBR })}</div>
                      {jaJustificado && <div className="text-xs text-green-600 mt-1">Justificado</div>}
                      {temPresenca && <div className="text-xs text-blue-600 mt-1">Presente</div>}
                    </div>
                  )
                })}
              </div>

              {diasSelecionados.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{diasSelecionados.length} dia(s) selecionado(s):</p>
                  <p className="text-sm text-blue-700">
                    {diasSelecionados
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((d) => format(d, "dd/MM/yyyy"))
                      .join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados da Justificativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo da Falta *</Label>
                <Input
                  id="motivo"
                  placeholder="Ex: Consulta médica, Problema familiar, etc."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais (opcional)"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={salvarJustificativas}
                disabled={loading || diasSelecionados.length === 0 || !motivo.trim()}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : `Justificar ${diasSelecionados.length} Falta(s)`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

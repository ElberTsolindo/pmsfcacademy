"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { format, subDays, isWeekend } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface JustificativasMultiplasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  aluno: any
  onSuccess: () => void
}

export default function JustificativasMultiplasModal({
  open,
  onOpenChange,
  aluno,
  onSuccess,
}: JustificativasMultiplasModalProps) {
  const { toast } = useToast()
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([])
  const [motivo, setMotivo] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(false)

  // Gerar últimos 30 dias úteis
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

  const toggleDia = (dataStr: string) => {
    if (diasSelecionados.includes(dataStr)) {
      setDiasSelecionados(diasSelecionados.filter((d) => d !== dataStr))
    } else {
      setDiasSelecionados([...diasSelecionados, dataStr])
    }
  }

  const salvarJustificativas = async () => {
    if (diasSelecionados.length === 0 || !motivo.trim()) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um dia e informe o motivo.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")
      const novasJustificativas = []

      for (const dataStr of diasSelecionados) {
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
        description: `${novasJustificativas.length} justificativas foram registradas!`,
      })

      // Limpar e fechar
      setDiasSelecionados([])
      setMotivo("")
      setObservacoes("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar justificativas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Justificar Múltiplas Faltas</DialogTitle>
          <DialogDescription>Selecione os dias para justificar faltas de {aluno?.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Selecionar Dias (últimos 20 dias úteis)</Label>
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 mt-3">
              {diasUteis.map((dia) => {
                const dataStr = format(dia, "yyyy-MM-dd")
                const jaJustificado = verificarSeJaJustificado(dia)
                const temPresenca = verificarSeTemPresenca(dia)
                const desabilitado = jaJustificado || temPresenca
                const selecionado = diasSelecionados.includes(dataStr)

                return (
                  <div
                    key={dataStr}
                    className={`
                      p-2 border rounded-lg text-center text-sm cursor-pointer
                      ${selecionado ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"}
                      ${desabilitado ? "opacity-50 cursor-not-allowed bg-gray-100" : "hover:bg-gray-50"}
                    `}
                    onClick={() => !desabilitado && toggleDia(dataStr)}
                  >
                    <div className="font-medium">{format(dia, "dd/MM")}</div>
                    <div className="text-xs text-gray-500">{format(dia, "EEE", { locale: ptBR })}</div>
                    {jaJustificado && <div className="text-xs text-green-600">✓</div>}
                    {temPresenca && <div className="text-xs text-blue-600">P</div>}
                  </div>
                )
              })}
            </div>

            {diasSelecionados.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{diasSelecionados.length} dia(s) selecionado(s)</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Falta *</Label>
              <Input
                id="motivo"
                placeholder="Ex: Consulta médica, Problema familiar..."
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
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={salvarJustificativas}
              disabled={loading || diasSelecionados.length === 0 || !motivo.trim()}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : `Justificar ${diasSelecionados.length} Falta(s)`}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

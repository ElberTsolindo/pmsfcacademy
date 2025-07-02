"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, BarChart3, TrendingUp, Users, Clock } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import PDFGenerator from "@/components/pdf-generator"

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [tipoRelatorio, setTipoRelatorio] = useState("diario")
  const [dataInicio, setDataInicio] = useState(new Date())
  const [dataFim, setDataFim] = useState(new Date())
  const [relatorioData, setRelatorioData] = useState<any>(null)

  useEffect(() => {
    gerarRelatorio()
  }, [tipoRelatorio, dataInicio, dataFim])

  const gerarRelatorio = () => {
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")

    let dataInicioFiltro = dataInicio
    let dataFimFiltro = dataFim

    // Ajustar datas baseado no tipo de relatório
    switch (tipoRelatorio) {
      case "diario":
        dataInicioFiltro = dataInicio
        dataFimFiltro = dataInicio
        break
      case "semanal":
        dataInicioFiltro = startOfWeek(dataInicio, { weekStartsOn: 1 })
        dataFimFiltro = endOfWeek(dataInicio, { weekStartsOn: 1 })
        break
      case "mensal":
        dataInicioFiltro = startOfMonth(dataInicio)
        dataFimFiltro = endOfMonth(dataInicio)
        break
    }

    const dataInicioStr = format(dataInicioFiltro, "yyyy-MM-dd")
    const dataFimStr = format(dataFimFiltro, "yyyy-MM-dd")

    // Filtrar presenças no período
    const presencasPeriodo = presencas.filter((p: any) => {
      return p.data >= dataInicioStr && p.data <= dataFimStr
    })

    // Calcular estatísticas
    const totalPresencas = presencasPeriodo.length
    const clientesUnicos = new Set(presencasPeriodo.map((p: any) => p.clienteId)).size

    // Presenças por horário
    const presencasPorHorario: { [key: string]: number } = {}
    presencasPeriodo.forEach((p: any) => {
      presencasPorHorario[p.horarioTreino] = (presencasPorHorario[p.horarioTreino] || 0) + 1
    })

    // Presenças por dia
    const presencasPorDia: { [key: string]: number } = {}
    presencasPeriodo.forEach((p: any) => {
      presencasPorDia[p.data] = (presencasPorDia[p.data] || 0) + 1
    })

    // Top clientes mais frequentes
    const frequenciaPorCliente: { [key: string]: { nome: string; count: number } } = {}
    presencasPeriodo.forEach((p: any) => {
      if (!frequenciaPorCliente[p.clienteId]) {
        frequenciaPorCliente[p.clienteId] = { nome: p.clienteNome, count: 0 }
      }
      frequenciaPorCliente[p.clienteId].count++
    })

    const topClientes = Object.values(frequenciaPorCliente)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setRelatorioData({
      periodo: {
        inicio: dataInicioFiltro,
        fim: dataFimFiltro,
        tipo: tipoRelatorio,
      },
      estatisticas: {
        totalPresencas,
        clientesUnicos,
        mediaPresencasDia: totalPresencas / Math.max(1, Object.keys(presencasPorDia).length),
      },
      presencasPorHorario,
      presencasPorDia,
      topClientes,
    })
  }

  const exportarCSV = () => {
    if (!relatorioData) return

    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const dataInicioStr = format(relatorioData.periodo.inicio, "yyyy-MM-dd")
    const dataFimStr = format(relatorioData.periodo.fim, "yyyy-MM-dd")

    const presencasPeriodo = presencas.filter((p: any) => {
      return p.data >= dataInicioStr && p.data <= dataFimStr
    })

    const csvContent = [
      ["Data", "Cliente", "Horário Check-in", "Horário Treino"].join(","),
      ...presencasPeriodo.map((p: any) =>
        [format(new Date(p.data), "dd/MM/yyyy"), p.clienteNome, p.horario, p.horarioTreino].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_${tipoRelatorio}_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Relatório Exportado",
      description: "Arquivo CSV baixado com sucesso!",
    })
  }

  const exportarPDF = () => {
    // Redirect to enhanced PDF generator
    toast({
      title: "Geração de Relatórios",
      description: "Use o Gerador de Relatórios avançado acima para criar PDFs e documentos Word.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <p className="text-gray-600">Análise de frequência e estatísticas da academia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Relatório</CardTitle>
          <CardDescription>Selecione o tipo e período para gerar o relatório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Referência</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataInicio, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => date && setDataInicio(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <div className="flex space-x-2">
                <Button onClick={exportarCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={exportarPDF} variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  PDF (Use Gerador Avançado)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {relatorioData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PDFGenerator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Estatísticas Gerais</span>
              </CardTitle>
              <CardDescription>
                Período: {format(relatorioData.periodo.inicio, "dd/MM/yyyy")} até{" "}
                {format(relatorioData.periodo.fim, "dd/MM/yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{relatorioData.estatisticas.totalPresencas}</div>
                  <div className="text-sm text-blue-700">Total de Presenças</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{relatorioData.estatisticas.clientesUnicos}</div>
                  <div className="text-sm text-green-700">Clientes Únicos</div>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(relatorioData.estatisticas.mediaPresencasDia)}
                </div>
                <div className="text-sm text-purple-700">Média de Presenças/Dia</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Presenças por Horário</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(relatorioData.presencasPorHorario)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 8)
                  .map(([horario, count]) => (
                    <div key={horario} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{horario}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, ((count as number) / Math.max(...Object.values(relatorioData.presencasPorHorario))) * 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Clientes Mais Frequentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatorioData.topClientes.slice(0, 8).map((cliente: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{cliente.nome}</span>
                    </div>
                    <span className="text-sm text-gray-600">{cliente.count} presenças</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Distribuição por Dia</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(relatorioData.presencasPorDia)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([data, count]) => (
                    <div key={data} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{format(new Date(data), "dd/MM/yyyy")}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, ((count as number) / Math.max(...Object.values(relatorioData.presencasPorDia))) * 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

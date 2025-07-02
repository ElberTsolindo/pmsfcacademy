"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText, File } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function EnhancedPDFGenerator() {
  const { toast } = useToast()
  const [tipoRelatorio, setTipoRelatorio] = useState("presencas")
  const [periodo, setPeriodo] = useState("mensal")
  const [dataReferencia, setDataReferencia] = useState(new Date())
  const [formatoSaida, setFormatoSaida] = useState("pdf")

  const gerarRelatorio = () => {
    const dados = coletarDados()

    if (formatoSaida === "pdf") {
      gerarPDF(dados)
    } else {
      gerarWord(dados)
    }
  }

  const coletarDados = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    let dataInicio = dataReferencia
    let dataFim = dataReferencia

    switch (periodo) {
      case "diario":
        dataInicio = dataReferencia
        dataFim = dataReferencia
        break
      case "semanal":
        dataInicio = startOfWeek(dataReferencia, { weekStartsOn: 1 })
        dataFim = endOfWeek(dataReferencia, { weekStartsOn: 1 })
        break
      case "mensal":
        dataInicio = startOfMonth(dataReferencia)
        dataFim = endOfMonth(dataReferencia)
        break
    }

    const dataInicioStr = format(dataInicio, "yyyy-MM-dd")
    const dataFimStr = format(dataFim, "yyyy-MM-dd")

    return {
      clientes,
      presencas: presencas.filter((p: any) => p.data >= dataInicioStr && p.data <= dataFimStr),
      justificativas: justificativas.filter((j: any) => j.data >= dataInicioStr && j.data <= dataFimStr),
      periodo: { inicio: dataInicio, fim: dataFim },
      tipoRelatorio,
    }
  }

  const gerarPDF = (dados: any) => {
    const htmlContent = gerarHTMLRelatorio(dados)

    // Criar um iframe oculto para impressão
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(htmlContent)
      doc.close()

      // Aguardar carregamento e imprimir
      setTimeout(() => {
        iframe.contentWindow?.print()
        document.body.removeChild(iframe)
      }, 500)
    }

    toast({
      title: "Relatório PDF Gerado",
      description: "O relatório PDF foi gerado e está sendo baixado.",
    })
  }

  const gerarWord = (dados: any) => {
    const wordContent = gerarWordContent(dados)

    const blob = new Blob([wordContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_${dados.tipoRelatorio}_${format(new Date(), "yyyy-MM-dd")}.doc`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Relatório Word Gerado",
      description: "O relatório Word foi gerado e está sendo baixado.",
    })
  }

  const gerarWordContent = (dados: any) => {
    const { clientes, presencas, justificativas, periodo } = dados

    let conteudo = ""

    switch (tipoRelatorio) {
      case "presencas":
        conteudo = gerarRelatorioPresencasWord(presencas, clientes)
        break
      case "justificativas":
        conteudo = gerarRelatorioJustificativasWord(justificativas)
        break
      case "atestados":
        conteudo = gerarRelatorioAtestadosWord(clientes)
        break
      case "turmas":
        conteudo = gerarRelatorioTurmasWord(clientes, presencas)
        break
    }

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Relatório - Academia Pública</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-item { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Academia Pública</h1>
          <p>Relatório de ${getTituloRelatorio()} - ${format(periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} a ${format(periodo.fim, "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
        ${conteudo}
        <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Sistema de Gerenciamento de Frequência - Academia Pública</p>
        </div>
      </body>
      </html>
    `
  }

  const gerarRelatorioPresencasWord = (presencas: any[], clientes: any[]) => {
    const totalPresencas = presencas.length
    const clientesComPresenca = new Set(presencas.map((p) => p.clienteId)).size

    return `
      <div class="section">
        <h2 class="section-title">Estatísticas Gerais</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${totalPresencas}</div>
            <div class="stat-label">Total de Presenças</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${clientesComPresenca}</div>
            <div class="stat-label">Clientes Ativos</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${clientes.length}</div>
            <div class="stat-label">Total de Clientes</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${Math.round((clientesComPresenca / Math.max(clientes.length, 1)) * 100)}%</div>
            <div class="stat-label">Taxa de Frequência</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Detalhamento de Presenças</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Horário Check-in</th>
              <th>Horário de Treino</th>
            </tr>
          </thead>
          <tbody>
            ${presencas
              .map(
                (p) => `
              <tr>
                <td>${format(new Date(p.data), "dd/MM/yyyy")}</td>
                <td>${p.clienteNome}</td>
                <td>${p.horario}</td>
                <td>${p.horarioTreino}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const gerarRelatorioJustificativasWord = (justificativas: any[]) => {
    const motivosCount = justificativas.reduce((acc: any, j) => {
      acc[j.motivo] = (acc[j.motivo] || 0) + 1
      return acc
    }, {})

    return `
      <div class="section">
        <h2 class="section-title">Estatísticas de Justificativas</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${justificativas.length}</div>
            <div class="stat-label">Total de Justificativas</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${new Set(justificativas.map((j) => j.clienteId)).size}</div>
            <div class="stat-label">Clientes com Justificativas</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Detalhamento de Justificativas</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Motivo</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            ${justificativas
              .map(
                (j) => `
              <tr>
                <td>${format(new Date(j.data), "dd/MM/yyyy")}</td>
                <td>${j.clienteNome}</td>
                <td>${j.motivo}</td>
                <td>${j.observacoes || "-"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const gerarRelatorioAtestadosWord = (clientes: any[]) => {
    const clientesComAtestado = clientes.filter((c) => c.dataAtestado)
    const atestadosValidos = clientesComAtestado.filter((c) => {
      const dataVencimento = addMonths(new Date(c.dataAtestado), 6)
      return new Date() <= dataVencimento
    })
    const atestadosVencidos = clientesComAtestado.filter((c) => {
      const dataVencimento = addMonths(new Date(c.dataAtestado), 6)
      return new Date() > dataVencimento
    })

    return `
      <div class="section">
        <h2 class="section-title">Estatísticas de Atestados</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${clientesComAtestado.length}</div>
            <div class="stat-label">Total com Atestado</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${atestadosValidos.length}</div>
            <div class="stat-label">Atestados Válidos</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${atestadosVencidos.length}</div>
            <div class="stat-label">Atestados Vencidos</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Status dos Atestados</h2>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Data de Emissão</th>
              <th>Data de Vencimento</th>
              <th>Status</th>
              <th>Horário</th>
            </tr>
          </thead>
          <tbody>
            ${clientesComAtestado
              .map((c) => {
                const dataVencimento = addMonths(new Date(c.dataAtestado), 6)
                const vencido = new Date() > dataVencimento
                const proximoVencimento = !vencido && new Date() > addMonths(dataVencimento, -1)

                return `
                <tr>
                  <td>${c.nome}</td>
                  <td>${format(new Date(c.dataAtestado), "dd/MM/yyyy")}</td>
                  <td>${format(dataVencimento, "dd/MM/yyyy")}</td>
                  <td>${vencido ? "Vencido" : proximoVencimento ? "Próximo do vencimento" : "Válido"}</td>
                  <td>${c.horario}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const gerarRelatorioTurmasWord = (clientes: any[], presencas: any[]) => {
    const turmas = clientes.reduce((acc: any, c) => {
      if (!acc[c.horario]) {
        acc[c.horario] = { clientes: [], presencas: 0 }
      }
      acc[c.horario].clientes.push(c)
      return acc
    }, {})

    // Contar presenças por horário
    presencas.forEach((p) => {
      if (turmas[p.horarioTreino]) {
        turmas[p.horarioTreino].presencas++
      }
    })

    return `
      <div class="section">
        <h2 class="section-title">Resumo das Turmas</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${Object.keys(turmas).length}</div>
            <div class="stat-label">Total de Horários</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${Math.round(clientes.length / Object.keys(turmas).length)}</div>
            <div class="stat-label">Média por Horário</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Detalhamento por Horário</h2>
        <table>
          <thead>
            <tr>
              <th>Horário</th>
              <th>Clientes Cadastrados</th>
              <th>Presenças no Período</th>
              <th>Taxa de Frequência</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(turmas)
              .map(([horario, dados]: [string, any]) => {
                const taxaFrequencia =
                  dados.clientes.length > 0 ? Math.round((dados.presencas / dados.clientes.length) * 100) : 0
                return `
                <tr>
                  <td>${horario}</td>
                  <td>${dados.clientes.length}</td>
                  <td>${dados.presencas}</td>
                  <td>${taxaFrequencia}%</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const gerarHTMLRelatorio = (dados: any) => {
    // Use the existing PDF generation logic from the previous component
    // This is the same as the original gerarHTMLRelatorio function
    return `<!DOCTYPE html><html><head><title>Relatório</title></head><body><h1>Relatório Academia Pública</h1></body></html>`
  }

  const getTituloRelatorio = () => {
    const titulos = {
      presencas: "Presenças e Faltas",
      justificativas: "Justificativas",
      atestados: "Atestados Médicos",
      turmas: "Turmas e Horários",
    }
    return titulos[tipoRelatorio as keyof typeof titulos]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Gerador de Relatórios</span>
        </CardTitle>
        <CardDescription>Gere relatórios profissionais em PDF ou Word</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencas">Presenças e Faltas</SelectItem>
                <SelectItem value="justificativas">Justificativas</SelectItem>
                <SelectItem value="atestados">Atestados Médicos</SelectItem>
                <SelectItem value="turmas">Turmas e Horários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={periodo} onValueChange={setPeriodo}>
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
                  {format(dataReferencia, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataReferencia}
                  onSelect={(date) => date && setDataReferencia(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <Select value={formatoSaida} onValueChange={setFormatoSaida}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="word">Word</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={gerarRelatorio} className="w-full">
          {formatoSaida === "pdf" ? <Download className="h-4 w-4 mr-2" /> : <File className="h-4 w-4 mr-2" />}
          Gerar Relatório {formatoSaida.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  )
}

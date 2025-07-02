"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function PDFGenerator() {
  const { toast } = useToast()
  const [tipoRelatorio, setTipoRelatorio] = useState("presencas")
  const [periodo, setPeriodo] = useState("mensal")
  const [dataReferencia, setDataReferencia] = useState(new Date())

  const gerarPDF = () => {
    const dados = coletarDados()
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
      title: "Relatório Gerado",
      description: "O relatório PDF foi gerado e está sendo baixado.",
    })
  }

  const coletarDados = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    let dataInicio = dataReferencia
    let dataFim = dataReferencia

    switch (periodo) {
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

  const gerarHTMLRelatorio = (dados: any) => {
    const { clientes, presencas, justificativas, periodo } = dados

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: #fff;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .section { margin-bottom: 40px; }
        .section-title { 
          font-size: 22px; 
          color: #2d3748; 
          border-bottom: 3px solid #667eea;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin-bottom: 30px;
        }
        .stat-card { 
          background: #f7fafc; 
          border: 1px solid #e2e8f0;
          border-radius: 8px; 
          padding: 20px; 
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 14px; color: #718096; margin-top: 5px; }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .table th { 
          background: #667eea; 
          color: white; 
          padding: 15px; 
          text-align: left;
          font-weight: 600;
        }
        .table td { 
          padding: 12px 15px; 
          border-bottom: 1px solid #e2e8f0;
        }
        .table tr:nth-child(even) { background: #f7fafc; }
        .table tr:hover { background: #edf2f7; }
        .badge { 
          display: inline-block;
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 12px; 
          font-weight: 500;
        }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #faf089; color: #744210; }
        .badge-danger { background: #fed7d7; color: #742a2a; }
        .footer { 
          margin-top: 50px; 
          padding: 20px; 
          text-align: center; 
          color: #718096;
          border-top: 1px solid #e2e8f0;
        }
        @media print {
          .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
          .stat-card { border: 1px solid #ccc; }
          .table { box-shadow: none; border: 1px solid #ccc; }
        }
      </style>
    `

    let conteudo = ""

    switch (tipoRelatorio) {
      case "presencas":
        conteudo = gerarRelatorioPresencas(presencas, clientes)
        break
      case "justificativas":
        conteudo = gerarRelatorioJustificativas(justificativas)
        break
      case "atestados":
        conteudo = gerarRelatorioAtestados(clientes)
        break
      case "turmas":
        conteudo = gerarRelatorioTurmas(clientes, presencas)
        break
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório - Academia Pública</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>Academia Pública</h1>
          <p>Relatório de ${getTituloRelatorio()} - ${format(periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} a ${format(periodo.fim, "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
        <div class="container">
          ${conteudo}
        </div>
        <div class="footer">
          <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Sistema de Gerenciamento de Frequência - Academia Pública</p>
        </div>
      </body>
      </html>
    `
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

  const gerarRelatorioPresencas = (presencas: any[], clientes: any[]) => {
    const totalPresencas = presencas.length
    const clientesComPresenca = new Set(presencas.map((p) => p.clienteId)).size

    return `
      <div class="section">
        <h2 class="section-title">Estatísticas Gerais</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${totalPresencas}</div>
            <div class="stat-label">Total de Presenças</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${clientesComPresenca}</div>
            <div class="stat-label">Clientes Ativos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${clientes.length}</div>
            <div class="stat-label">Total de Clientes</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round((clientesComPresenca / Math.max(clientes.length, 1)) * 100)}%</div>
            <div class="stat-label">Taxa de Frequência</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Detalhamento de Presenças</h2>
        <table class="table">
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
                <td><span class="badge badge-success">${p.horarioTreino}</span></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const gerarRelatorioJustificativas = (justificativas: any[]) => {
    const motivosCount = justificativas.reduce((acc: any, j) => {
      acc[j.motivo] = (acc[j.motivo] || 0) + 1
      return acc
    }, {})

    return `
      <div class="section">
        <h2 class="section-title">Estatísticas de Justificativas</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${justificativas.length}</div>
            <div class="stat-label">Total de Justificativas</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${new Set(justificativas.map((j) => j.clienteId)).size}</div>
            <div class="stat-label">Clientes com Justificativas</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Motivos Mais Comuns</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Motivo</th>
              <th>Quantidade</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(motivosCount)
              .map(
                ([motivo, count]) => `
              <tr>
                <td>${motivo}</td>
                <td>${count}</td>
                <td>${Math.round(((count as number) / justificativas.length) * 100)}%</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Detalhamento de Justificativas</h2>
        <table class="table">
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
                <td><span class="badge badge-warning">${j.motivo}</span></td>
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

  const gerarRelatorioAtestados = (clientes: any[]) => {
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
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${clientesComAtestado.length}</div>
            <div class="stat-label">Total com Atestado</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${atestadosValidos.length}</div>
            <div class="stat-label">Atestados Válidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${atestadosVencidos.length}</div>
            <div class="stat-label">Atestados Vencidos</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Status dos Atestados</h2>
        <table class="table">
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
                  <td>
                    <span class="badge ${vencido ? "badge-danger" : proximoVencimento ? "badge-warning" : "badge-success"}">
                      ${vencido ? "Vencido" : proximoVencimento ? "Próximo do vencimento" : "Válido"}
                    </span>
                  </td>
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

  const gerarRelatorioTurmas = (clientes: any[], presencas: any[]) => {
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
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${Object.keys(turmas).length}</div>
            <div class="stat-label">Total de Horários</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round(clientes.length / Object.keys(turmas).length)}</div>
            <div class="stat-label">Média por Horário</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Detalhamento por Horário</h2>
        <table class="table">
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
                  <td><span class="badge badge-success">${horario}</span></td>
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

      <div class="section">
        <h2 class="section-title">Clientes por Horário</h2>
        ${Object.entries(turmas)
          .map(
            ([horario, dados]: [string, any]) => `
          <h3 style="margin: 20px 0 10px 0; color: #667eea;">${horario}</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Endereço</th>
              </tr>
            </thead>
            <tbody>
              ${dados.clientes
                .map(
                  (c: any) => `
                <tr>
                  <td>${c.nome}</td>
                  <td>${c.cpf}</td>
                  <td>${c.endereco}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `,
          )
          .join("")}
      </div>
    `
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Gerador de Relatórios PDF</span>
        </CardTitle>
        <CardDescription>Gere relatórios profissionais em PDF com templates modernos</CardDescription>
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
        </div>

        <Button onClick={gerarPDF} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório PDF
        </Button>
      </CardContent>
    </Card>
  )
}

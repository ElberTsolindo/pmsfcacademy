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

export default function EnhancedRelatorioGenerator() {
  const { toast } = useToast()
  const [tipoRelatorio, setTipoRelatorio] = useState("diario")
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
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
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
      alunos,
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
    const { alunos, presencas, justificativas, periodo } = dados

    let conteudo = ""

    switch (tipoRelatorio) {
      case "presencas":
        conteudo = gerarRelatorioPresencasWord(presencas, alunos)
        break
      case "justificativas":
        conteudo = gerarRelatorioJustificativasWord(justificativas)
        break
      case "atestados":
        conteudo = gerarRelatorioAtestadosWord(alunos)
        break
      case "turmas":
        conteudo = gerarRelatorioTurmasWord(alunos, presencas)
        break
    }

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Relatório - Academia Pública</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
.simple-header { 
  position: relative;
  text-align: center; 
  margin-bottom: 20px; 
  border-bottom: 2px solid #004A8F;
  padding: 40px 20px 10px 20px;
  min-height: 80px;
}

.logo-prefeitura {
  position: absolute;
  top: 5px;
  left: 15px;
  width: 130px;
  height: auto;
  z-index: 10;
}

.logo-prefeitura img {
  width: 130px;
  height: auto;
  max-height: 65px;
  object-fit: contain;
}

.header-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.simple-header h1 { 
  font-size: 20px; 
  font-weight: bold; 
  color: #004A8F; 
  margin: 0 0 8px 0; 
}

.simple-header h2 { 
  font-size: 16px; 
  font-weight: bold; 
  margin: 0 0 5px 0; 
  color: #333;
}

.simple-header p { 
  font-size: 12px; 
  margin: 0; 
  color: #666;
}
.section { margin-bottom: 15px; }
.section-title { 
  font-size: 14px; 
  font-weight: bold; 
  color: #1f2937; 
  border-bottom: 1px solid #004A8F; 
  padding-bottom: 3px; 
  margin-bottom: 8px; 
}
table { 
  width: 100%; 
  border-collapse: collapse; 
  margin-top: 5px; 
  font-size: 10px;
}
th, td { 
  border: 1px solid #d1d5db; 
  padding: 4px; 
  text-align: left; 
}
th { background-color: #f3f4f6; font-weight: bold; }
.stats { 
  display: flex; 
  justify-content: space-around; 
  margin: 10px 0; 
}
.stat-item { text-align: center; margin: 0 5px; }
.stat-number { font-size: 18px; font-weight: bold; color: #004A8F; }
.stat-label { font-size: 9px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="simple-header">
        <div class="logo-prefeitura">
          <img src="https://sfc.portalacelera.com.br/assets/sfc_logo_rect.png" alt="Logo da Prefeitura" />
        </div>
        <div class="header-content">
          <h1>ACADEMIA PÚBLICA</h1>
          <h2>Relatório de ${getTituloRelatorio()}</h2>
          <p>Período: ${format(periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} a ${format(periodo.fim, "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </div>
      ${conteudo}
    </body>
    </html>
  `
  }

  const gerarRelatorioDiario = (presencas: any[], alunos: any[]) => {
    const totalPresencas = presencas.length
    const alunosComPresenca = new Set(presencas.map((p) => p.alunoId)).size

    return `
      <div class="section">
        <h2 class="section-title">Relatório Diário de Frequência</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${totalPresencas}</div>
            <div class="stat-label">Total de Presenças</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${alunosComPresenca}</div>
            <div class="stat-label">Alunos Presentes</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${alunos.length}</div>
            <div class="stat-label">Total de Alunos</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${Math.round((alunosComPresenca / Math.max(alunos.length, 1)) * 100)}%</div>
            <div class="stat-label">Taxa de Frequência</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Lista de Presenças</h2>
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>CPF</th>
              <th>Horário Check-in</th>
              <th>Horário de Treino</th>
            </tr>
          </thead>
          <tbody>
            ${presencas
              .map(
                (p) => `
              <tr>
                <td>${p.alunoNome}</td>
                <td>${alunos.find((c) => c.id === p.alunoId)?.cpf || "N/A"}</td>
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

  const gerarRelatorioDiarioWord = (presencas: any[], alunos: any[]) => {
    return gerarRelatorioDiario(presencas, alunos)
  }

  const gerarRelatorioPresencas = (presencas: any[], alunos: any[]) => {
    return gerarRelatorioDiario(presencas, alunos)
  }

  const gerarRelatorioPresencasWord = (presencas: any[], alunos: any[]) => {
    return gerarRelatorioDiario(presencas, alunos)
  }

  const gerarRelatorioJustificativas = (justificativas: any[]) => {
    const motivosCount = justificativas.reduce((acc: any, j) => {
      acc[j.motivo] = (acc[j.motivo] || 0) + 1
      return acc
    }, {})

    return `
      <div class="section">
        <h2 class="section-title">Relatório de Justificativas</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${justificativas.length}</div>
            <div class="stat-label">Total de Justificativas</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${new Set(justificativas.map((j) => j.alunoId)).size}</div>
            <div class="stat-label">Alunos com Justificativas</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Lista de Justificativas</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Aluno</th>
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
                <td>${j.alunoNome}</td>
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

  const gerarRelatorioJustificativasWord = (justificativas: any[]) => {
    return gerarRelatorioJustificativas(justificativas)
  }

  const gerarRelatorioAtestados = (alunos: any[]) => {
    const alunosComAtestado = alunos.filter((c) => c.dataAtestado)
    const atestadosValidos = alunosComAtestado.filter((c) => {
      const dataVencimento = addMonths(new Date(c.dataAtestado), 6)
      return new Date() <= dataVencimento
    })
    const atestadosVencidos = alunosComAtestado.filter((c) => {
      const dataVencimento = addMonths(new Date(c.dataAtestado), 6)
      return new Date() > dataVencimento
    })

    return `
      <div class="section">
        <h2 class="section-title">Relatório de Atestados Médicos</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${alunosComAtestado.length}</div>
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
          <div class="stat-item">
            <div class="stat-number">${alunos.length - alunosComAtestado.length}</div>
            <div class="stat-label">Sem Atestado</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Status dos Atestados</h2>
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>CPF</th>
              <th>Data de Emissão</th>
              <th>Data de Vencimento</th>
              <th>Status</th>
              <th>Horário</th>
            </tr>
          </thead>
          <tbody>
            ${alunos
              .map((c) => {
                if (c.dataAtestado) {
                  const dataVencimento = addMonths(new Date(c.dataAtestado), 6)
                  const vencido = new Date() > dataVencimento
                  const proximoVencimento = !vencido && new Date() > addMonths(dataVencimento, -1)

                  return `
                  <tr>
                    <td>${c.nome}</td>
                    <td>${c.cpf}</td>
                    <td>${format(new Date(c.dataAtestado), "dd/MM/yyyy")}</td>
                    <td>${format(dataVencimento, "dd/MM/yyyy")}</td>
                    <td>${vencido ? "Vencido" : proximoVencimento ? "Próximo do vencimento" : "Válido"}</td>
                    <td>${c.horario}</td>
                  </tr>
                `
                } else {
                  return `
                  <tr>
                    <td>${c.nome}</td>
                    <td>${c.cpf}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>Sem Atestado</td>
                    <td>${c.horario}</td>
                  </tr>
                `
                }
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const gerarRelatorioAtestadosWord = (alunos: any[]) => {
    return gerarRelatorioAtestados(alunos)
  }

  const gerarRelatorioTurmas = (alunos: any[], presencas: any[]) => {
    const turmas = alunos.reduce((acc: any, c) => {
      if (!acc[c.horario]) {
        acc[c.horario] = { alunos: [], presencas: 0 }
      }
      acc[c.horario].alunos.push(c)
      return acc
    }, {})

    // Contar presenças por horário
    presencas.forEach((p) => {
      if (turmas[p.horarioTreino]) {
        turmas[p.horarioTreino].presencas++
      }
    })

    // Obter configurações de horários para saber o limite máximo de cada horário
    const horariosConfig = JSON.parse(localStorage.getItem("horarios") || "[]")

    return `
    <div class="section">
      <h2 class="section-title">Relatório de Turmas e Horários</h2>
      <div class="stats">
        <div class="stat-item">
          <div class="stat-number">${Object.keys(turmas).length}</div>
          <div class="stat-label">Total de Horários</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${Math.round(alunos.length / Object.keys(turmas).length)}</div>
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
            <th>Alunos Cadastrados</th>
            <th>Presenças no Período</th>
            <th>Capacidade da Turma</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(turmas)
            .map(([horario, dados]: [string, any]) => {
              const horarioConfig = horariosConfig.find((h: any) => h.horario === horario) || { limiteMaximo: 20 }
              const vagasDisponiveis = horarioConfig.limiteMaximo - dados.alunos.length
              return `
              <tr>
                <td>${horario}</td>
                <td>${dados.alunos.length}</td>
                <td>${dados.presencas}</td>
                <td>${vagasDisponiveis} vagas disponíveis</td>
              </tr>
            `
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `
  }

  const gerarRelatorioTurmasWord = (alunos: any[], presencas: any[]) => {
    return gerarRelatorioTurmas(alunos, presencas)
  }

  const gerarHTMLRelatorio = (dados: any) => {
    const { alunos, presencas, justificativas, periodo } = dados

    let conteudo = ""

    switch (tipoRelatorio) {
      case "diario":
        conteudo = gerarRelatorioDiario(presencas, alunos)
        break
      case "presencas":
        conteudo = gerarRelatorioPresencas(presencas, alunos)
        break
      case "justificativas":
        conteudo = gerarRelatorioJustificativas(justificativas)
        break
      case "atestados":
        conteudo = gerarRelatorioAtestados(alunos)
        break
      case "turmas":
        conteudo = gerarRelatorioTurmas(alunos, presencas)
        break
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório - Academia Pública</title>
      <style>
        body { 
  font-family: Arial, sans-serif; 
  margin: 20px; 
  line-height: 1.4; 
  color: #333;
}
.simple-header { 
  position: relative;
  text-align: center; 
  margin-bottom: 20px; 
  border-bottom: 2px solid #004A8F;
  padding: 40px 20px 10px 20px;
  min-height: 80px;
}

.logo-prefeitura {
  position: absolute;
  top: 5px;
  left: 15px;
  width: 130px;
  height: auto;
  z-index: 10;
}

.logo-prefeitura img {
  width: 130px;
  height: auto;
  max-height: 65px;
  object-fit: contain;
}

.header-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.simple-header h1 { 
  font-size: 24px; 
  font-weight: bold; 
  color: #004A8F; 
  margin: 0 0 8px 0; 
}

.simple-header h2 { 
  font-size: 18px; 
  font-weight: bold; 
  margin: 0 0 5px 0; 
  color: #333;
}

.simple-header p { 
  font-size: 14px; 
  margin: 0; 
  color: #666;
}
.section { margin-bottom: 20px; }
.section-title { 
  font-size: 18px; 
  color: #2d3748; 
  border-bottom: 2px solid #004A8F;
  padding-bottom: 5px;
  margin-bottom: 10px;
}
.stats { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
  gap: 10px; 
  margin-bottom: 15px;
}
.stat-item { 
  background: #f7fafc; 
  border: 1px solid #e2e8f0;
  border-radius: 6px; 
  padding: 12px; 
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.stat-number { font-size: 24px; font-weight: bold; color: #004A8F; }
.stat-label { font-size: 11px; color: #718096; margin-top: 3px; }
table { 
  width: 100%; 
  border-collapse: collapse; 
  margin-top: 10px;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  border-radius: 6px;
  overflow: hidden;
  font-size: 11px;
}
th { 
  background: #004A8F; 
  color: white; 
  padding: 8px; 
  text-align: left;
  font-weight: 600;
  font-size: 12px;
}
td { 
  padding: 6px 8px; 
  border-bottom: 1px solid #e2e8f0;
}
tr:nth-child(even) { background: #f7fafc; }
tr:hover { background: #edf2f7; }
@media print {
  body { margin: 15px; }
  .simple-header { margin-bottom: 15px; }
  .stats { grid-template-columns: repeat(4, 1fr); }
  table { font-size: 10px; }
  th { padding: 6px; font-size: 11px; }
  td { padding: 4px 6px; }
}
      </style>
    </head>
    <body>
      <div class="simple-header">
        <div class="logo-prefeitura">
          <img src="https://sfc.portalacelera.com.br/assets/sfc_logo_rect.png" alt="Logo da Prefeitura" />
        </div>
        <div class="header-content">
          <h1>ACADEMIA PÚBLICA</h1>
          <h2>Relatório de ${getTituloRelatorio()}</h2>
          <p>Período: ${format(periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} a ${format(periodo.fim, "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </div>
      ${conteudo}
    </body>
    </html>
  `
  }

  const getTituloRelatorio = () => {
    const titulos = {
      diario: "Diário",
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
                <SelectItem value="diario">Relatório Diário</SelectItem>
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

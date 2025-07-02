"use client"

import { useEffect } from "react"
import { format, addMonths } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function AutomaticInactivityManager() {
  const { toast } = useToast()

  useEffect(() => {
    verificarInatividade()
  }, [])

  const verificarInatividade = () => {
    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    let alunosInativados = 0

    const alunosAtualizados = alunos.map((aluno: any) => {
      // Verificar faltas consecutivas
      const faltasConsecutivas = calcularFaltasConsecutivas(aluno.id, presencas, justificativas)

      // Verificar atestado vencido
      let atestadoVencido = false
      if (aluno.dataAtestado) {
        const dataAtestado = new Date(aluno.dataAtestado)
        const dataVencimento = addMonths(dataAtestado, 6)
        atestadoVencido = new Date() > dataVencimento
      }

      // Se tinha 7+ faltas ou atestado vencido, marcar como inativo
      if ((faltasConsecutivas >= 7 || atestadoVencido) && aluno.status !== "inativo") {
        alunosInativados++
        return { ...aluno, status: "inativo" }
      }

      // Se tinha menos de 7 faltas e atestado válido, marcar como ativo
      if (faltasConsecutivas < 7 && !atestadoVencido && aluno.status === "inativo") {
        return { ...aluno, status: "ativo" }
      }

      return aluno
    })

    // Salvar alterações se houver
    if (alunosInativados > 0) {
      localStorage.setItem("alunos", JSON.stringify(alunosAtualizados))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Inativação Automática",
        detalhes: `${alunosInativados} aluno(s) inativado(s) automaticamente`,
        timestamp: new Date().toISOString(),
        usuario: "Sistema",
      })
      localStorage.setItem("logs", JSON.stringify(logs))
    }
  }

  const calcularFaltasConsecutivas = (alunoId: string, presencas: any[], justificativas: any[]) => {
    const presencasAluno = presencas.filter((p: any) => p.alunoId === alunoId)
    const justificativasAluno = justificativas.filter((j: any) => j.alunoId === alunoId)

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

  return null // Este componente não renderiza nada
}

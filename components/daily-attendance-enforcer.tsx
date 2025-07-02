"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DailyAttendanceEnforcer() {
  const { toast } = useToast()

  useEffect(() => {
    // Check for duplicate attendance records and clean them up
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const presencasLimpas: any[] = []
    const registrosPorClienteData = new Map()

    presencas.forEach((presenca: any) => {
      const chave = `${presenca.clienteId}-${presenca.data}`

      if (!registrosPorClienteData.has(chave)) {
        registrosPorClienteData.set(chave, presenca)
        presencasLimpas.push(presenca)
      } else {
        // Log duplicate found
        console.log(`Duplicate attendance found for client ${presenca.clienteNome} on ${presenca.data}`)
      }
    })

    // Update localStorage if duplicates were found
    if (presencasLimpas.length !== presencas.length) {
      localStorage.setItem("presencas", JSON.stringify(presencasLimpas))

      const duplicatesRemoved = presencas.length - presencasLimpas.length
      toast({
        title: "Registros Duplicados Removidos",
        description: `${duplicatesRemoved} registro(s) de presença duplicado(s) foram removidos automaticamente.`,
      })

      // Log the cleanup activity
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Limpeza de Registros Duplicados",
        detalhes: `${duplicatesRemoved} registros de presença duplicados foram removidos`,
        timestamp: new Date().toISOString(),
        usuario: "Sistema",
      })
      localStorage.setItem("logs", JSON.stringify(logs))
    }
  }, [])

  return null // This component doesn't render anything
}

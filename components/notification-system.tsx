"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, Bell, AlertTriangle, FileText } from "lucide-react"
import { format, addMonths, differenceInDays } from "date-fns"

interface Notification {
  id: string
  type: "warning" | "error" | "info"
  title: string
  message: string
  clienteId?: string
  action?: () => void
  actionLabel?: string
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    checkForNotifications()

    // Check every 5 minutes
    const interval = setInterval(checkForNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkForNotifications = () => {
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const presencas = JSON.parse(localStorage.getItem("presencas") || "[]")
    const justificativas = JSON.parse(localStorage.getItem("justificativas") || "[]")

    const newNotifications: Notification[] = []

    clientes.forEach((cliente: any) => {
      // Check for expired medical certificates
      if (cliente.dataAtestado) {
        const dataAtestado = new Date(cliente.dataAtestado)
        const dataVencimento = addMonths(dataAtestado, 6)
        const diasParaVencer = differenceInDays(dataVencimento, new Date())

        if (diasParaVencer < 0) {
          newNotifications.push({
            id: `atestado-vencido-${cliente.id}`,
            type: "error",
            title: "Atestado Vencido",
            message: `${cliente.nome} possui atestado médico vencido desde ${format(dataVencimento, "dd/MM/yyyy")}`,
            clienteId: cliente.id,
          })
        } else if (diasParaVencer <= 30) {
          newNotifications.push({
            id: `atestado-vencendo-${cliente.id}`,
            type: "warning",
            title: "Atestado Próximo do Vencimento",
            message: `${cliente.nome} - atestado vence em ${diasParaVencer} dias (${format(dataVencimento, "dd/MM/yyyy")})`,
            clienteId: cliente.id,
          })
        }
      } else {
        // Client without medical certificate
        newNotifications.push({
          id: `sem-atestado-${cliente.id}`,
          type: "warning",
          title: "Atestado Médico Necessário",
          message: `${cliente.nome} não possui atestado médico cadastrado`,
          clienteId: cliente.id,
        })
      }

      // Check for inactive clients (7+ consecutive absences)
      const faltasConsecutivas = calcularFaltasConsecutivas(cliente.id, presencas, justificativas)
      if (faltasConsecutivas >= 7) {
        newNotifications.push({
          id: `cliente-inativo-${cliente.id}`,
          type: "error",
          title: "Cliente Inativo",
          message: `${cliente.nome} possui ${faltasConsecutivas} faltas consecutivas não justificadas`,
          clienteId: cliente.id,
        })
      } else if (faltasConsecutivas >= 5) {
        newNotifications.push({
          id: `cliente-risco-${cliente.id}`,
          type: "warning",
          title: "Cliente em Risco de Inativação",
          message: `${cliente.nome} possui ${faltasConsecutivas} faltas consecutivas`,
          clienteId: cliente.id,
        })
      }
    })

    // Check for overcrowded time slots
    const horarios = JSON.parse(localStorage.getItem("horarios") || "[]")
    horarios.forEach((horario: any) => {
      if (horario.ativo) {
        const clientesNoHorario = clientes.filter((c: any) => c.horario === horario.horario)
        const ocupacao = (clientesNoHorario.length / horario.limiteMaximo) * 100

        if (ocupacao >= 100) {
          newNotifications.push({
            id: `horario-lotado-${horario.id}`,
            type: "error",
            title: "Horário Lotado",
            message: `Horário ${horario.horario} atingiu capacidade máxima (${clientesNoHorario.length}/${horario.limiteMaximo})`,
          })
        } else if (ocupacao >= 90) {
          newNotifications.push({
            id: `horario-quase-lotado-${horario.id}`,
            type: "warning",
            title: "Horário Quase Lotado",
            message: `Horário ${horario.horario} está com ${Math.round(ocupacao)}% da capacidade`,
          })
        }
      }
    })

    // Remove duplicates and limit to 10 most important notifications
    const uniqueNotifications = newNotifications
      .filter((notif, index, self) => index === self.findIndex((n) => n.id === notif.id))
      .slice(0, 10)

    setNotifications(uniqueNotifications)
  }

  const calcularFaltasConsecutivas = (clienteId: string, presencas: any[], justificativas: any[]) => {
    const presencasCliente = presencas.filter((p: any) => p.clienteId === clienteId)
    const justificativasCliente = justificativas.filter((j: any) => j.clienteId === clienteId)

    let consecutivas = 0
    const hoje = new Date()

    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = format(data, "yyyy-MM-dd")

      const temPresenca = presencasCliente.some((p: any) => p.data === dataStr)
      const temJustificativa = justificativasCliente.some((j: any) => j.data === dataStr)

      if (!temPresenca && !temJustificativa && data.getDay() >= 1 && data.getDay() <= 5) {
        consecutivas++
      } else if (temPresenca || temJustificativa) {
        break
      }
    }

    return consecutivas
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const dismissAll = () => {
    setNotifications([])
  }

  if (!isVisible || notifications.length === 0) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="fixed top-20 right-4 z-50">
        <Bell className="h-4 w-4 mr-2" />
        Notificações ({notifications.length})
      </Button>
    )
  }

  return (
    <div className="fixed top-20 right-4 w-80 max-h-96 overflow-y-auto z-50 space-y-2">
      <div className="flex items-center justify-between bg-white p-2 rounded-t-lg border">
        <h3 className="font-medium text-sm flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          Notificações ({notifications.length})
        </h3>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={dismissAll}>
            Limpar Todas
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          className={`${
            notification.type === "error"
              ? "border-red-200 bg-red-50"
              : notification.type === "warning"
                ? "border-orange-200 bg-orange-50"
                : "border-blue-200 bg-blue-50"
          }`}
        >
          {notification.type === "error" ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : notification.type === "warning" ? (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          ) : (
            <FileText className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription
            className={`${
              notification.type === "error"
                ? "text-red-800"
                : notification.type === "warning"
                  ? "text-orange-800"
                  : "text-blue-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <strong>{notification.title}:</strong> {notification.message}
                {notification.action && (
                  <Button variant="link" size="sm" onClick={notification.action} className="p-0 h-auto mt-1">
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="p-1 h-auto"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

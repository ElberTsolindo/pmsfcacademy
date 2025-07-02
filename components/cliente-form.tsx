"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function ClienteForm() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    endereco: "",
    horario: "",
    observacoes: "",
    dataAtestado: "",
  })

  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])

  useEffect(() => {
    const horariosConfig = JSON.parse(localStorage.getItem("horarios") || "[]")
    const clientesCadastrados = JSON.parse(localStorage.getItem("clientes") || "[]")

    const horariosAtivos = horariosConfig.filter((h: any) => h.ativo)
    const horariosComVaga = horariosAtivos.filter((h: any) => {
      const clientesNoHorario = clientesCadastrados.filter((c: any) => c.horario === h.horario)
      return clientesNoHorario.length < h.limiteMaximo
    })

    setHorariosDisponiveis(horariosComVaga)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (
      !formData.nome ||
      !formData.cpf ||
      !formData.rg ||
      !formData.endereco ||
      !formData.horario ||
      !formData.dataAtestado
    ) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive",
      })
      return
    }

    // Salvar cliente
    const novoCliente = {
      id: Date.now().toString(),
      ...formData,
      dataCadastro: new Date().toISOString(),
    }

    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]")
    const clientesAtualizados = [...clientes, novoCliente]
    localStorage.setItem("clientes", JSON.stringify(clientesAtualizados))

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Cadastro de Cliente",
      detalhes: `Cliente ${formData.nome} cadastrado no horário ${formData.horario}`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Sucesso",
      description: "Cliente cadastrado com sucesso!",
    })

    // Limpar formulário
    setFormData({
      nome: "",
      cpf: "",
      rg: "",
      endereco: "",
      horario: "",
      observacoes: "",
      dataAtestado: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Cliente</CardTitle>
        <CardDescription>Registre um novo cliente na academia</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rg">RG *</Label>
              <Input
                id="rg"
                placeholder="00.000.000-0"
                value={formData.rg}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário de Treino *</Label>
              <Select value={formData.horario} onValueChange={(value) => setFormData({ ...formData, horario: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {horariosDisponiveis.map((horario: any) => (
                    <SelectItem key={horario.horario} value={horario.horario}>
                      {horario.horario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {horariosDisponiveis.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Não há horários disponíveis no momento. Todos estão inativos ou lotados.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataAtestado">Data do Atestado Médico *</Label>
              <Input
                id="dataAtestado"
                type="date"
                value={formData.dataAtestado}
                onChange={(e) => setFormData({ ...formData, dataAtestado: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Atestado válido por 6 meses a partir da data de emissão</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <Input
              id="endereco"
              placeholder="Rua, número, bairro, cidade, CEP"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais (opcional)"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <Button type="submit" className="w-full">
            Cadastrar Cliente
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

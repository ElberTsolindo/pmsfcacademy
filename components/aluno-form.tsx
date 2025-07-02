"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

export default function AlunoForm() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    endereco: "",
    horario: "",
    observacoes: "",
    dataAtestado: "",
    contato: "",
    contatoEmergencia: "",
    nomePai: "",
    nomeMae: "",
    menorDe18: false,
    responsavelLegal: "",
    parentesco: "",
    contatoResponsavel: "",
    usaMedicamento: false,
    qualMedicamento: "",
    possuiDoenca: false,
    qualDoenca: "",
  })

  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])

  useEffect(() => {
    const horariosConfig = JSON.parse(localStorage.getItem("horarios") || "[]")
    const alunosCadastrados = JSON.parse(localStorage.getItem("alunos") || "[]")

    const horariosAtivos = horariosConfig.filter((h: any) => h.ativo)
    const horariosComVaga = horariosAtivos.filter((h: any) => {
      const alunosNoHorario = alunosCadastrados.filter((c: any) => c.horario === h.horario)
      return alunosNoHorario.length < h.limiteMaximo
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
      !formData.dataAtestado ||
      !formData.contato ||
      !formData.contatoEmergencia ||
      !formData.nomePai ||
      !formData.nomeMae
    ) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive",
      })
      return
    }

    // Validar CPF (11 dígitos, apenas números)
    const cpfLimpo = formData.cpf.replace(/\D/g, "")
    if (cpfLimpo.length !== 11 || !/^\d+$/.test(cpfLimpo)) {
      toast({
        title: "Erro",
        description: "CPF deve conter exatamente 11 dígitos numéricos.",
        variant: "destructive",
      })
      return
    }

    // Validar RG (até 9 dígitos, apenas números)
    const rgLimpo = formData.rg.replace(/\D/g, "")
    if (rgLimpo.length > 9 || !/^\d+$/.test(rgLimpo)) {
      toast({
        title: "Erro",
        description: "RG deve conter até 9 dígitos numéricos.",
        variant: "destructive",
      })
      return
    }

    // Validar contatos (11 dígitos, apenas números)
    const contatoLimpo = formData.contato.replace(/\D/g, "")
    if (contatoLimpo.length !== 11 || !/^\d+$/.test(contatoLimpo)) {
      toast({
        title: "Erro",
        description: "Contato deve conter exatamente 11 dígitos numéricos (incluindo DDD).",
        variant: "destructive",
      })
      return
    }

    const contatoEmergenciaLimpo = formData.contatoEmergencia.replace(/\D/g, "")
    if (contatoEmergenciaLimpo.length !== 11 || !/^\d+$/.test(contatoEmergenciaLimpo)) {
      toast({
        title: "Erro",
        description: "Contato de emergência deve conter exatamente 11 dígitos numéricos (incluindo DDD).",
        variant: "destructive",
      })
      return
    }

    // Validar campos adicionais para menores de 18 anos
    if (formData.menorDe18) {
      if (!formData.responsavelLegal || !formData.parentesco || !formData.contatoResponsavel) {
        toast({
          title: "Erro",
          description: "Todos os campos do responsável legal devem ser preenchidos para menores de 18 anos.",
          variant: "destructive",
        })
        return
      }

      const contatoResponsavelLimpo = formData.contatoResponsavel.replace(/\D/g, "")
      if (contatoResponsavelLimpo.length !== 11 || !/^\d+$/.test(contatoResponsavelLimpo)) {
        toast({
          title: "Erro",
          description: "Contato do responsável deve conter exatamente 11 dígitos numéricos (incluindo DDD).",
          variant: "destructive",
        })
        return
      }
    }

    // Validar campos de medicamento e doença
    if (formData.usaMedicamento && !formData.qualMedicamento.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe qual medicamento é utilizado.",
        variant: "destructive",
      })
      return
    }

    if (formData.possuiDoenca && !formData.qualDoenca.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe qual doença o aluno possui.",
        variant: "destructive",
      })
      return
    }

    // Validar data do atestado (não pode ser anterior à data atual)
    // const dataAtestado = new Date(formData.dataAtestado)
    // const hoje = new Date()
    // hoje.setHours(0, 0, 0, 0)
    // if (dataAtestado < hoje) {
    //   toast({
    //     title: "Erro",
    //     description: "A data do atestado médico não pode ser anterior à data atual.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    // Formatar os dados para salvar
    const dadosFormatados = {
      ...formData,
      cpf: cpfLimpo,
      rg: rgLimpo,
      contato: contatoLimpo,
      contatoEmergencia: contatoEmergenciaLimpo,
      contatoResponsavel: formData.menorDe18 ? formData.contatoResponsavel.replace(/\D/g, "") : "",
    }

    // Salvar aluno
    const novoAluno = {
      id: Date.now().toString(),
      ...dadosFormatados,
      dataCadastro: new Date().toISOString(),
    }

    const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
    const alunosAtualizados = [...alunos, novoAluno]
    localStorage.setItem("alunos", JSON.stringify(alunosAtualizados))

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Cadastro de Aluno",
      detalhes: `Aluno ${formData.nome} cadastrado no horário ${formData.horario}`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Sucesso",
      description: "Aluno cadastrado com sucesso!",
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
      contato: "",
      contatoEmergencia: "",
      nomePai: "",
      nomeMae: "",
      menorDe18: false,
      responsavelLegal: "",
      parentesco: "",
      contatoResponsavel: "",
      usaMedicamento: false,
      qualMedicamento: "",
      possuiDoenca: false,
      qualDoenca: "",
    })
  }

  // Função para formatar CPF enquanto digita
  const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "")
    let cpfFormatado = apenasNumeros

    if (apenasNumeros.length > 3) {
      cpfFormatado = apenasNumeros.substring(0, 3) + "." + apenasNumeros.substring(3)
    }
    if (apenasNumeros.length > 6) {
      cpfFormatado = cpfFormatado.substring(0, 7) + "." + cpfFormatado.substring(7)
    }
    if (apenasNumeros.length > 9) {
      cpfFormatado = cpfFormatado.substring(0, 11) + "-" + cpfFormatado.substring(11)
    }

    return cpfFormatado.substring(0, 14)
  }

  // Função para formatar telefone enquanto digita
  const formatarTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "")
    let telefoneFormatado = apenasNumeros

    if (apenasNumeros.length > 2) {
      telefoneFormatado = "(" + apenasNumeros.substring(0, 2) + ") " + apenasNumeros.substring(2)
    }
    if (apenasNumeros.length > 7) {
      telefoneFormatado = telefoneFormatado.substring(0, 10) + "-" + telefoneFormatado.substring(10)
    }

    return telefoneFormatado.substring(0, 16)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Aluno</CardTitle>
        <CardDescription>Registre um novo aluno na academia</CardDescription>
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
                onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })}
                maxLength={14}
                required
              />
              <p className="text-xs text-gray-500">Apenas números, 11 dígitos</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rg">RG *</Label>
              <Input
                id="rg"
                placeholder="00000000"
                value={formData.rg}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  if (value.length <= 9) {
                    setFormData({ ...formData, rg: value })
                  }
                }}
                required
              />
              <p className="text-xs text-gray-500">Apenas números, até 9 dígitos</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato">Contato (Telefone Pessoal) *</Label>
              <Input
                id="contato"
                placeholder="(00) 00000-0000"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: formatarTelefone(e.target.value) })}
                maxLength={16}
                required
              />
              <p className="text-xs text-gray-500">Apenas números, 11 dígitos com DDD</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contatoEmergencia">Contato de Emergência *</Label>
              <Input
                id="contatoEmergencia"
                placeholder="(00) 00000-0000"
                value={formData.contatoEmergencia}
                onChange={(e) => setFormData({ ...formData, contatoEmergencia: formatarTelefone(e.target.value) })}
                maxLength={16}
                required
              />
              <p className="text-xs text-gray-500">Apenas números, 11 dígitos com DDD</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomePai">Nome do Pai *</Label>
              <Input
                id="nomePai"
                placeholder="Digite o nome do pai"
                value={formData.nomePai}
                onChange={(e) => setFormData({ ...formData, nomePai: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeMae">Nome da Mãe *</Label>
              <Input
                id="nomeMae"
                placeholder="Digite o nome da mãe"
                value={formData.nomeMae}
                onChange={(e) => setFormData({ ...formData, nomeMae: e.target.value })}
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

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="menorDe18"
              checked={formData.menorDe18}
              onCheckedChange={(checked) => {
                setFormData({
                  ...formData,
                  menorDe18: checked === true,
                  // Limpar campos do responsável se desmarcar
                  responsavelLegal: checked === true ? formData.responsavelLegal : "",
                  parentesco: checked === true ? formData.parentesco : "",
                  contatoResponsavel: checked === true ? formData.contatoResponsavel : "",
                })
              }}
            />
            <Label htmlFor="menorDe18" className="font-medium">
              Menor de 18 anos?
            </Label>
          </div>

          {formData.menorDe18 && (
            <div className="border p-4 rounded-md bg-gray-50 space-y-4">
              <h3 className="font-medium">Informações do Responsável Legal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavelLegal">Nome do Responsável Legal *</Label>
                  <Input
                    id="responsavelLegal"
                    placeholder="Digite o nome do responsável"
                    value={formData.responsavelLegal}
                    onChange={(e) => setFormData({ ...formData, responsavelLegal: e.target.value })}
                    required={formData.menorDe18}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentesco">Parentesco *</Label>
                  <Select
                    value={formData.parentesco}
                    onValueChange={(value) => setFormData({ ...formData, parentesco: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pai">Pai</SelectItem>
                      <SelectItem value="Mãe">Mãe</SelectItem>
                      <SelectItem value="Avô/Avó">Avô/Avó</SelectItem>
                      <SelectItem value="Tio/Tia">Tio/Tia</SelectItem>
                      <SelectItem value="Irmão/Irmã">Irmão/Irmã</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contatoResponsavel">Contato do Responsável *</Label>
                  <Input
                    id="contatoResponsavel"
                    placeholder="(00) 00000-0000"
                    value={formData.contatoResponsavel}
                    onChange={(e) => setFormData({ ...formData, contatoResponsavel: formatarTelefone(e.target.value) })}
                    maxLength={16}
                    required={formData.menorDe18}
                  />
                  <p className="text-xs text-gray-500">Apenas números, 11 dígitos com DDD</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="usaMedicamento"
                checked={formData.usaMedicamento}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    usaMedicamento: checked === true,
                    qualMedicamento: checked === true ? formData.qualMedicamento : "",
                  })
                }}
              />
              <Label htmlFor="usaMedicamento" className="font-medium">
                Faz uso de algum medicamento?
              </Label>
            </div>

            {formData.usaMedicamento && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="qualMedicamento">Qual medicamento? *</Label>
                <Textarea
                  id="qualMedicamento"
                  placeholder="Descreva o medicamento e a posologia"
                  value={formData.qualMedicamento}
                  onChange={(e) => setFormData({ ...formData, qualMedicamento: e.target.value })}
                  className="min-h-[80px]"
                  required={formData.usaMedicamento}
                />
              </div>
            )}

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="possuiDoenca"
                checked={formData.possuiDoenca}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    possuiDoenca: checked === true,
                    qualDoenca: checked === true ? formData.qualDoenca : "",
                  })
                }}
              />
              <Label htmlFor="possuiDoenca" className="font-medium">
                Possui alguma doença?
              </Label>
            </div>

            {formData.possuiDoenca && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="qualDoenca">Qual doença? *</Label>
                <Textarea
                  id="qualDoenca"
                  placeholder="Descreva a doença e condições relevantes"
                  value={formData.qualDoenca}
                  onChange={(e) => setFormData({ ...formData, qualDoenca: e.target.value })}
                  className="min-h-[80px]"
                  required={formData.possuiDoenca}
                />
              </div>
            )}
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
            Cadastrar Aluno
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

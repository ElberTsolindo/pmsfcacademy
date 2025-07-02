"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, Search, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AlunoDetailScreen from "@/components/aluno-detail-screen"
import RoleGuard from "@/components/role-guard"

export default function AlunoList() {
  const { toast } = useToast()
  const [alunos, setAlunos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [alunoEditando, setAlunoEditando] = useState<any>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [alunoDetalhes, setAlunoDetalhes] = useState<string | null>(null)

  const horarios = [
    "05:00 - 06:00",
    "06:00 - 07:00",
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
  ]

  useEffect(() => {
    carregarAlunos()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      carregarAlunos()
    }, 1000) // Recarrega a cada segundo

    return () => clearInterval(interval)
  }, [])

  const carregarAlunos = () => {
    const alunosSalvos = JSON.parse(localStorage.getItem("alunos") || "[]")
    setAlunos(alunosSalvos)
  }

  const alunosFiltrados = alunos.filter(
    (aluno: any) =>
      aluno.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      aluno.horario.toLowerCase().includes(filtro.toLowerCase()) ||
      aluno.cpf.includes(filtro),
  )

  const editarAluno = (aluno: any) => {
    setAlunoEditando(aluno)
    setDialogAberto(true)
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

  const salvarEdicao = () => {
    if (!alunoEditando) return

    // Validações
    const cpfLimpo = alunoEditando.cpf.replace(/\D/g, "")
    if (cpfLimpo.length !== 11 || !/^\d+$/.test(cpfLimpo)) {
      toast({
        title: "Erro",
        description: "CPF deve conter exatamente 11 dígitos numéricos.",
        variant: "destructive",
      })
      return
    }

    const rgLimpo = alunoEditando.rg.replace(/\D/g, "")
    if (rgLimpo.length > 9 || !/^\d+$/.test(rgLimpo)) {
      toast({
        title: "Erro",
        description: "RG deve conter até 9 dígitos numéricos.",
        variant: "destructive",
      })
      return
    }

    const contatoLimpo = alunoEditando.contato?.replace(/\D/g, "") || ""
    if (contatoLimpo.length !== 11 || !/^\d+$/.test(contatoLimpo)) {
      toast({
        title: "Erro",
        description: "Contato deve conter exatamente 11 dígitos numéricos (incluindo DDD).",
        variant: "destructive",
      })
      return
    }

    const contatoEmergenciaLimpo = alunoEditando.contatoEmergencia?.replace(/\D/g, "") || ""
    if (contatoEmergenciaLimpo.length !== 11 || !/^\d+$/.test(contatoEmergenciaLimpo)) {
      toast({
        title: "Erro",
        description: "Contato de emergência deve conter exatamente 11 dígitos numéricos (incluindo DDD).",
        variant: "destructive",
      })
      return
    }

    if (alunoEditando.menorDe18) {
      if (!alunoEditando.responsavelLegal || !alunoEditando.parentesco || !alunoEditando.contatoResponsavel) {
        toast({
          title: "Erro",
          description: "Todos os campos do responsável legal devem ser preenchidos para menores de 18 anos.",
          variant: "destructive",
        })
        return
      }

      const contatoResponsavelLimpo = alunoEditando.contatoResponsavel.replace(/\D/g, "")
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
    if (alunoEditando.usaMedicamento && !alunoEditando.qualMedicamento?.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe qual medicamento é utilizado.",
        variant: "destructive",
      })
      return
    }

    if (alunoEditando.possuiDoenca && !alunoEditando.qualDoenca?.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe qual doença o aluno possui.",
        variant: "destructive",
      })
      return
    }

    // Formatar os dados para salvar
    const dadosFormatados = {
      ...alunoEditando,
      cpf: cpfLimpo,
      rg: rgLimpo,
      contato: contatoLimpo,
      contatoEmergencia: contatoEmergenciaLimpo,
      contatoResponsavel: alunoEditando.menorDe18 ? alunoEditando.contatoResponsavel.replace(/\D/g, "") : "",
    }

    const alunosAtualizados = alunos.map((c: any) => (c.id === dadosFormatados.id ? dadosFormatados : c))

    localStorage.setItem("alunos", JSON.stringify(alunosAtualizados))
    setAlunos(alunosAtualizados)

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Edição de Aluno",
      detalhes: `Aluno ${alunoEditando.nome} foi editado`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Sucesso",
      description: "Aluno atualizado com sucesso!",
    })

    setDialogAberto(false)
    setAlunoEditando(null)
  }

  const excluirAluno = (id: string) => {
    const aluno = alunos.find((c: any) => c.id === id)
    const alunosAtualizados = alunos.filter((c: any) => c.id !== id)

    localStorage.setItem("alunos", JSON.stringify(alunosAtualizados))
    setAlunos(alunosAtualizados)

    // Log da atividade
    const logs = JSON.parse(localStorage.getItem("logs") || "[]")
    logs.push({
      id: Date.now().toString(),
      acao: "Exclusão de Aluno",
      detalhes: `Aluno ${aluno?.nome} foi excluído`,
      timestamp: new Date().toISOString(),
      usuario: "Admin",
    })
    localStorage.setItem("logs", JSON.stringify(logs))

    toast({
      title: "Aluno Excluído",
      description: "Aluno removido com sucesso!",
    })
  }

  const verDetalhes = (alunoId: string) => {
    setAlunoDetalhes(alunoId)
  }

  return (
    <RoleGuard allowedRoles={["admin", "gestor_cadastro"]}>
      {alunoDetalhes ? (
        <AlunoDetailScreen alunoId={alunoDetalhes} onBack={() => setAlunoDetalhes(null)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
            <CardDescription>Gerencie os alunos cadastrados na academia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, horário ou CPF..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="space-y-3">
                {alunosFiltrados.map((aluno: any) => (
                  <div key={aluno.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{aluno.nome}</h3>
                      <p className="text-sm text-gray-600">
                        CPF: {aluno.cpf} | RG: {aluno.rg}
                      </p>
                      <p className="text-sm text-gray-600">Endereço: {aluno.endereco}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{aluno.horario}</Badge>
                        {aluno.menorDe18 && <Badge variant="secondary">Menor de 18 anos</Badge>}
                        {aluno.observacoes && <Badge variant="secondary">Com observações</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => verDetalhes(aluno.id)}>
                        <User className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => editarAluno(aluno)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => excluirAluno(aluno.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {alunosFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filtro ? "Nenhum aluno encontrado com os filtros aplicados." : "Nenhum aluno cadastrado ainda."}
                </div>
              )}
            </div>
          </CardContent>

          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Aluno</DialogTitle>
                <DialogDescription>Faça as alterações necessárias nos dados do aluno.</DialogDescription>
              </DialogHeader>
              {alunoEditando && (
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-nome">Nome Completo</Label>
                      <Input
                        id="edit-nome"
                        value={alunoEditando.nome}
                        onChange={(e) => setAlunoEditando({ ...alunoEditando, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cpf">CPF</Label>
                      <Input
                        id="edit-cpf"
                        value={alunoEditando.cpf}
                        onChange={(e) => setAlunoEditando({ ...alunoEditando, cpf: formatarCPF(e.target.value) })}
                        maxLength={14}
                      />
                      <p className="text-xs text-gray-500">Apenas números, 11 dígitos</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-rg">RG</Label>
                      <Input
                        id="edit-rg"
                        value={alunoEditando.rg}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 9) {
                            setAlunoEditando({ ...alunoEditando, rg: value })
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">Apenas números, até 9 dígitos</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contato">Contato (Telefone Pessoal)</Label>
                      <Input
                        id="edit-contato"
                        placeholder="(00) 00000-0000"
                        value={alunoEditando.contato || ""}
                        onChange={(e) =>
                          setAlunoEditando({ ...alunoEditando, contato: formatarTelefone(e.target.value) })
                        }
                        maxLength={16}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contatoEmergencia">Contato de Emergência</Label>
                      <Input
                        id="edit-contatoEmergencia"
                        placeholder="(00) 00000-0000"
                        value={alunoEditando.contatoEmergencia || ""}
                        onChange={(e) =>
                          setAlunoEditando({ ...alunoEditando, contatoEmergencia: formatarTelefone(e.target.value) })
                        }
                        maxLength={16}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-nomePai">Nome do Pai</Label>
                      <Input
                        id="edit-nomePai"
                        value={alunoEditando.nomePai || ""}
                        onChange={(e) => setAlunoEditando({ ...alunoEditando, nomePai: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-nomeMae">Nome da Mãe</Label>
                      <Input
                        id="edit-nomeMae"
                        value={alunoEditando.nomeMae || ""}
                        onChange={(e) => setAlunoEditando({ ...alunoEditando, nomeMae: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-endereco">Endereço</Label>
                      <Input
                        id="edit-endereco"
                        value={alunoEditando.endereco}
                        onChange={(e) => setAlunoEditando({ ...alunoEditando, endereco: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-horario">Horário</Label>
                      <Select
                        value={alunoEditando.horario}
                        onValueChange={(value) => setAlunoEditando({ ...alunoEditando, horario: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {horarios.map((horario) => (
                            <SelectItem key={horario} value={horario}>
                              {horario}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id="edit-menorDe18"
                      checked={alunoEditando.menorDe18 || false}
                      onCheckedChange={(checked) => {
                        setAlunoEditando({
                          ...alunoEditando,
                          menorDe18: checked === true,
                          // Limpar campos do responsável se desmarcar
                          responsavelLegal: checked === true ? alunoEditando.responsavelLegal : "",
                          parentesco: checked === true ? alunoEditando.parentesco : "",
                          contatoResponsavel: checked === true ? alunoEditando.contatoResponsavel : "",
                        })
                      }}
                    />
                    <Label htmlFor="edit-menorDe18" className="font-medium">
                      Menor de 18 anos?
                    </Label>
                  </div>

                  {alunoEditando.menorDe18 && (
                    <div className="border p-4 rounded-md bg-gray-50 space-y-4">
                      <h3 className="font-medium">Informações do Responsável Legal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-responsavelLegal">Nome do Responsável Legal</Label>
                          <Input
                            id="edit-responsavelLegal"
                            placeholder="Digite o nome do responsável"
                            value={alunoEditando.responsavelLegal || ""}
                            onChange={(e) => setAlunoEditando({ ...alunoEditando, responsavelLegal: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-parentesco">Parentesco</Label>
                          <Select
                            value={alunoEditando.parentesco || ""}
                            onValueChange={(value) => setAlunoEditando({ ...alunoEditando, parentesco: value })}
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
                          <Label htmlFor="edit-contatoResponsavel">Contato do Responsável</Label>
                          <Input
                            id="edit-contatoResponsavel"
                            placeholder="(00) 00000-0000"
                            value={alunoEditando.contatoResponsavel || ""}
                            onChange={(e) =>
                              setAlunoEditando({
                                ...alunoEditando,
                                contatoResponsavel: formatarTelefone(e.target.value),
                              })
                            }
                            maxLength={16}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id="edit-usaMedicamento"
                        checked={alunoEditando.usaMedicamento || false}
                        onCheckedChange={(checked) => {
                          setAlunoEditando({
                            ...alunoEditando,
                            usaMedicamento: checked === true,
                            qualMedicamento: checked === true ? alunoEditando.qualMedicamento : "",
                          })
                        }}
                      />
                      <Label htmlFor="edit-usaMedicamento" className="font-medium">
                        Faz uso de algum medicamento?
                      </Label>
                    </div>

                    {alunoEditando.usaMedicamento && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="edit-qualMedicamento">Qual medicamento?</Label>
                        <Textarea
                          id="edit-qualMedicamento"
                          placeholder="Descreva o medicamento e a posologia"
                          value={alunoEditando.qualMedicamento || ""}
                          onChange={(e) => setAlunoEditando({ ...alunoEditando, qualMedicamento: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id="edit-possuiDoenca"
                        checked={alunoEditando.possuiDoenca || false}
                        onCheckedChange={(checked) => {
                          setAlunoEditando({
                            ...alunoEditando,
                            possuiDoenca: checked === true,
                            qualDoenca: checked === true ? alunoEditando.qualDoenca : "",
                          })
                        }}
                      />
                      <Label htmlFor="edit-possuiDoenca" className="font-medium">
                        Possui alguma doença?
                      </Label>
                    </div>

                    {alunoEditando.possuiDoenca && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="edit-qualDoenca">Qual doença?</Label>
                        <Textarea
                          id="edit-qualDoenca"
                          placeholder="Descreva a doença e condições relevantes"
                          value={alunoEditando.qualDoenca || ""}
                          onChange={(e) => setAlunoEditando({ ...alunoEditando, qualDoenca: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-observacoes">Observações</Label>
                    <Textarea
                      id="edit-observacoes"
                      value={alunoEditando.observacoes || ""}
                      onChange={(e) => setAlunoEditando({ ...alunoEditando, observacoes: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" onClick={salvarEdicao}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      )}
    </RoleGuard>
  )
}

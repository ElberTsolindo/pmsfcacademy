"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  tipo: "admin" | "gestor_cadastro" | "gestor_frequencia" | "cliente" | "aluno"
  cpf?: string // Para clientes
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = (email: string, password: string, cpf?: string) => {
    // Se CPF foi fornecido, é login de aluno
    if (cpf) {
      const alunos = JSON.parse(localStorage.getItem("alunos") || "[]")
      const aluno = alunos.find((c: any) => c.cpf === cpf)

      if (aluno) {
        const userData = {
          id: aluno.id,
          name: aluno.nome,
          email: aluno.cpf, // Usar CPF como email para alunos
          tipo: "aluno" as const,
          cpf: aluno.cpf,
        }
        setUser(userData)
        localStorage.setItem("currentUser", JSON.stringify(userData))
        return
      } else {
        throw new Error("CPF não encontrado")
      }
    }

    // Login para admin/gestor
    const administradores = JSON.parse(localStorage.getItem("administradores") || "[]")

    // Adicionar admin padrão se não existir
    if (administradores.length === 0) {
      const adminPadrao = {
        id: "1",
        nome: "Administrador",
        email: "admin",
        senha: "admin",
        tipo: "admin",
        ativo: true,
        dataCriacao: new Date().toISOString(),
      }
      administradores.push(adminPadrao)
      localStorage.setItem("administradores", JSON.stringify(administradores))
    }

    const admin = administradores.find((a: any) => a.email === email && a.senha === password && a.ativo)

    if (admin) {
      const userData = {
        id: admin.id,
        name: admin.nome,
        email: admin.email,
        tipo: admin.tipo || "admin", // This will now include gestor_cadastro and gestor_frequencia
      }
      setUser(userData)
      localStorage.setItem("currentUser", JSON.stringify(userData))

      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Login",
        detalhes: `${admin.nome} fez login no sistema`,
        timestamp: new Date().toISOString(),
        usuario: admin.nome,
      })
      localStorage.setItem("logs", JSON.stringify(logs))
    } else {
      throw new Error("Credenciais inválidas")
    }
  }

  const logout = () => {
    if (user) {
      // Log da atividade
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        id: Date.now().toString(),
        acao: "Logout",
        detalhes: `${user.name} fez logout do sistema`,
        timestamp: new Date().toISOString(),
        usuario: user.name,
      })
      localStorage.setItem("logs", JSON.stringify(logs))
    }

    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return { user, login, logout }
}

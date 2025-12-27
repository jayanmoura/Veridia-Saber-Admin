# Painel Administrativo Veridia Saber

Sistema de gestão para o catálogo de espécies da plataforma Veridia Saber, desenvolvido com React, TypeScript e Vite.

## 🌿 Sobre o Projeto

Este painel administrativo permite a gestão completa do banco de dados botânico da Veridia Saber, incluindo:

- **Espécies**: Cadastro, edição e visualização de espécies vegetais com informações taxonômicas, descrições e guias de cultivo
- **Famílias**: Gerenciamento de famílias botânicas
- **Projetos/Locais**: Administração de projetos vinculados
- **Usuários**: Gestão de usuários e permissões
- **Relatórios PDF**: Geração de fichas técnicas e relatórios profissionais

## 🛠️ Tecnologias

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **jsPDF** + **jspdf-autotable** - Geração de PDFs
- **Lucide React** - Ícones
- **React Router DOM** - Navegação

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase com projeto configurado

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd Painel-admin-veridiasaber
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── Dashboard/     # Cards e widgets do dashboard
│   ├── Layout/        # Sidebar, Header, etc.
│   └── Modals/        # Modais (SpeciesModal, FamilyModal, etc.)
├── contexts/          # Contextos React (AuthContext)
├── lib/               # Configurações (Supabase client)
├── pages/             # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Families.tsx
│   ├── Species.tsx
│   ├── Projects.tsx
│   └── Users.tsx
└── utils/             # Utilitários
    └── pdfGenerator.ts  # Gerador de relatórios PDF
```

## 👥 Níveis de Acesso

| Função | Permissões |
|--------|------------|
| **Curador Mestre** | Acesso total ao sistema |
| **Coordenador Científico** | Acesso total ao sistema |
| **Gestor de Acervo** | Gerencia dados do seu projeto |
| **Taxonomista** | Visualização e edição de espécies |
| **Consulente** | Apenas visualização |

## 📊 Funcionalidades de Relatório

- **Relatório Geral de Espécies**: Lista completa com gráfico de distribuição por família
- **Ficha Técnica Individual**: PDF estilo revista/catálogo com imagem destaque
- **Relatório de Famílias**: Exportação da lista de famílias botânicas

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Compila para produção
npm run preview  # Visualiza build de produção
npm run lint     # Executa linter
```

## 📝 Licença

Projeto proprietário - Veridia Saber © 2024

# Dossiê Técnico: Veridia Saber
**Sistema de Gestão Inteligente para Acervos Botânicos**

> *Este documento apresenta uma visão detalhada das capacidades, arquitetura e diferenciais do sistema Veridia Saber.*

---

## 1. Visão Geral

O **Veridia Saber** é uma plataforma tecnológica avançada desenvolvida para transformar a maneira como dados botânicos são coletados, gerenciados e preservados. Criado para atender desde grandes instituições de pesquisa até catalogadores independentes, o sistema resolve o maior gargalo da pesquisa de campo: a desconexão entre a coleta física e o registro digital.

Sua arquitetura **"Offline-First"** garante que o trabalho de campo nunca pare, independentemente da conexão com a internet, enquanto sua estrutura de dados robusta assegura a integridade científica das informações taxonômicas.

### Público-Alvo
*   Jardins Botânicos e Herbários
*   Consultorias Ambientais e Florestais
*   Universidades e Institutos de Pesquisa
*   Gestores de Áreas de Conservação (RPPNs, Parques)

---

## 2. Diferenciais Tecnológicos

O que distingue o Veridia Saber de planilhas e formulários genéricos é sua engenharia de software especializada:

### Arquitetura Offline-First Real
Diferente de apps que apenas "guardam cache", o Veridia Saber possui um banco de dados completo embarcado no dispositivo.
*   **Funcionamento Autônomo:** O pesquisador pode passar semanas em campo sem internet.
*   **Sincronização Inteligente:** Ao detectar conexão, o sistema sincroniza os dados com a nuvem automaticamente, resolvendo conflitos de edição.
*   **Segurança de Dados:** Os dados nunca são perdidos por falha de rede.

### Taxonomia Dinâmica
Gestão rigorosa da árvore da vida.
*   **Banco de Dados Hierárquico:** Famílias, Gêneros e Espécies são entidades relacionais, não apenas "texto solto".
*   **Aprendizado do Sistema:** O sistema permite a criação de novas famílias taxonômicas, que se tornam ativos de conhecimento para toda a coleção.
*   **Auto-Correção:** Funcionalidades inteligentes que vinculam automaticamente plantas antigas a novas famílias cadastradas.

### Segurança e Conformidade (LGPD)
Uma plataforma pronta para o ambiente corporativo e governamental.
*   **Privacidade Integrada:** Termos de Uso e Políticas de Privacidade ativos e conformes com a LGPD.
*   **Criptografia de Ponta-a-Ponta:** Dados criptografados em trânsito (TLS) e autenticação segura (Bcrypt), sem armazenamento de senhas visíveis.
*   **Gestão de Acesso (RBAC):** Controle granular de permissões (Administradores Globais, Gestores Locais, Pesquisadores).

---

## 3. Funcionalidades Principais

### A. Coleta e Catalogação
*   **Ficha de Campo Digital:** Substitui pranchetas por formulários otimizados para mobile.
*   **Georreferenciamento Preciso:** Coleta automática de coordenadas GPS para cada espécime.
*   **Galeria Fotográfica:** Associação direta de múltiplas fotos a cada planta catalogada.
*   **Anotações de Campo:** Espaço para observações morfológicas e ambientais detalhadas.

### B. Gestão de Coleções
*   **Múltiplas Coleções:** Um usuário pode gerenciar diversos projetos ou áreas de estudo simultaneamente.
*   **Cards Informativos:** Visualização rápida com fotos de capa e contagem de espécimes.
*   **Busca e Filtros:** Localização rápida de plantas por nome popular, científico ou família.

### C. Navegação e Mapas (Roadmap)
*   **Mapeamento de Espécimes:** Visualização da distribuição das plantas no mapa.
*   **Mapas Offline:** Capacidade de baixar regiões para navegação em áreas remotas.

### D. Integração e Sincronização
*   **Sync Bidirecional:** O que é feito no escritório aparece no campo, e vice-versa.
*   **Indicadores de Status:** O usuário sempre sabe se seus dados estão salvos na nuvem ou pendentes.

---

## 4. Arquitetura do Sistema

Construído com tecnologias modernas validadas por grandes empresas de tecnologia (Meta, Airbnb, Walmart).

*   **Core Mobile:** React Native (Performance nativa para Android e iOS).
*   **Backend:** Supabase (Infraestrutura escalável baseada em PostgreSQL).
*   **Banco Local:** SQLite (O banco de dados mais utilizado no mundo, rodando dentro do app).
*   **Design System:** Interface polida, intuitiva e responsiva.

---

## 5. Por que escolher o Veridia Saber?

1.  **Produtividade:** Reduz em até 70% o tempo de "digitalização" pós-campo.
2.  **Confiabilidade:** Elimina erros de transcrição de papel para computador.
3.  **Padronização:** Garante que toda a equipe colete dados no mesmo formato taxonômico.
4.  **Valor:** Uma solução completa que custaria centenas de milhares de reais para ser desenvolvida internamente, disponível pronta para uso.

---

## 6. Instruções para Implementação do Painel Admin (Web)

> **Nota para a Equipe de Desenvolvimento Web:**
> Este documento descreve as funcionalidades nucleares do sistema Mobile. O Painel Administrativo Web deve ser desenvolvido para gerenciar e visualizar esses dados de forma centralizada.

**Módulos Obrigatórios no Admin:**

1.  **Dashboard de Métricas:**
    *   Total de usuários, coleções e plantas cadastradas.
    *   Gráficos de atividade recente (uploads por dia).

2.  **Gestão de Usuários e Permissões:**
    *   Interface para promover usuários a Administradores/Modificadores.
    *   Bloqueio e desbloqueio de acesso.

3.  **Gestão Taxonômica Centralizada:**
    *   Ferramenta para cadastrar, editar e excluir Famílias e Espécies do banco global.
    *   Sistema para verificar e aprovar "Novas Famílias" criadas pelos usuários em campo.

4.  **Mapa de Calor Global:**
    *   Visualização de todas as coletas realizadas no mapa mundial.
    *   Filtros por região e família botânica.

5.  **Relatórios e Exportação:**
    *   Capacidade de exportar dados de coleções para CSV/PDF formatado.
    *   Geração de etiquetas de herbário padrão.

---

> *Documento confidencial. Propriedade intelectual protegida.*

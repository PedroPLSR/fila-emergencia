# Feature Specification: Fila de Emergência para Coleta e Exame de Sangue

**Feature Branch**: `001-fila-emergencia-sangue`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Cenário Posto de Coleta e Exame de Sangue Emergencial no Castelão — estrutura temporária de alta vazão com filas por tipo de exame, priorização médica, rastreabilidade de amostras, reinício diário da numeração e simulação operacional com interface tipo totem; armazenamento de atendimentos e monitoramento de logs. Fontes: assets/contexto-inicial.md e assets/solucao.md."

## Clarifications

### Session 2026-08-04

- Q: Quem pode emitir senhas, priorizar atendimentos e chamar o próximo na simulação? → A: Totem público (emitir + consultar) e painel da equipe (priorizar, chamar, status), sem login formal
- Q: Quantos níveis de prioridade a fila deve ter na simulação? → A: Dois níveis: rotina e urgente
- Q: O que acontece com quem ainda está aguardando quando o dia operacional reinicia a numeração? → A: Quem ainda aguarda fica no dia anterior (fora da fila ativa do novo dia); equipe conclui/cancela manualmente
- Q: Quais dados mínimos o doador/paciente deve informar no totem para emitir a senha? → A: Nome completo + documento (CPF ou RG)
- Q: Como o reinício do dia operacional (nova numeração das senhas) deve ser disparado na simulação? → A: Manual: comando “encerrar/abrir dia” no painel da equipe

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir senha e entrar na fila por tipo de exame (Priority: P1)

Uma pessoa (doador/paciente) chega ao posto emergencial no Castelão e, no **totem público**, escolhe o tipo de exame/coleta desejado. O sistema emite um número de senha na fila correspondente, registra o atendimento e orienta a pessoa a aguardar a chamada. O totem não expõe ações de priorizar ou chamar o próximo.

**Why this priority**: Sem emissão de senha e organização por tipo de exame, o volume concentrado gera aglomeração e perde-se o controle básico do fluxo — este é o MVP mínimo viável da simulação.

**Independent Test**: Pode ser testado emitindo senhas para um ou mais tipos de exame e verificando que cada senha entra na fila correta, com numeração sequencial do dia.

**Acceptance Scenarios**:

1. **Given** o posto está em operação no dia corrente, **When** o doador/paciente informa nome completo e documento, seleciona um tipo de exame no totem e confirma, **Then** o sistema emite um número de senha único para aquele tipo de exame naquele dia e registra o atendimento na fila correspondente.
2. **Given** já existem senhas emitidas para o mesmo tipo de exame no dia, **When** uma nova senha é emitida, **Then** o número segue a sequência do dia para aquele tipo (não reutiliza números já emitidos no mesmo dia/tipo).
3. **Given** o usuário está no totem, **When** visualiza as opções, **Then** consegue distinguir claramente os tipos de exame/coleta disponíveis e emitir senha sem assistência obrigatória.
4. **Given** nome completo ou documento não foram preenchidos, **When** o usuário tenta emitir senha, **Then** o sistema bloqueia a emissão e indica os campos obrigatórios faltantes.

---

### User Story 2 - Priorizar atendimento médico em tempo real (Priority: P1)

Durante a espera, a equipe identifica doador ou paciente com sintomas graves ou necessidade clínica urgente. No **painel da equipe** (sem login formal), um operador eleva o atendimento de **rotina** para **urgente**, de modo que a pessoa seja chamada antes dos casos de rotina, sem perder a rastreabilidade da senha.

**Why this priority**: Priorização médica é requisito explícito do cenário emergencial e impacto direto em segurança do paciente; sem isso a fila seria apenas ordenação FIFO inadequada ao contexto.

**Independent Test**: Pode ser testado criando atendimentos normais e um com prioridade elevada e verificando que a ordem de chamada respeita a prioridade antes da ordem de chegada.

**Acceptance Scenarios**:

1. **Given** existem pessoas aguardando na mesma fila de tipo de exame, **When** um operador marca um atendimento como **urgente**, **Then** esse atendimento passa a ser chamado antes dos de **rotina** da mesma fila.
2. **Given** dois ou mais atendimentos **urgentes** na mesma fila, **When** o próximo é chamado, **Then** a ordem entre urgentes respeita a sequência de chegada (FIFO dentro do mesmo nível).
3. **Given** um atendimento já foi marcado como urgente, **When** o operador consulta a fila, **Then** o nível **urgente** aparece de forma visível e inequívoca na listagem.

---

### User Story 3 - Chamar próximo da fila e acompanhar status do atendimento (Priority: P2)

No **painel da equipe**, a equipe visualiza a fila do tipo de exame sob sua responsabilidade, chama o próximo (respeitando prioridades) e atualiza o status do atendimento (aguardando, chamado, em atendimento, concluído, inapto, etc.), permitindo monitoramento do fluxo em tempo real.

**Why this priority**: Fecha o ciclo operacional da fila; sem chamada e status, a emissão de senha não reduz aglomeração nem organiza o posto.

**Independent Test**: Pode ser testado emitindo senhas, priorizando uma, chamando a próxima e confirmando que o status e a ordem exibida batem com as regras de prioridade.

**Acceptance Scenarios**:

1. **Given** há atendimentos aguardando em uma fila, **When** o operador solicita o próximo, **Then** o sistema apresenta o atendimento correto segundo as regras de prioridade e ordem.
2. **Given** um atendimento foi chamado, **When** o operador inicia ou conclui o atendimento, **Then** o status é atualizado e deixa de competir como “próximo” da fila de espera.
3. **Given** a equipe monitora o posto, **When** consulta a visão da fila, **Then** vê quantidade aguardando, próximos a chamar e indicações de prioridade sem ambiguidade.

---

### User Story 4 - Reinício diário da numeração das filas (Priority: P2)

No **painel da equipe**, um operador dispara o comando de **encerrar/abrir dia**. As filas reiniciam a numeração de senhas por tipo de exame, preservando o histórico dos atendimentos do dia anterior para consulta e auditoria. Atendimentos ainda em espera no dia encerrado não migram para a fila ativa do novo dia.

**Why this priority**: Comportamento explícito da solução desejada; evita numeração infinita e alinha a operação a turnos diários de eventos/campanhas.

**Independent Test**: Pode ser testado emitindo senhas, executando o comando de encerrar/abrir dia e confirmando que a numeração recomeça e o histórico anterior permanece acessível.

**Acceptance Scenarios**:

1. **Given** o operador executa o comando de encerrar/abrir dia no painel da equipe, **When** a primeira senha do novo dia é emitida para um tipo de exame, **Then** a numeração recomeça a partir do início para aquele tipo.
2. **Given** existiam atendimentos no dia anterior, **When** um operador consulta o histórico, **Then** os registros do dia anterior permanecem disponíveis e distintos do dia corrente.
3. **Given** havia atendimentos ainda aguardando no dia que foi encerrado, **When** o novo dia começa, **Then** esses atendimentos **não** entram na fila ativa do novo dia; permanecem associados ao dia anterior para a equipe concluir ou cancelar manualmente.
4. **Given** o dia corrente ainda não foi encerrado via comando, **When** novas senhas são emitidas, **Then** a numeração continua a sequência do dia operacional atual (sem reinício automático por calendário).

---

### User Story 5 - Rastreabilidade do atendimento e da identificação do doador/paciente (Priority: P2)

Cada atendimento mantém identificação estável do doador/paciente ligada à senha e ao tipo de exame, de forma que a equipe possa acompanhar o fluxo desde o cadastro até a conclusão sem risco de troca de identidade no contexto da simulação.

**Why this priority**: O contexto exige identificação inviolável da amostra/doador; na simulação, a rastreabilidade do atendimento é o correspondente operacional mínimo.

**Independent Test**: Pode ser testado cadastrando um atendimento, consultando-o por senha/identificador e verificando que os dados de identificação e status permanecem consistentes ao longo das mudanças de status.

**Acceptance Scenarios**:

1. **Given** um atendimento foi criado no totem, **When** a equipe consulta pelo número da senha (e tipo/dia), **Then** recupera os dados de identificação e o status atual sem ambiguidade.
2. **Given** o atendimento muda de status (chamado, em coleta, concluído), **When** qualquer consulta posterior é feita, **Then** o vínculo entre pessoa, senha e tipo de exame permanece intacto.

---

### User Story 6 - Comunicar resultado ou aptidão ao doador/paciente (Priority: P3)

Após o processamento do atendimento (apto/inapto ou resultado disponível na simulação), o doador/paciente consulta a informação no **totem público** (por senha/identificador), sem depender apenas de comunicação verbal no posto.

**Why this priority**: Está no contexto operacional, mas pode ser entregue após o núcleo de fila/prioridade/chamada na simulação.

**Independent Test**: Pode ser testado concluindo um atendimento com resultado e verificando que o interessado consegue visualizar a informação correspondente.

**Acceptance Scenarios**:

1. **Given** um atendimento teve resultado/aptidão registrado pela equipe, **When** o doador/paciente consulta o status, **Then** visualiza a informação de aptidão ou resultado associado ao seu atendimento.
2. **Given** o resultado ainda não foi registrado, **When** o interessado consulta, **Then** recebe indicação clara de que o resultado ainda não está disponível.

---

### User Story 7 - Monitorar logs e histórico de operações do sistema (Priority: P3)

No **painel da equipe**, operadores ou responsáveis pela simulação consultam registros de eventos do sistema (emissão de senha, mudança de prioridade, chamada, alteração de status, encerrar/abrir dia) para auditar o comportamento da fila e diagnosticar falhas na demonstração.

**Why this priority**: Exigência explícita da solução (monitoramento de logs); suporte à confiabilidade da simulação, sem bloquear o fluxo principal de atendimento.

**Independent Test**: Pode ser testado executando ações na fila e confirmando que cada ação relevante aparece no histórico de logs com horário e descrição compreensível.

**Acceptance Scenarios**:

1. **Given** ações operacionais foram realizadas (emitir, priorizar, chamar, concluir), **When** o responsável abre o monitoramento de logs, **Then** encontra entradas correspondentes a essas ações em ordem temporal.
2. **Given** o comando de encerrar/abrir dia foi executado, **When** os logs são consultados, **Then** o evento de encerrar/abrir dia está registrado de forma identificável.

---

### Edge Cases

- O que acontece quando não há ninguém aguardando e o operador solicita o próximo da fila?
- Como o sistema trata tentativa de emitir senha para um tipo de exame indisponível ou inexistente?
- O que ocorre se o operador tentar priorizar ou alterar status de um atendimento já concluído?
- Na virada do dia, atendimentos ainda aguardando permanecem no dia anterior e fora da fila ativa do novo dia; a equipe deve concluir ou cancelar manualmente esses casos.
- O que acontece se duas estações/operadores tentam chamar o “próximo” da mesma fila ao mesmo tempo?
- Como o sistema lida com identificação incompleta no totem: emissão é bloqueada até nome completo e documento (CPF ou RG) estarem preenchidos.
- O que é exibido ao doador/paciente quando consulta um número de senha inválido ou de outro dia?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir a emissão de senha de atendimento associada a um tipo de exame/coleta selecionado pelo doador/paciente no **totem público** (simples, legível e orientado a autoatendimento ou atendimento rápido), exigindo no mínimo **nome completo** e **documento** (CPF ou RG) antes de emitir a senha.
- **FR-002**: O sistema MUST manter filas distintas por tipo de exame/coleta, cada uma com sua própria numeração de senhas no dia operacional.
- **FR-003**: O sistema MUST permitir, no **painel da equipe**, um comando explícito de **encerrar/abrir dia** que reinicia a numeração das senhas por tipo de exame; o reinício MUST NOT ocorrer automaticamente por meia-noite/calendário; o histórico dos dias anteriores MUST ser preservado; atendimentos ainda em espera no dia encerrado MUST permanecer vinculados a esse dia e MUST NOT entrar na fila ativa do novo dia (conclusão ou cancelamento manual pela equipe).
- **FR-004**: O sistema MUST permitir, no **painel da equipe**, atribuição e alteração do nível de prioridade de atendimentos em espera entre exatamente dois valores: **rotina** e **urgente**; atendimentos urgentes MUST ser chamados antes dos de rotina na mesma fila.
- **FR-005**: O sistema MUST determinar o próximo atendimento a ser chamado chamando primeiro todos os **urgentes** (FIFO entre si) e, em seguida, os de **rotina** (FIFO entre si).
- **FR-006**: O sistema MUST permitir que operadores no **painel da equipe** atualizem o status do atendimento ao longo do fluxo (no mínimo: aguardando, chamado, em atendimento, concluído; e estados de aptidão quando aplicável).
- **FR-007**: O sistema MUST registrar e persistir todos os atendimentos da fila de emergência (identificação, tipo de exame, senha do dia, prioridade, status, timestamps relevantes).
- **FR-008**: O sistema MUST garantir rastreabilidade: cada atendimento permanece univocamente ligado à identificação do doador/paciente (nome completo + documento) e à senha emitida durante todo o ciclo de vida do registro.
- **FR-009**: O sistema MUST impedir que um mesmo número de senha seja reutilizado no mesmo dia e tipo de exame.
- **FR-010**: O sistema MUST permitir consulta do status/resultado do atendimento pelo interessado no **totem público** (por senha e/ou identificador), incluindo indicação quando o resultado ainda não estiver disponível.
- **FR-011**: O sistema MUST registrar logs de operações relevantes (emissão, priorização, chamada, mudança de status, encerrar/abrir dia) consultáveis no **painel da equipe** para monitoramento e auditoria da simulação.
- **FR-012**: O sistema MUST apresentar no **painel da equipe** visão operacional das filas (quantidade aguardando, próximos, indicadores de prioridade) adequada ao contexto de posto emergencial de alta vazão.
- **FR-013**: O sistema MUST tratar de forma segura e clara situações sem próximo atendimento, senha inválida e tentativas de alterar atendimentos em estado final (mensagem compreensível, sem corromper a fila).
- **FR-014**: A solução MUST ser entregue como simulação operacional do posto (demonstrável ponta a ponta), não como integração com sistemas hospitalares reais externos.
- **FR-015**: O sistema MUST separar claramente as superfícies de uso: o totem público restringe-se a emitir senha e consultar status/resultado; o painel da equipe concentra priorizar, chamar próximo, atualizar status, encerrar/abrir dia e consultar logs — sem exigir login formal na simulação.
- **FR-016**: O sistema MUST recusar a emissão de senha quando nome completo ou documento estiverem ausentes, indicando claramente os campos obrigatórios.

### Key Entities

- **Tipo de Exame/Coleta**: Categoria de atendimento que possui fila própria (ex.: triagem, coleta de sangue, exame específico da campanha).
- **Atendimento (Senha)**: Registro de uma pessoa na fila de um tipo de exame em um dia; inclui número do dia, prioridade, status e vínculo de identificação.
- **Doador/Paciente**: Pessoa atendida no posto; identificada por **nome completo** e **documento** (CPF ou RG) para rastrear o atendimento na simulação.
- **Prioridade**: Nível binário do atendimento — **rotina** (padrão na emissão) ou **urgente** (elevado pela equipe) — que determina a ordem de chamada.
- **Dia Operacional**: Janela delimitada pelo comando de **encerrar/abrir dia** no painel da equipe; define a numeração das senhas e o reinício das filas (sem virada automática por calendário).
- **Evento de Log**: Registro imutável (para fins da simulação) de uma ação relevante do sistema, com momento e descrição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue emitir senha no totem e obter confirmação do número e tipo de exame em menos de 1 minuto no fluxo feliz.
- **SC-002**: Em cenário simulado com pelo menos 50 atendimentos e múltiplos tipos de exame, 100% das senhas ficam na fila correta do tipo escolhido.
- **SC-003**: Em testes com mistura de urgentes e rotina, 100% das chamadas respeitam a regra “urgente antes de rotina”, e dentro do mesmo nível a ordem é FIFO.
- **SC-004**: Após o comando de encerrar/abrir dia, a primeira senha de cada tipo recomeça a numeração; o histórico do dia anterior permanece consultável; e 100% dos atendimentos que ainda aguardavam no dia encerrado ficam fora da fila ativa do novo dia.
- **SC-005**: Em amostragem de auditoria, 100% dos atendimentos testados mantêm vínculo íntegro entre identificação, senha, tipo e status atual.
- **SC-006**: Operadores conseguem identificar o próximo a chamar e a quantidade aguardando por fila sem treinamento formal além de um roteiro curto de demonstração.
- **SC-007**: Pelo menos 90% das ações operacionais críticas executadas em um roteiro de demonstração aparecem corretamente nos logs consultáveis.
- **SC-008**: Doador/paciente consegue consultar status ou resultado do próprio atendimento em menos de 2 minutos após o registro do resultado pela equipe (na simulação).

## Assumptions

- O escopo é uma **simulação demonstrável** do posto emergencial (evento/campanha no Castelão), não a operação clínica real com integração a laboratórios externos ou sistemas de saúde públicos.
- Existem duas superfícies: **totem público** (emitir senha + consultar status/resultado) e **painel da equipe** (priorizar, chamar, atualizar status, logs), sem login formal na simulação.
- A interface do totem é simples (tela clara, poucas ações), inspirada em totens de emergência hospitalar.
- Existirá um conjunto inicial configurável de **tipos de exame/coleta**; a lista exata pode ser definida na implementação com valores de demonstração.
- A identificação do doador/paciente na emissão exige **nome completo** e **documento** (CPF ou RG); demais dados cadastrais estão fora do mínimo obrigatório.
- Prioridade médica na simulação usa exatamente **dois níveis**: rotina (padrão) e urgente (elevado no painel da equipe).
- O reinício do dia operacional é **manual**, via comando “encerrar/abrir dia” no painel da equipe (sem reinício automático à meia-noite).
- Na virada do dia, quem ainda aguarda permanece no dia anterior (fora da fila ativa); a equipe conclui ou cancela esses atendimentos manualmente.
- Notificação “no dispositivo móvel” do contexto original é atendida na simulação por **consulta de status/resultado** acessível ao interessado; envio push real é opcional e fora do núcleo obrigatório.
- Monitoramento de logs cobre eventos de negócio da fila; retenção segue prática padrão de demonstração (disponível durante o período de uso da simulação).
- Volume “centenas de pessoas” do contexto é tratado como meta de desenho operacional da simulação (capacidade de registrar e ordenar muitos atendimentos), não como teste de carga de infraestrutura em produção.
- Fora de escopo inicial: integração com equipamentos de laboratório, impressão física obrigatória de etiquetas de tubo, autenticação corporativa complexa e multi-tenant de vários estádios.

<!-- CI demo: altera��o s� em spec.md para for�ar falha da Action -->


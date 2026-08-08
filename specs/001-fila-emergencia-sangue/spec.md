# Feature Specification: Fila de EmergÃªncia para Coleta e Exame de Sangue

**Feature Branch**: `001-fila-emergencia-sangue`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "CenÃ¡rio Posto de Coleta e Exame de Sangue Emergencial no CastelÃ£o â estrutura temporÃ¡ria de alta vazÃ£o com filas por tipo de exame, priorizaÃ§Ã£o mÃ©dica, rastreabilidade de amostras, reinÃ­cio diÃ¡rio da numeraÃ§Ã£o e simulaÃ§Ã£o operacional com interface tipo totem; armazenamento de atendimentos e monitoramento de logs. Fontes: assets/contexto-inicial.md e assets/solucao.md."

## Clarifications

### Session 2026-08-04

- Q: Quem pode emitir senhas, priorizar atendimentos e chamar o prÃ³ximo na simulaÃ§Ã£o? â A: Totem pÃºblico (emitir + consultar) e painel da equipe (priorizar, chamar, status), sem login formal
- Q: Quantos nÃ­veis de prioridade a fila deve ter na simulaÃ§Ã£o? â A: Dois nÃ­veis: rotina e urgente
- Q: O que acontece com quem ainda estÃ¡ aguardando quando o dia operacional reinicia a numeraÃ§Ã£o? â A: Quem ainda aguarda fica no dia anterior (fora da fila ativa do novo dia); equipe conclui/cancela manualmente
- Q: Quais dados mÃ­nimos o doador/paciente deve informar no totem para emitir a senha? â A: Nome completo + documento (CPF ou RG)
- Q: Como o reinÃ­cio do dia operacional (nova numeraÃ§Ã£o das senhas) deve ser disparado na simulaÃ§Ã£o? â A: Manual: comando âencerrar/abrir diaâ no painel da equipe

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir senha e entrar na fila por tipo de exame (Priority: P1)

Uma pessoa (doador/paciente) chega ao posto emergencial no CastelÃ£o e, no **totem pÃºblico**, escolhe o tipo de exame/coleta desejado. O sistema emite um nÃºmero de senha na fila correspondente, registra o atendimento e orienta a pessoa a aguardar a chamada. O totem nÃ£o expÃµe aÃ§Ãµes de priorizar ou chamar o prÃ³ximo.

**Why this priority**: Sem emissÃ£o de senha e organizaÃ§Ã£o por tipo de exame, o volume concentrado gera aglomeraÃ§Ã£o e perde-se o controle bÃ¡sico do fluxo â este Ã© o MVP mÃ­nimo viÃ¡vel da simulaÃ§Ã£o.

**Independent Test**: Pode ser testado emitindo senhas para um ou mais tipos de exame e verificando que cada senha entra na fila correta, com numeraÃ§Ã£o sequencial do dia.

**Acceptance Scenarios**:

1. **Given** o posto estÃ¡ em operaÃ§Ã£o no dia corrente, **When** o doador/paciente informa nome completo e documento, seleciona um tipo de exame no totem e confirma, **Then** o sistema emite um nÃºmero de senha Ãºnico para aquele tipo de exame naquele dia e registra o atendimento na fila correspondente.
2. **Given** jÃ¡ existem senhas emitidas para o mesmo tipo de exame no dia, **When** uma nova senha Ã© emitida, **Then** o nÃºmero segue a sequÃªncia do dia para aquele tipo (nÃ£o reutiliza nÃºmeros jÃ¡ emitidos no mesmo dia/tipo).
3. **Given** o usuÃ¡rio estÃ¡ no totem, **When** visualiza as opÃ§Ãµes, **Then** consegue distinguir claramente os tipos de exame/coleta disponÃ­veis e emitir senha sem assistÃªncia obrigatÃ³ria.
4. **Given** nome completo ou documento nÃ£o foram preenchidos, **When** o usuÃ¡rio tenta emitir senha, **Then** o sistema bloqueia a emissÃ£o e indica os campos obrigatÃ³rios faltantes.

---

### User Story 2 - Priorizar atendimento mÃ©dico em tempo real (Priority: P1)

Durante a espera, a equipe identifica doador ou paciente com sintomas graves ou necessidade clÃ­nica urgente. No **painel da equipe** (sem login formal), um operador eleva o atendimento de **rotina** para **urgente**, de modo que a pessoa seja chamada antes dos casos de rotina, sem perder a rastreabilidade da senha.

**Why this priority**: PriorizaÃ§Ã£o mÃ©dica Ã© requisito explÃ­cito do cenÃ¡rio emergencial e impacto direto em seguranÃ§a do paciente; sem isso a fila seria apenas ordenaÃ§Ã£o FIFO inadequada ao contexto.

**Independent Test**: Pode ser testado criando atendimentos normais e um com prioridade elevada e verificando que a ordem de chamada respeita a prioridade antes da ordem de chegada.

**Acceptance Scenarios**:

1. **Given** existem pessoas aguardando na mesma fila de tipo de exame, **When** um operador marca um atendimento como **urgente**, **Then** esse atendimento passa a ser chamado antes dos de **rotina** da mesma fila.
2. **Given** dois ou mais atendimentos **urgentes** na mesma fila, **When** o prÃ³ximo Ã© chamado, **Then** a ordem entre urgentes respeita a sequÃªncia de chegada (FIFO dentro do mesmo nÃ­vel).
3. **Given** um atendimento jÃ¡ foi marcado como urgente, **When** o operador consulta a fila, **Then** o nÃ­vel **urgente** aparece de forma visÃ­vel e inequÃ­voca na listagem.

---

### User Story 3 - Chamar prÃ³ximo da fila e acompanhar status do atendimento (Priority: P2)

No **painel da equipe**, a equipe visualiza a fila do tipo de exame sob sua responsabilidade, chama o prÃ³ximo (respeitando prioridades) e atualiza o status do atendimento (aguardando, chamado, em atendimento, concluÃ­do, inapto, etc.), permitindo monitoramento do fluxo em tempo real.

**Why this priority**: Fecha o ciclo operacional da fila; sem chamada e status, a emissÃ£o de senha nÃ£o reduz aglomeraÃ§Ã£o nem organiza o posto.

**Independent Test**: Pode ser testado emitindo senhas, priorizando uma, chamando a prÃ³xima e confirmando que o status e a ordem exibida batem com as regras de prioridade.

**Acceptance Scenarios**:

1. **Given** hÃ¡ atendimentos aguardando em uma fila, **When** o operador solicita o prÃ³ximo, **Then** o sistema apresenta o atendimento correto segundo as regras de prioridade e ordem.
2. **Given** um atendimento foi chamado, **When** o operador inicia ou conclui o atendimento, **Then** o status Ã© atualizado e deixa de competir como âprÃ³ximoâ da fila de espera.
3. **Given** a equipe monitora o posto, **When** consulta a visÃ£o da fila, **Then** vÃª quantidade aguardando, prÃ³ximos a chamar e indicaÃ§Ãµes de prioridade sem ambiguidade.

---

### User Story 4 - ReinÃ­cio diÃ¡rio da numeraÃ§Ã£o das filas (Priority: P2)

No **painel da equipe**, um operador dispara o comando de **encerrar/abrir dia**. As filas reiniciam a numeraÃ§Ã£o de senhas por tipo de exame, preservando o histÃ³rico dos atendimentos do dia anterior para consulta e auditoria. Atendimentos ainda em espera no dia encerrado nÃ£o migram para a fila ativa do novo dia.

**Why this priority**: Comportamento explÃ­cito da soluÃ§Ã£o desejada; evita numeraÃ§Ã£o infinita e alinha a operaÃ§Ã£o a turnos diÃ¡rios de eventos/campanhas.

**Independent Test**: Pode ser testado emitindo senhas, executando o comando de encerrar/abrir dia e confirmando que a numeraÃ§Ã£o recomeÃ§a e o histÃ³rico anterior permanece acessÃ­vel.

**Acceptance Scenarios**:

1. **Given** o operador executa o comando de encerrar/abrir dia no painel da equipe, **When** a primeira senha do novo dia Ã© emitida para um tipo de exame, **Then** a numeraÃ§Ã£o recomeÃ§a a partir do inÃ­cio para aquele tipo.
2. **Given** existiam atendimentos no dia anterior, **When** um operador consulta o histÃ³rico, **Then** os registros do dia anterior permanecem disponÃ­veis e distintos do dia corrente.
3. **Given** havia atendimentos ainda aguardando no dia que foi encerrado, **When** o novo dia comeÃ§a, **Then** esses atendimentos **nÃ£o** entram na fila ativa do novo dia; permanecem associados ao dia anterior para a equipe concluir ou cancelar manualmente.
4. **Given** o dia corrente ainda nÃ£o foi encerrado via comando, **When** novas senhas sÃ£o emitidas, **Then** a numeraÃ§Ã£o continua a sequÃªncia do dia operacional atual (sem reinÃ­cio automÃ¡tico por calendÃ¡rio).

---

### User Story 5 - Rastreabilidade do atendimento e da identificaÃ§Ã£o do doador/paciente (Priority: P2)

Cada atendimento mantÃ©m identificaÃ§Ã£o estÃ¡vel do doador/paciente ligada Ã  senha e ao tipo de exame, de forma que a equipe possa acompanhar o fluxo desde o cadastro atÃ© a conclusÃ£o sem risco de troca de identidade no contexto da simulaÃ§Ã£o.

**Why this priority**: O contexto exige identificaÃ§Ã£o inviolÃ¡vel da amostra/doador; na simulaÃ§Ã£o, a rastreabilidade do atendimento Ã© o correspondente operacional mÃ­nimo.

**Independent Test**: Pode ser testado cadastrando um atendimento, consultando-o por senha/identificador e verificando que os dados de identificaÃ§Ã£o e status permanecem consistentes ao longo das mudanÃ§as de status.

**Acceptance Scenarios**:

1. **Given** um atendimento foi criado no totem, **When** a equipe consulta pelo nÃºmero da senha (e tipo/dia), **Then** recupera os dados de identificaÃ§Ã£o e o status atual sem ambiguidade.
2. **Given** o atendimento muda de status (chamado, em coleta, concluÃ­do), **When** qualquer consulta posterior Ã© feita, **Then** o vÃ­nculo entre pessoa, senha e tipo de exame permanece intacto.

---

### User Story 6 - Comunicar resultado ou aptidÃ£o ao doador/paciente (Priority: P3)

ApÃ³s o processamento do atendimento (apto/inapto ou resultado disponÃ­vel na simulaÃ§Ã£o), o doador/paciente consulta a informaÃ§Ã£o no **totem pÃºblico** (por senha/identificador), sem depender apenas de comunicaÃ§Ã£o verbal no posto.

**Why this priority**: EstÃ¡ no contexto operacional, mas pode ser entregue apÃ³s o nÃºcleo de fila/prioridade/chamada na simulaÃ§Ã£o.

**Independent Test**: Pode ser testado concluindo um atendimento com resultado e verificando que o interessado consegue visualizar a informaÃ§Ã£o correspondente.

**Acceptance Scenarios**:

1. **Given** um atendimento teve resultado/aptidÃ£o registrado pela equipe, **When** o doador/paciente consulta o status, **Then** visualiza a informaÃ§Ã£o de aptidÃ£o ou resultado associado ao seu atendimento.
2. **Given** o resultado ainda nÃ£o foi registrado, **When** o interessado consulta, **Then** recebe indicaÃ§Ã£o clara de que o resultado ainda nÃ£o estÃ¡ disponÃ­vel.

---

### User Story 7 - Monitorar logs e histÃ³rico de operaÃ§Ãµes do sistema (Priority: P3)

No **painel da equipe**, operadores ou responsÃ¡veis pela simulaÃ§Ã£o consultam registros de eventos do sistema (emissÃ£o de senha, mudanÃ§a de prioridade, chamada, alteraÃ§Ã£o de status, encerrar/abrir dia) para auditar o comportamento da fila e diagnosticar falhas na demonstraÃ§Ã£o.

**Why this priority**: ExigÃªncia explÃ­cita da soluÃ§Ã£o (monitoramento de logs); suporte Ã  confiabilidade da simulaÃ§Ã£o, sem bloquear o fluxo principal de atendimento.

**Independent Test**: Pode ser testado executando aÃ§Ãµes na fila e confirmando que cada aÃ§Ã£o relevante aparece no histÃ³rico de logs com horÃ¡rio e descriÃ§Ã£o compreensÃ­vel.

**Acceptance Scenarios**:

1. **Given** aÃ§Ãµes operacionais foram realizadas (emitir, priorizar, chamar, concluir), **When** o responsÃ¡vel abre o monitoramento de logs, **Then** encontra entradas correspondentes a essas aÃ§Ãµes em ordem temporal.
2. **Given** o comando de encerrar/abrir dia foi executado, **When** os logs sÃ£o consultados, **Then** o evento de encerrar/abrir dia estÃ¡ registrado de forma identificÃ¡vel.

---

### Edge Cases

- O que acontece quando nÃ£o hÃ¡ ninguÃ©m aguardando e o operador solicita o prÃ³ximo da fila?
- Como o sistema trata tentativa de emitir senha para um tipo de exame indisponÃ­vel ou inexistente?
- O que ocorre se o operador tentar priorizar ou alterar status de um atendimento jÃ¡ concluÃ­do?
- Na virada do dia, atendimentos ainda aguardando permanecem no dia anterior e fora da fila ativa do novo dia; a equipe deve concluir ou cancelar manualmente esses casos.
- O que acontece se duas estaÃ§Ãµes/operadores tentam chamar o âprÃ³ximoâ da mesma fila ao mesmo tempo?
- Como o sistema lida com identificaÃ§Ã£o incompleta no totem: emissÃ£o Ã© bloqueada atÃ© nome completo e documento (CPF ou RG) estarem preenchidos.
- O que Ã© exibido ao doador/paciente quando consulta um nÃºmero de senha invÃ¡lido ou de outro dia?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir a emissÃ£o de senha de atendimento associada a um tipo de exame/coleta selecionado pelo doador/paciente no **totem pÃºblico** (simples, legÃ­vel e orientado a autoatendimento ou atendimento rÃ¡pido), exigindo no mÃ­nimo **nome completo** e **documento** (CPF ou RG) antes de emitir a senha.
- **FR-002**: O sistema MUST manter filas distintas por tipo de exame/coleta, cada uma com sua prÃ³pria numeraÃ§Ã£o de senhas no dia operacional.
- **FR-003**: O sistema MUST permitir, no **painel da equipe**, um comando explÃ­cito de **encerrar/abrir dia** que reinicia a numeraÃ§Ã£o das senhas por tipo de exame; o reinÃ­cio MUST NOT ocorrer automaticamente por meia-noite/calendÃ¡rio; o histÃ³rico dos dias anteriores MUST ser preservado; atendimentos ainda em espera no dia encerrado MUST permanecer vinculados a esse dia e MUST NOT entrar na fila ativa do novo dia (conclusÃ£o ou cancelamento manual pela equipe).
- **FR-004**: O sistema MUST permitir, no **painel da equipe**, atribuiÃ§Ã£o e alteraÃ§Ã£o do nÃ­vel de prioridade de atendimentos em espera entre exatamente dois valores: **rotina** e **urgente**; atendimentos urgentes MUST ser chamados antes dos de rotina na mesma fila.
- **FR-005**: O sistema MUST determinar o prÃ³ximo atendimento a ser chamado chamando primeiro todos os **urgentes** (FIFO entre si) e, em seguida, os de **rotina** (FIFO entre si).
- **FR-006**: O sistema MUST permitir que operadores no **painel da equipe** atualizem o status do atendimento ao longo do fluxo (no mÃ­nimo: aguardando, chamado, em atendimento, concluÃ­do; e estados de aptidÃ£o quando aplicÃ¡vel).
- **FR-007**: O sistema MUST registrar e persistir todos os atendimentos da fila de emergÃªncia (identificaÃ§Ã£o, tipo de exame, senha do dia, prioridade, status, timestamps relevantes).
- **FR-008**: O sistema MUST garantir rastreabilidade: cada atendimento permanece univocamente ligado Ã  identificaÃ§Ã£o do doador/paciente (nome completo + documento) e Ã  senha emitida durante todo o ciclo de vida do registro.
- **FR-009**: O sistema MUST impedir que um mesmo nÃºmero de senha seja reutilizado no mesmo dia e tipo de exame.
- **FR-010**: O sistema MUST permitir consulta do status/resultado do atendimento pelo interessado no **totem pÃºblico** (por senha e/ou identificador), incluindo indicaÃ§Ã£o quando o resultado ainda nÃ£o estiver disponÃ­vel.
- **FR-011**: O sistema MUST registrar logs de operações relevantes (emissão, priorização, chamada, mudança de status, encerrar/abrir dia) consultáveis no **painel da equipe** para monitoramento e auditoria da simulação. Cada entrada MUST incluir superfície do ator (`totem` ou `painel`), tipo de ação, identidade da senha/fila quando aplicável e timestamp. A persistência da ação de negócio e do respectivo log MUST ocorrer na mesma transação (sucesso conjunto ou falha conjunta; falha de audit MUST NOT ser silenciosa).
- **FR-012**: O sistema MUST apresentar no **painel da equipe** visÃ£o operacional das filas (quantidade aguardando, prÃ³ximos, indicadores de prioridade) adequada ao contexto de posto emergencial de alta vazÃ£o.
- **FR-013**: O sistema MUST tratar de forma segura e clara situaÃ§Ãµes sem prÃ³ximo atendimento, senha invÃ¡lida e tentativas de alterar atendimentos em estado final (mensagem compreensÃ­vel, sem corromper a fila).
- **FR-014**: A soluÃ§Ã£o MUST ser entregue como simulaÃ§Ã£o operacional do posto (demonstrÃ¡vel ponta a ponta), nÃ£o como integraÃ§Ã£o com sistemas hospitalares reais externos.
- **FR-015**: O sistema MUST separar claramente as superfÃ­cies de uso: o totem pÃºblico restringe-se a emitir senha e consultar status/resultado; o painel da equipe concentra priorizar, chamar prÃ³ximo, atualizar status, encerrar/abrir dia e consultar logs â sem exigir login formal na simulaÃ§Ã£o.
- **FR-016**: O sistema MUST recusar a emissÃ£o de senha quando nome completo ou documento estiverem ausentes, indicando claramente os campos obrigatÃ³rios.

### Key Entities

- **Tipo de Exame/Coleta**: Categoria de atendimento que possui fila prÃ³pria (ex.: triagem, coleta de sangue, exame especÃ­fico da campanha).
- **Atendimento (Senha)**: Registro de uma pessoa na fila de um tipo de exame em um dia; inclui nÃºmero do dia, prioridade, status e vÃ­nculo de identificaÃ§Ã£o.
- **Doador/Paciente**: Pessoa atendida no posto; identificada por **nome completo** e **documento** (CPF ou RG) para rastrear o atendimento na simulaÃ§Ã£o.
- **Prioridade**: NÃ­vel binÃ¡rio do atendimento â **rotina** (padrÃ£o na emissÃ£o) ou **urgente** (elevado pela equipe) â que determina a ordem de chamada.
- **Dia Operacional**: Janela delimitada pelo comando de **encerrar/abrir dia** no painel da equipe; define a numeraÃ§Ã£o das senhas e o reinÃ­cio das filas (sem virada automÃ¡tica por calendÃ¡rio).
- **Evento de Log**: Registro imutável (para fins da simulação) de uma ação relevante do sistema, com superfície do ator (`totem` | `painel`), tipo de ação, identidade da senha/fila quando aplicável, timestamp e descrição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuÃ¡rio consegue emitir senha no totem e obter confirmaÃ§Ã£o do nÃºmero e tipo de exame em menos de 1 minuto no fluxo feliz.
- **SC-002**: Em cenÃ¡rio simulado com pelo menos 50 atendimentos e mÃºltiplos tipos de exame, 100% das senhas ficam na fila correta do tipo escolhido.
- **SC-003**: Em testes com mistura de urgentes e rotina, 100% das chamadas respeitam a regra âurgente antes de rotinaâ, e dentro do mesmo nÃ­vel a ordem Ã© FIFO.
- **SC-004**: ApÃ³s o comando de encerrar/abrir dia, a primeira senha de cada tipo recomeÃ§a a numeraÃ§Ã£o; o histÃ³rico do dia anterior permanece consultÃ¡vel; e 100% dos atendimentos que ainda aguardavam no dia encerrado ficam fora da fila ativa do novo dia.
- **SC-005**: Em amostragem de auditoria, 100% dos atendimentos testados mantÃªm vÃ­nculo Ã­ntegro entre identificaÃ§Ã£o, senha, tipo e status atual.
- **SC-006**: Operadores conseguem identificar o prÃ³ximo a chamar e a quantidade aguardando por fila sem treinamento formal alÃ©m de um roteiro curto de demonstraÃ§Ã£o.
- **SC-007**: Pelo menos 90% das aÃ§Ãµes operacionais crÃ­ticas executadas em um roteiro de demonstraÃ§Ã£o aparecem corretamente nos logs consultÃ¡veis.
- **SC-008**: Doador/paciente consegue consultar status ou resultado do prÃ³prio atendimento em menos de 2 minutos apÃ³s o registro do resultado pela equipe (na simulaÃ§Ã£o).

## Assumptions

- O escopo Ã© uma **simulaÃ§Ã£o demonstrÃ¡vel** do posto emergencial (evento/campanha no CastelÃ£o), nÃ£o a operaÃ§Ã£o clÃ­nica real com integraÃ§Ã£o a laboratÃ³rios externos ou sistemas de saÃºde pÃºblicos.
- Existem duas superfÃ­cies: **totem pÃºblico** (emitir senha + consultar status/resultado) e **painel da equipe** (priorizar, chamar, atualizar status, logs), sem login formal na simulaÃ§Ã£o.
- A interface do totem Ã© simples (tela clara, poucas aÃ§Ãµes), inspirada em totens de emergÃªncia hospitalar.
- ExistirÃ¡ um conjunto inicial configurÃ¡vel de **tipos de exame/coleta**; a lista exata pode ser definida na implementaÃ§Ã£o com valores de demonstraÃ§Ã£o.
- A identificaÃ§Ã£o do doador/paciente na emissÃ£o exige **nome completo** e **documento** (CPF ou RG); demais dados cadastrais estÃ£o fora do mÃ­nimo obrigatÃ³rio.
- Prioridade mÃ©dica na simulaÃ§Ã£o usa exatamente **dois nÃ­veis**: rotina (padrÃ£o) e urgente (elevado no painel da equipe).
- O reinÃ­cio do dia operacional Ã© **manual**, via comando âencerrar/abrir diaâ no painel da equipe (sem reinÃ­cio automÃ¡tico Ã  meia-noite).
- Na virada do dia, quem ainda aguarda permanece no dia anterior (fora da fila ativa); a equipe conclui ou cancela esses atendimentos manualmente.
- NotificaÃ§Ã£o âno dispositivo mÃ³velâ do contexto original Ã© atendida na simulaÃ§Ã£o por **consulta de status/resultado** acessÃ­vel ao interessado; envio push real Ã© opcional e fora do nÃºcleo obrigatÃ³rio.
- Monitoramento de logs cobre eventos de negÃ³cio da fila; retenÃ§Ã£o segue prÃ¡tica padrÃ£o de demonstraÃ§Ã£o (disponÃ­vel durante o perÃ­odo de uso da simulaÃ§Ã£o).
- Volume âcentenas de pessoasâ do contexto Ã© tratado como meta de desenho operacional da simulaÃ§Ã£o (capacidade de registrar e ordenar muitos atendimentos), nÃ£o como teste de carga de infraestrutura em produÃ§Ã£o.
- Fora de escopo inicial: integraÃ§Ã£o com equipamentos de laboratÃ³rio, impressÃ£o fÃ­sica obrigatÃ³ria de etiquetas de tubo, autenticaÃ§Ã£o corporativa complexa e multi-tenant de vÃ¡rios estÃ¡dios.



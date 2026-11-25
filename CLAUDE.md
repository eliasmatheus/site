# eliasmatheus.com.br

Site pessoal do Elias Matheus. Uma jornada em scroll pela história dele (engenharia civil → frontend → full stack → AI engineer), com interações que mostram frontend de ponta. Público principal: recrutadores estrangeiros. O conteúdo do site é em inglês; a conversa comigo e estes documentos são em português.

## Leia antes de qualquer tarefa

1. `docs/visao.md`: o que o site é, para quem, e as regras de narrativa. Elas valem mais do que qualquer ideia técnica.
2. `docs/arquitetura.md`: stack, engine de scroll, estratégia de mobile, orçamentos de performance.
3. `docs/plano.md`: as fases. Trabalhe sempre na fase atual e marque o que concluir.
4. `docs/cenas/<cena>.md` da cena em que estiver mexendo.
5. `docs/conteudo-e-privacidade.md` antes de escrever ou trocar qualquer texto, imagem ou dado.

## Referência visual

`reference/prototype/World.dc.html` é o protótipo da v2 (mundo 3D) e `reference/prototype/Journey.dc.html` é a v1 (página longa). Estão no formato do canvas do Claude Design (`<x-dc>`, `{{ }}`, `<sc-for>`, `class Component extends DCLogic`) e não rodam soltos. Leia o markup e a classe `Component` para extrair textos, cores, tempos e lógica. A versão viva está em https://claude.ai/artifact/6tvLdr8KsgChtDpNwAdp1i (artboard 4 = v2, artboard 3 = v1, usar o Play).

O protótipo é referência de intenção, não de arquitetura. Não copie a estrutura de um arquivo só, os estilos inline nem o setState global. Reescreva cada cena como componente isolado.

## Regras que não se negociam

- Não pode parecer uma página HTML rolando. O visitante flutua num mundo. Sem frames vazios ou etapas intermediárias entre cenas.
- Menos informação, mais interação. No máximo uma quest por cena, embutida na narrativa. Quem não quiser interagir só continua rolando e nada trava.
- Quests guiam até a resposta (passos, alvo visível, botão "show me").
- Mobile é cidadão de primeira classe. Toda cena precisa funcionar bem num iPhone de 390 px de largura com toque, não só "caber". Veja `docs/arquitetura.md#mobile`.
- O recrutador precisa achar o trabalho em 10 segundos: o link "Work →" fica sempre visível e leva a uma página simples de projetos, sem jornada.
- `prefers-reduced-motion` desliga voos e partículas e mantém o conteúdo.
- Performance: LCP < 2,5 s e INP < 200 ms em celular médio. three.js e cenas pesadas só carregam perto de serem vistas.

## Estilo de texto (copy do site)

Inglês simples e direto, frases curtas, tom pessoal. Sem travessões (em dash). Nada de cara de texto gerado por IA. Homenagens a Duna, Fallout Shelter, Dota 2, The Sims, Interestelar, Guns N' Roses, Bastardos Inglórios e Pokémon só no estilo e no texto, nunca com logos, personagens ou assets das marcas.

## Fluxo de trabalho

- "Para baixo e para o lado": para baixo = próxima cena da narrativa; para o lado = refinar uma cena. Não refine uma cena além do critério de aceite antes de a próxima existir.
- Uma cena por PR, com print ou vídeo curto do desktop e do mobile na descrição.
- Antes de dar algo por pronto: `npm run build`, `npm run check`, testes, e Lighthouse mobile da página.
- Commits pequenos, mensagens em inglês.

# Visão

## O que é

"Meet Elias". O site apresenta a pessoa tanto quanto o trabalho: alguém com camadas, interesses que parecem desconexos e se complementam (fotografia com Fuji X-T3, engenharia, história, filosofia, jogos de estratégia, ficção científica, guitarra). Cada cena é uma obra única, com humor e cor próprios, e o scroll muda o clima do site.

## Para quem

Recrutadores estrangeiros e pessoas técnicas. Eles precisam:
- achar os projetos em 10 segundos ("Work →" sempre visível, página de projetos sem jornada);
- sair entendendo quem o Elias é e como ele trabalha;
- perceber, pela própria experiência, que ele domina frontend.

## Fio narrativo

Jornada do herói, mais profissional, com hints do pessoal. A tese: a vida é feita de pivotagens estratégicas no momento certo: engenharia → frontend → full stack → AI engineer. O que ele amava em projetar estruturas (detalhe, método, antecipar problemas reais, segurança, normas, apresentar para o outro entender) é o mesmo que ele leva para o software.

Contraste emocional importante: o deserto (2019 e 2020, apagado, silencioso, a sensação de poder fazer mais) contra a explosão do primeiro Hello World ("I can make the machine do this?").

## Regras de experiência

- Não parece uma página rolando. O visitante flutua num mundo 3D e voa de uma cena para a outra (referência: stabondar.com).
- Sem frames vazios. Toda posição de scroll mostra algo vivo.
- Menos informação, mais interação. Exemplos concretos em vez de explicação.
- Quests: no máximo uma por cena, parte da história, opcionais. Guiam até a resposta. Contador discreto no header.
- Tecnologia de ponta do navegador onde fizer sentido (scroll-driven animations, WebGL, View Transitions, canvas, Web Audio), sempre com fallback.

## Estrutura (decidida em 25/11/2026)

O site é híbrido:

1. **Landing TL;DR** em `/`: para quem está com pressa e para o SEO. Simples no design, não no capricho (referência: brittanychiang.com). Direção escolhida: **Orbit** (`reference/prototype/landing-orbit.html`). Termina numa porta: "That was the short version. The long one starts at the edge of a black hole."
2. **Jornada**: quem continua rolando atravessa a porta e cai na história.

## Jornada (nova ordem)

| # | Cena | Ano | Quest |
|---|------|-----|-------|
| 1 | Horizon: o wormhole, o buraco negro e a queda | hoje | (em aberto; o planeta no cursor ficou em espera) |
| 2 | The fall: o corredor onde o passado vive | do fim dos anos 90 a hoje | |
| 3 | The Call: o garoto do computador e a escolha do curso | fim dos anos 90 a 2011 | |
| 4 | Structures: a sapata | 2012 a 2020 | Dimensionar a sapata mais barata segura |
| 5 | The Desert | 2019 a 2020 | |
| 6 | The Click: o primeiro Python | 2020 | Fazer o programa dizer o seu nome |
| 7 | 2020 no Windows: o desafio A + B | 2020 | |
| 8 | Tux: Ubuntu e a NLW | ago 2020 | |
| 9 | To be continued | | |

- **Horizon** abre a jornada com um hobby que traduz bem para a web: o espaço (Interestelar, Star Wars, Star Trek, só como homenagem de estilo). Protótipo: Cinematic, enquadramento Off-axis, chegada por wormhole, lens flare no cursor e queda em primeira pessoa (`reference/prototype/black-hole.html`). O planeta gasoso ficou em espera.
- **The fall** é o navegante caindo no buraco negro e entrando num espaço tridimensional onde dá para visitar o passado, assistir e interagir de leve com algumas coisas. As cenas seguintes (Call a Tux) passam a ser momentos desse espaço, cada um uma porta para a cena completa. Protótipo: `reference/prototype/the-fall.html` (corredor de fios de luz, scroll viaja no tempo, momentos clicáveis).
- **Fotografia** (o antigo Prologue, com a câmera e a quest da exposição) surgiu mais tarde na vida do Elias e sai da abertura. Volta mais adiante, no ponto certo da linha do tempo, a definir.
- **Quests**: a do Horizon está em aberto. A sapata e o nome no Python continuam; a da exposição volta junto com a fotografia.

Próximos capítulos (ainda sem protótipo na v2, alguns rascunhados na v1): primeiro emprego e Interfaces (voo pela janela do avião), Method (painel estilo The Sims), Worlds (árvore de talentos estilo Dota 2), Time (estante estilo Interestelar), Epilogue (solo de guitarra com Web Audio e um mapa do site estilo Fallout Shelter). Também falta trazer o jogo do CS50 (https://scratch.mit.edu/projects/405948947/) e as pranchas CAD se desenhando.

## Página de trabalho

A landing TL;DR assume esse papel em `/`. Até ela existir, `/work` continua no ar; depois, `/work` redireciona para a landing. O resto desta seção vale para a landing. Rápida e escaneável: posicionamento amplo, que mostra a vontade de trabalhar em empresas e projetos interessantes, inovadores e de grande impacto (a frase "Product engineer building AI features for fintech" ficou específica demais). Em uso: "From load-bearing structures to load-bearing software." Opção registrada: "I build software for ideas that move things forward.", 3 projetos-âncora, experiência, contato. É a primeira coisa a ficar pronta depois do esqueleto.

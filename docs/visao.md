# Visão

## O que é

"Meet Elias". O site apresenta a pessoa tanto quanto o trabalho: alguém com camadas, interesses que parecem desconexos e se complementam (fotografia com Fuji X-T3, engenharia, história, filosofia, jogos de estratégia, ficção científica, guitarra). Cada cena é uma obra única, com humor e cor próprios, e o scroll muda o clima do site.

## Curiosidade como traço

O Elias é muito curioso e adora explicar os fatos mais aleatórios. A narrativa dá pistas disso, e algumas partes ganham "detours" opcionais: explicações interativas que quem quiser pode abrir (ex.: como funcionava a internet discada e o que era cada som do modem). Quem não quiser segue rolando.

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

## Jornada: a viagem (decidida em 26/11/2026)

A jornada virou um arco só, em cinco atos, descrito em `docs/viagem.md` (a fonte de verdade para ordem, momentos e decisões). Em resumo: o Elias passa por um planeta com anéis, atravessa um wormhole e cai num buraco negro. Lá dentro, num tesseract onde o passado é um lugar, tenta mudar a escolha do curso em 2011 e não consegue. Entende que foi essa escolha que o trouxe até aqui: a missão não é mudar o passado, é mudar o presente. Navega pelas memórias em ordem e chega ao hoje, se reinventando como engenheiro de IA. O tesseract colapsa, ele volta pelo wormhole fazendo as pazes com o Elias antigo e reaparece diante de Saturno: o começo e o fim são o mesmo lugar.

| Ato | Cena | O que acontece |
|---|---|---|
| I · A partida | Horizon | O planeta contra a luz, o wormhole, o túnel, a calmaria, o universo parado |
| II · O buraco negro | Horizon | A estrela que vira buraco negro ("Meet Elias."), a órbita, a queda, a tempestade, a ejeção |
| III · O tesseract | The fall | A colmeia, o poço, zero G, o quarto pela fresta, a escolha (seleção de personagem: dev, civil, aeronáutico), o rádio, a missão |
| IV · As memórias | Salas do tesseract | My computer, Structures, Desert, The Click, 2020, Tux, primeiro emprego |
| V · O presente e a volta | Fim | O ponto de inflexão, a nova jornada como engenheiro de IA, o colapso do tesseract, a volta gentil pelo wormhole e a chegada a Saturno, onde tudo começou: contato ou recomeçar |

- A The Call (a montagem retrô) sai: as memórias dela passam a viver no My computer, e a escolha vira a seleção de personagem no Ato III.
- O ponto de não retorno (dentro do wormhole e na queda) é um piloto automático curto, sem travar quem quer sair ("Work →", teclado e links funcionam).
- Homenagem a Interestelar só no estilo. A estante pode aparecer como easter egg; nave, robô, nomes e falas do filme não.
- **Fotografia** (o antigo Prologue) continua guardada até ganhar lugar.

Próximos capítulos (ainda sem protótipo na v2, alguns rascunhados na v1): primeiro emprego e Interfaces (voo pela janela do avião), Method (painel estilo The Sims), Worlds (árvore de talentos estilo Dota 2), Time (estante estilo Interestelar), Epilogue (solo de guitarra com Web Audio e um mapa do site estilo Fallout Shelter). Também falta trazer o jogo do CS50 (https://scratch.mit.edu/projects/405948947/) e as pranchas CAD se desenhando.

## Página de trabalho

A landing TL;DR assume esse papel em `/`. Até ela existir, `/work` continua no ar; depois, `/work` redireciona para a landing. O resto desta seção vale para a landing. Rápida e escaneável: posicionamento amplo, que mostra a vontade de trabalhar em empresas e projetos interessantes, inovadores e de grande impacto (a frase "Product engineer building AI features for fintech" ficou específica demais). Em uso: "From load-bearing structures to load-bearing software." Opção registrada: "I build software for ideas that move things forward.", 3 projetos-âncora, experiência, contato. É a primeira coisa a ficar pronta depois do esqueleto.

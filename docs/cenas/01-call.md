# 01 · The Call: o garoto do computador e a escolha do curso (fim dos anos 90 a 2011)

Copy: `src/content/call.ts`. A versão do protótipo (cards clicáveis com professor) foi substituída por esta.

## Intenção

Narrativa pura, sem quest e sem interação obrigatória. A ironia é o centro: tudo apontava para o computador, e ele escolheu outra coisa. Isso prepara a virada da cena 04.

Fatos (contados pelo Elias, 25/11/2026): o pai comprou o primeiro computador por volta de 1997 a 1999, com processador Pentium e 8 GB de HD. A memória de 64 MB é estimativa (típica de um Pentium da época), aprovada pelo Elias; na tela de boot ela aparece em KB, como o teste de memória da BIOS mostrava. Ele jogava consoles antigos em emuladores, usava internet discada e salvava jogos flash para jogar off-line, fazia jogos abrirem copiando um arquivo para a pasta do jogo, editava a memória dos jogos com um scanner de memória, fez todos os tutoriais de editor de imagem que achou, formatava e consertava computadores, baixava coisas por P2P e torrent. Ao terminar o ensino médio, quis exatas e engenharia; design e programação nem passavam pela cabeça. Na engenharia civil também passou longe da programação.

## Beats (por scroll)

1. **Boot**: gabinete bege genérico liga; tela de boot com "CPU: PENTIUM", o teste de memória contando até "65536K OK" e "HDD 8 GB ... OK". "Dad brought home our first computer."
2. **Montagem**: uma vinheta em pixel art por passo de scroll, cada uma com um toast "SKILL UNLOCKED":
   - emuladores: carrinho em estrada com pôr do sol e parallax (homenagem de estilo a Top Gear, sem carro, nome ou música);
   - internet discada: onda do modem e barra salvando um jogo flash;
   - pasta do jogo: janela "Replace file?" confirmada (implícito, nunca "crack");
   - memória: scanner genérico, dinheiro de 1000 para 999999 (é a vinheta que mais antecipa a programação);
   - editor de imagem: painel de camadas genérico enchendo de tutoriais;
   - suporte: barra "Formatting C:", depois outro computador, e outro;
   - downloads: fila de downloads de madrugada.
3. **A escolha**: os três cards (CIVIL ENGINEERING, COMPUTER SCIENCE, ARCHITECTURE). As skills voam para COMPUTER SCIENCE e as estatísticas enchem; o cursor para nele, hesita, passa reto e escolhe CIVIL ENGINEERING. "School was over. Everything pointed to computers." / "I wanted math. I wanted engineering. Code and design never crossed my mind."
4. **O save**: as skills ficam cinza e entram num cartucho ou disquete: "Saved for later." Transição para Structures: "Even in engineering school, I stayed far from code."

Retorno na cena 04: quando o primeiro `print` funciona, "SAVE FILE FOUND · 2011. Continue?" e as skills voltam coloridas.

## Regras

- Nenhuma marca: "old consoles", editor de imagem, scanner de memória e fila de downloads genéricos. Top Gear, The Sims, Nintendo, Photoshop, Cheat Engine e eMule só como estilo. Exceção: "PENTIUM" aparece como texto puro na tela de boot, sem logo, porque é fato da história.
- Tudo em SVG e CSS com pixel art leve; sem three.js nem imagens pesadas.
- As três opções de curso ficam como estão (decisão do Elias, 25/11/2026).

## Mobile

Montagem vertical, uma vinheta por tela, toast no topo. Cards empilhados; no lugar do cursor, um destaque que pulsa e passa de um card para o outro.

## Aceite

- [x] Toda posição de scroll mostra algo vivo; nenhuma vinheta fica vazia entre passos.
- [x] Reduced motion: vinhetas viram quadros estáticos com fade e a escolha já aparece feita.
- [x] Nenhum nome, logo ou asset de marca, inclusive em alt e metadados.
- [x] Em 390 x 844, texto e vinheta não se sobrepõem.

## Como ficou (Fase 2)

- `src/scenes/call/`: `Call.astro` (monitor, vinhetas em SVG com `crispEdges`, cards e disquete), `beats.ts` (progresso → beat, passo, skills, contador de memória e cursor; puro e testado) e `controller.ts`.
- Dwell de 4400 px: boot 12%, montagem 58% (um passo por vinheta), escolha 18%, save 12%.
- A narração fica numa caixa de diálogo com borda dupla, homenagem de estilo aos RPGs de bolso, e as skills formam um inventário ao lado do monitor (no mobile, embaixo).
- O monitor é bege e genérico; o gabinete ligando ficou de fora por espaço. Dá para voltar a ele num refinamento.
- O save das skills (cinza, para dentro do disquete) é o gancho para o "SAVE FILE FOUND · 2011" da cena 04.

## Ritmo e caixas de diálogo por época (26/11/2026)

Pedido do Elias: o scroll com inércia fazia a montagem passar batida. Agora a cena tem paradas (`CALL_STOPS` em `beats.ts`, motor em `src/engine/pacing.ts`): cada gesto leva a uma fala ou ação (boot concluído, cada vinheta depois da sua ação, o cursor hesitando em COMPUTER SCIENCE, a escolha, o save). São 12 gestos; o deslize entre paradas é curto, para continuar fluido.

- A montagem segue a ordem real da linha do tempo de `docs/cenas/my-computer.md`: pasta do jogo (98), discada e jogos flash (2000), emuladores, suporte e downloads (XP), editor de imagem e scanner de memória (Vista), mapas personalizados (7, nova vinheta: lobby de jogos personalizados e o e-mail da key beta, "First match · that night").
- A caixa de diálogo se veste como os jogos de cada época, só com CSS: RPG de bolso (borda dupla, fonte pixel Press Start 2P), balão de jogo Flash, janela de RPG de console 16 bits (azul em degradê), painel brilhante de simulador de vida, vidro (Vista), moldura dourada de estratégia (Cinzel) e painel escuro de arena moderna na escolha e no save. Uma aba no canto mostra a época (Late 90s, Early 2000s, Mid 2000s, Late 2000s, Around 2010, 2011).
- O texto aparece letra a letra (CSS, com uma cópia escondida para leitores de tela); com reduced motion aparece inteiro.
- Dwell foi de 4400 para 4800 px por causa da oitava vinheta.

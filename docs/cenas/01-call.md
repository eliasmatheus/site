# 01 · The Call: o garoto do computador e a escolha do curso (fim dos anos 90 a 2011)

Copy: `src/content/call.ts`. A versão do protótipo (cards clicáveis com professor) foi substituída por esta.

## Intenção

Narrativa pura, sem quest e sem interação obrigatória. A ironia é o centro: tudo apontava para o computador, e ele escolheu outra coisa. Isso prepara a virada da cena 04.

Fatos (contados pelo Elias, 25/11/2026): o pai comprou o primeiro computador por volta de 1997 a 1999, com 8 GB de HD (não usar número de memória RAM). Ele jogava consoles antigos em emuladores, usava internet discada e salvava jogos flash para jogar off-line, fazia jogos abrirem copiando um arquivo para a pasta do jogo, editava a memória dos jogos com um scanner de memória, fez todos os tutoriais de editor de imagem que achou, formatava e consertava computadores, baixava coisas por P2P e torrent. Ao terminar o ensino médio, quis exatas e engenharia; design e programação nem passavam pela cabeça. Na engenharia civil também passou longe da programação.

## Beats (por scroll)

1. **Boot**: gabinete bege genérico liga; tela de boot com "HDD 8 GB ... OK". "Dad brought home our first computer."
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

- Nenhuma marca: "old consoles", editor de imagem, scanner de memória e fila de downloads genéricos. Top Gear, The Sims, Nintendo, Photoshop, Cheat Engine e eMule só como estilo.
- Tudo em SVG e CSS com pixel art leve; sem three.js nem imagens pesadas.
- As três opções de curso ficam como estão (decisão do Elias, 25/11/2026).

## Mobile

Montagem vertical, uma vinheta por tela, toast no topo. Cards empilhados; no lugar do cursor, um destaque que pulsa e passa de um card para o outro.

## Aceite

- [ ] Toda posição de scroll mostra algo vivo; nenhuma vinheta fica vazia entre passos.
- [ ] Reduced motion: vinhetas viram quadros estáticos com fade e a escolha já aparece feita.
- [ ] Nenhum nome, logo ou asset de marca, inclusive em alt e metadados.
- [ ] Em 390 x 844, texto e vinheta não se sobrepõem.

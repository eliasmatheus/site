# My computer: a história contada pelas versões do Windows

Decidido em 25/11/2026. Ao atravessar a última brecha do The fall, a estética do espaço e de Interestelar acaba. Daqui em diante quem conta a história é o computador do Elias: cada versão do Windows é um capítulo, com o seu estilo de tela, o monitor da época e as specs da máquina. Ele sempre gostou de fazer upgrade o mais rápido possível, de estar no bleeding edge.

## Regras

- Memórias agregam momentos próximos dentro da mesma versão, para evitar muitas saídas e entradas.
- A transição de uma versão para a outra é um upgrade: barra de instalação, reinício, tela de boot nova, monitor novo.
- O boot do Pentium completa e abre o Windows 95 com um "simulador" na tela.
- Marcas (Windows, Photoshop, The Sims e outras): só homenagem de estilo e texto, conforme o `CLAUDE.md`. Nada de logos, bandeirinha, sons de inicialização, ícones oficiais, capturas ou assets. As interfaces são recriadas de forma genérica, inspiradas na época.
- Specs são estimativas (como os 64 MB do Pentium) e precisam ser aprovadas pelo Elias antes de ir ao site.

## Linha do tempo (confirmada com o Elias em 25/11/2026; specs são estimativas)

Sem exatidão extrema: esta parte não pode ficar maçante. Cada versão é curta.

| Versão | Anos | PC (estimativa) | Monitor | Memórias |
| --- | --- | --- | --- | --- |
| Windows 95 | 1997 a 1998 | Pentium, 64 MB, HD 8 GB | CRT 14" bege | O primeiro computador |
| Windows 98 | 1998 a 2000 | O mesmo PC | CRT 14" | O arquivo na pasta do jogo |
| Windows 2000 | 2000 a 2002 | O mesmo PC, 128 MB | CRT 15" | Internet discada e jogos flash salvos |
| Windows XP | 2002 a 2007 | Pentium 4, 512 MB, 80 GB | CRT 17" | Emuladores, o jogo de simulação de vida (The Sims), formatar e consertar computadores, downloads de madrugada |
| Windows Vista | 2007 a 2009 | Core 2 Duo, 2 GB, 250 GB | LCD 19" | Editor de imagem e tutoriais (Photoshop); scanner de memória no modo carreira do FIFA (dinheiro infinito) |
| Windows 7 | 2009 a 2011 | Core 2 Duo, 4 GB, 500 GB | LCD 19" | Mapas personalizados do Warcraft III: The Frozen Throne, principalmente DotA; o dia da key beta do Dota 2 e a primeira partida |
| Windows 8 | 2011 a 2012 | Core i5, 4 GB, 1 TB | LCD 21,5" | A escolha do curso: Civil Engineering |

Protótipo: `reference/prototype/my-computer.html` (versão viva: https://claude.ai/artifact/GBwWSsau8tqyK6c7Rmf61j). O scroll passa por passos: boot do Pentium, área de trabalho de cada versão, uma janela por memória (com "SKILL UNLOCKED") e a tela de instalação do próximo upgrade. O monitor muda junto (CRT bege 14" a LCD 21,5").

Depois do Windows 8 a história segue para a engenharia (Structures), o deserto, 2020 no Windows (já é uma cena) e o Tux: o Ubuntu em agosto de 2020 vira a grande troca de sistema da história.

## Direção v2: cada versão é um pseudo-simulador (25/11/2026)

O monitor no meio da página (v1, `reference/prototype/my-computer.html`) foi substituído por uma experiência imersiva, no estilo do portfólio da Arc (arcmarumo.com): **a tela cheia é a tela do computador**. Só a moldura aparece nas bordas (plástico do monitor da época, cantos curvos do vidro, escurecimento e scanlines do CRT; LCD fino nas versões mais novas).

- **Pseudo-simulador por versão:** alta fidelidade, explorável por um tempo (ícones, janelas que arrastam, menu Iniciar, barra de tarefas). Referências: windows93.net, win7simu.visnalize.com. Não precisa ser completo.
- **Narrativa por dentro:** a copy vive dentro do sistema, no estilo da época: um readme no Bloco de Notas, um portal da web de 2001, um post-it, uma notificação do mensageiro de um amigo avisando que saiu um Windows novo.
- **Scroll conduz a história; o mouse explora.** Cada etapa tem que tirar o fôlego de algum jeito: nostalgia, imersão, narrativa e showcase.
- **Internet discada:** a espera e a expectativa da conexão, com o som do modem gerado na hora por Web Audio (tom de linha, DTMF, chamada, tom de resposta, negociação, treinamento), nunca uma gravação.
- **Upgrades com detalhe:** instalador em modo texto, tabela de partições, formatação NTFS, reinício, tela azul no meio, wizard gráfico com "minutos restantes".
- **Downloads e banda:** P2P na primeira banda larga (200 kbps, aproximado), depois 300 kbps, o primeiro 1 Mbps e a troca do P2P pelo torrent.
- **Marcas:** MSN, eMule, uTorrent, provedores (UOL, IG, BOL) e afins só como estilo: apps com nomes e ícones genéricos ("Messenger", "P2P Downloader", "Torrent Client", "Portal online"). Windows pode aparecer em texto. Sem logos (inclusive o ícone do botão Iniciar é genérico), sons ou telas copiadas.

Fatia vertical (Windows 2000 → XP): `reference/prototype/os-slice-2000-xp.html` (versão viva: https://claude.ai/artifact/VYdAsy9n24hShjCCUwcpZ3).

### Jogos em Flash, a hora semanal e o emulador (v2 da fatia)

- **A regra do pai (fato):** internet discada uma vez por semana, no fim de semana, por uma hora. Travava a linha e custava caro. O Elias abria várias janelas de jogos para deixar no cache e continuava jogando depois que a conexão caía.
- **Portal de jogos em Flash:** homenagem ao estilo dos portais brasileiros da época (fundo preto, menu lateral cinza com plataformas, logo laranja arredondado, lista de jogos em duas colunas com categoria, página do jogo com instruções numeradas e o aviso do plugin). Nome inventado ("Game Zone"), sem logo nem nome do portal real. Jogos da lista com nomes genéricos.
- **Quest:** abrir jogos em janelas novas enquanto o relógio da sessão desce. Cada jogo carrega a ~4,6 KB/s (mostrado 12x mais rápido). Quando a hora acaba, os que carregaram continuam rodando; os que não carregaram mostram "The page cannot be displayed". Se ninguém abrir nada, o jogo de luta já estava no cache da semana anterior.
- **Stick Fight 9:** homenagem ao estilo das lutas de bonecos de palito em cima de uma mesa (copo, monitor, teclado). Jogo original, desenhado em canvas: setas, Z soco, X pulo, C especial com energia; botões de toque no celular; modo demo até o visitante clicar.
- **Emulador (XP):** homenagem ao visual do ZSNES (fundo roxo com estrelas, menus cinza GAME/CONFIG/CHEAT/NETPLAY/MISC, Load Game com lista verde em 8.3). Sem ROMs comerciais: os "cartuchos" são originais (AERO~1.SFC, BRAWL97.SFC, DINOJMP.SFC, HYPER~1.SFC...). A mecânica é a lembrança real: menus em inglês, ele não conseguia ler e abria jogo por jogo até achar o certo. HYPER~1.SFC é jogável (pseudo-3D estilo Mode 7, setas ou toque). Botão "Show me the racer" guia até a resposta.
- **Jurídico:** ROMs comerciais (Nintendo, Konami, SNK, Warner) não podem ser hospedadas. Um core real (bsnes, GPL) pode virar detour depois, só com homebrew de licença livre e crédito ao autor. Snes9x fica de fora (licença não comercial).

Demais versões no mesmo formato:

- Primeiro PC → 98: `reference/prototype/os-95-98.html` (versão viva: https://claude.ai/artifact/8h4TSUesujyg8a2Qz5zNNQ). Termina no setup em modo texto que entrega para a fatia 2000 → XP.
- XP → Vista → 7 → 8: `reference/prototype/os-xp-8.html` (versão viva: https://claude.ai/artifact/DuhPQSSVr8eu8ERxxzB46y). Bezel de LCD a partir daqui. Vista: UAC, tutorial de texto cromado, editor com camadas, scanner de memória (career_mode.exe, 1.000.000 → 999.999.999). 7: lobby de mapas personalizados, e-mail com a key beta, "First match · that night". 8: tiles com os cursos, Civil Engineering escolhido.
- Os três protótipos juntos cobrem a linha do tempo inteira. Na implementação real viram uma cena só, com o motor de janelas compartilhado e cada era como módulo.

## Para a implementação real

- No protótipo do The fall a câmera atravessa vigas. No site, a geração da estrutura precisa deixar o caminho da câmera livre (poço sem vigas cruzando a trajetória, ou desvio das vigas próximas).

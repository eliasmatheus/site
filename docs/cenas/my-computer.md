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

## Para a implementação real

- No protótipo do The fall a câmera atravessa vigas. No site, a geração da estrutura precisa deixar o caminho da câmera livre (poço sem vigas cruzando a trajetória, ou desvio das vigas próximas).

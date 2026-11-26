# The fall: o espaço onde o passado vive

Protótipo: `reference/prototype/the-fall.html`. Versão viva: https://claude.ai/artifact/GiNRNckPdZp1nwjKHHDxSv

## Intenção

Depois da queda no Horizon, o visitante entra num espaço tridimensional onde o passado é um lugar: dá para passar por ele, olhar de perto e interagir de leve. As cenas da história (Call, Structures, Desert, Click, 2020, Tux) viram momentos desse espaço; cada um é uma porta para a cena completa.

## Direção (v2, 25/11/2026)

A ideia do stabondar.com (blocos 3D com faces), mas invertida: em vez de ver a estrutura por fora, o visitante está dentro dela. Homenagem de estilo ao interior do tesseract de Interestelar, com vigas abstratas e originais (sem astronauta, estante, quarto ou qualquer peça do filme). A v1 (corredor de fios de luz com cartões) foi descartada.

## Beats (por scroll)

1. O clarão branco da queda se apaga e um tombo lento estabiliza. "Here, the past is a place you can visit."
2. **A descida:** a câmera cai por um poço no meio de uma estrutura de vigas listradas (marrons, creme, um pouco de verde-azulado, como borradas por movimento). O poço gira devagar; o mouse desloca o ponto de vista e dá paralaxe real.
3. **Brechas:** ao passar por cada momento, o olhar vira para uma brecha nas vigas e mostra uma janela iluminada em pixel art. Em ordem de queda: `print('Olá, Mundo!')` (2020), o deserto (2019 a 2020), a sapata (2012 a 2020), a escolha do curso (2011). Um rótulo no canto diz o que se vê ("Through a gap").
4. **O primeiro momento:** no fundo do poço, emoldurada por vigas, a tela de boot do primeiro computador. O scroll leva até ela.
5. **Atravessar:** a brecha se abre em degraus (íris pixelada) e o site muda de estética por completo: tela de CRT verde com scanlines e vinheta, fonte de terminal, o teste de memória contando até 65536K, "LOADING...", a caixa de diálogo de RPG ("Dad brought home our first computer. I was hooked on the screen.") e o aviso "SAVE FILE · 1999". Daqui segue a The Call.

## Técnica

- three.js (no protótipo via CDN; no site, import dinâmico como na sapata): vigas em `InstancedMesh` (uma chamada de desenho por grupo), textura listrada gerada em canvas, névoa exponencial, luz quente vinda do fundo e uma lâmpada que acompanha a câmera, poeira dourada em `Points`.
- As brechas são abertas de propósito: vigas e pilares na linha de visão de cada janela são retirados na geração.
- A tela retrô é HTML/CSS por cima do canvas, recortada por `clip-path: circle()` em degraus; funciona mesmo sem WebGL.
- Fontes da parte retrô: VT323 (terminal) e Press Start 2P (diálogo).

## Em aberto

- Interação com as janelas (clicar para olhar de perto, side quests) ainda não existe na v2.
- Texto das janelas girado: resolvido (a câmera se endireita em cada brecha).
- Desempenho num celular médio: menos níveis e pixel ratio 1,25 no protótipo, ainda sem medição real.

## Aceite

- [x] Toda posição de scroll mostra a estrutura, o título ou a tela retrô.
- [x] Reduced motion: sem tombo, poço sem girar e poeira parada.
- [x] Sem WebGL: a transição para a tela retrô continua funcionando.
- [x] A câmera não atravessa vigas nem ripas (testado em `lattice.test.ts`).
- [ ] Desempenho num celular médio de verdade (ainda não medido).

## Como ficou no site (26/11/2026)

- `src/scenes/the-fall/`: `beats.ts` (progresso → queda, brechas, íris e tela retrô; puro), `lattice.ts` (estrutura de vigas com semente fixa; pura e testada), `world.ts` (three.js, carregado por import dinâmico) e `controller.ts`. Copy em `src/content/the-fall.ts`.
- Vem logo depois do Horizon (o clarão branco da queda continua aqui) e antes da The Call. Dwell de 4200 px.
- **Sem vigas no caminho:** nenhuma viga na linha do poço e nenhuma caixa dentro da coluna da câmera (2,6 unidades do eixo, cobrindo a paralaxe do mouse). A linha de visão de cada brecha também fica livre. Os dois casos têm teste.
- **Paradas:** um gesto por visão (título, cada brecha, o primeiro computador, o save), com o motor de `src/engine/pacing.ts`.
- **Janelas legíveis:** ao passar por uma brecha o olhar centraliza a janela e a câmera se endireita (resolve o "texto girado" que estava em aberto); depois volta a girar descendo.
- **Fim diferente do protótipo:** a tela retrô não repete o boot e a fala da The Call (que vem logo em seguida). Ela mostra "LOADING...", depois "SAVE FILE · LATE 90S" e um menu de RPG com "CONTINUE" e "NEW GAME", na mesma caixa de borda dupla com que a The Call abre. O ano ficou "Late 90s" porque a data exata do primeiro computador não está confirmada (1997 a 1999).
- three.js só carrega no primeiro sinal de visitante (scroll, ponteiro, toque ou tecla). Antes disso, sem WebGL ou com WebGL por software (SwiftShader, llvmpipe: sem GPU), um gradiente parado faz o poço. Montar as vigas por software travava a página por segundos, scroll incluído. Lighthouse mobile de `/journey`: 100.

## Revisão de 26/11/2026 (tarde)

Pedido do Elias: estava parecida demais com o protótipo, o fluxo avançava "loucamente" para o fim e, voltando, mostrava detalhes em baixíssima qualidade. Referências em `reference/inspiration/2026-11-26-tesseract-wormhole/` (fora do repositório).

- **Sem paradas:** as paradas por gesto saíram desta cena. A câmera segue o scroll por uma mola (`src/engine/follow.ts`): começa e termina devagar, como o voo de um jogo 3D. Texto e sobreposições continuam no scroll cru. Dwell de 5600 px.
- **Tesseract novo:** um shader próprio pinta as vigas quase pretas, com faixas de luz ao longo do comprimento (âmbar, creme, um pouco de ciano e verde) e, em algumas faces, fileiras de compartimentos acesos. Nada de textura pequena: fica nítido de perto. Feixes de luz finos cruzam o espaço nos três eixos. Quanto mais rápido o scroll, mais compridos os rastros e um pouco mais aberto o campo de visão.
- **Estrutura mais densa:** feixes de ripas finas ao lado das vigas. As duas regras continuam testadas (nada no caminho da câmera, linha de visão livre até cada memória), e agora nenhum pilar fica logo atrás de uma memória.
- **Memórias em 3D:** cada brecha tem um pequeno cenário com luz própria, numa cor que o tesseract não tem, e essa luz vaza para as vigas em volta (o shader das vigas recebe as cinco luzes): mesa com notebook e o primeiro programa (azul frio), duna sob sol branco (deserto), sapata e pilar no solo em corte (verde), três cartas num palco com a primeira escolhida (violeta) e, no fundo, o primeiro computador bege com a tela de boot (verde fósforo). Código em `src/scenes/the-fall/memories.ts`.

Em aberto:
- Os cenários das memórias ainda são geometria simples (caixas, cilindros, uma duna deformada). Dá para refinar cada um.
- Desempenho num celular médio real ainda não medido.

## Duas fases de movimento (26/11/2026, noite)

Pedido do Elias: no filme, a queda dentro do tesseract é livre e sem controle até o "centro"; depois a navegação muda. Anda-se na diagonal, a vista parece passar por uma lente ultra grande-angular, em perspectiva cônica de dois pontos, levemente distorcida.

- **Caminho em duas partes** (`src/scenes/the-fall/path.ts`, puro): queda livre reta pelo poço até o centro (38% do caminho), girando e tombando; depois a câmera se endireita e desliza na diagonal pela grade, quase nivelada. Olhando ao longo da diagonal e com o horizonte reto, as vigas fogem para dois pontos de fuga.
- **Lente:** na navegação o campo de visão abre (84° na vertical no desktop, 104° em retrato) e uma passada de pós-processamento curva a imagem em barril, com um pouco de franja de cor nas bordas e vinheta. Na queda livre, lente normal e sem passada extra.
- **Memórias ao longo da diagonal**, alternando os lados, um pouco à frente de onde são nomeadas, para serem vistas em ângulo. O primeiro computador espera no fim do caminho, de frente.
- **Estrutura** com 15 linhas de grade, para cobrir a diagonal. As regras de área livre agora são gerais: tubos em volta do caminho (3,6 de raio), da linha de visão de cada memória e uma esfera em volta de cada memória. Vigas e pilares que cruzam uma área livre são cortados em pedaços de uma célula, então a grade continua em volta. Tudo testado.
- **Cor:** os shaders das vigas passaram a escrever cor linear e deixam a conversão para o three.js, para a passada da lente não aplicar gama duas vezes (isso deixava tudo esbranquiçado).

Em aberto: a memória das estruturas ainda passa perto da borda do quadro; no celular as memórias ficam pequenas.

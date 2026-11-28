# A viagem: plano da jornada completa (26/11/2026)

Direção aprovada pelo Elias em 26/11/2026: a nova narrativa é a direção do site, e o que não fizer mais sentido pode ser descartado. As decisões estão na seção "Decidido"; o tempo de cada ato se ajusta no caminho. Base: a cena que ele descreveu quadro a quadro em 26/11 (anotações e quadros em `reference/inspiration/2026-11-26-wormhole-approach/cena.md`, fora do repositório) e o que já existe no site.

## A história em uma frase

O Elias atravessa um wormhole e cai num buraco negro. Lá dentro, num espaço onde o passado é um lugar, ele tenta mudar a escolha que acha que errou (Engenharia Civil em vez de Computação) e não consegue. Entende que foi aquela escolha que o trouxe até aqui. A missão não é mudar o passado, é mudar o presente: ele já se reinventou uma vez e vai se reinventar de novo, agora como engenheiro de IA.

Isso amarra a tese da visão (a vida é feita de pivotagens no momento certo: engenharia, frontend, full stack, AI engineer) num arco só, com começo, virada e fim.

## Os cinco atos

Tempo de leitura pensado para quem só rola, sem parar nas quests. "Work →" continua sempre visível.

### Ato I · A partida (cena Horizon, primeira metade)

| # | Momento | O que já existe | O que falta |
| --- | --- | --- | --- |
| 1 | **O planeta contra a luz (decidido: entra).** Um gigante gasoso com anéis, no estilo de Saturno, iluminado por trás, flare da estrela. O scroll faz o pan até o planeta ficar no centro (o flare muda com ele); daí zoom, os anéis na horizontal e o voo por baixo deles, até passar o planeta. "The long version starts far from here." | Feito (PR da partida) | |
| 2 | **O wormhole aparece aos poucos.** Passado o planeta, um ponto minúsculo cresce. Pouca luz no começo, mais informação conforme chega perto; as estrelas da borda viram flashes finos. | A esfera do wormhole (galáxia dentro, borda, lente) | Revelação gradual, aproximação de lado, flashes na borda |
| 3 | **Dentro.** O cilindro corre na nossa direção, vistos de perto da borda, lente grande-angular. A parede ondula, flashes, chacoalho, alarmes. É o **ponto de não retorno** (ver decisões). | O túnel de faíscas, o tranco | Parede curva, chacoalho, alarmes, a câmera fora do centro |
| 4 | **A calmaria.** Alarmes calam, a velocidade cai como uma curva logarítmica, o centro se abre. | A mola do scroll (`follow.ts`) | A curva de saída |
| 5 | **O universo parado.** Antes a câmera estava fixa e o universo passava; agora a câmera se move contra um universo parado. | | Céu estático e pan |

### Ato II · O buraco negro (cena Horizon, segunda metade)

| # | Momento | O que já existe | O que falta |
| --- | --- | --- | --- |
| 6 | **Uma estrela, e não é.** Um ponto com flare, depois um brilho difuso, depois a primeira vista nítida. "Meet Elias." | O buraco negro em shader, o enquadramento Off-axis | A transição de estrela para buraco negro |
| 7 | **A órbita no limite.** Passamos por cima do disco, rápido e acelerando, como uma estação orbital sobre nuvens douradas. "Every story has a point of no return." | | O disco visto de cima, a órbita |
| 8 | **Desacoplar e cair.** Brilho extremo no horizonte, o universo distorcendo para trás, um poço que se fecha, escuridão total. | A queda com HUD e alertas | O poço, a escuridão |
| 9 | **A tempestade.** Uma nuvem de partículas (spray de onda batendo), fagulhas incandescentes vindo como tiros. Apagão. Alarme: "Eject". | | Partículas e fagulhas, o apagão |
| 10 | **A paz.** Queda suave na direção de uma esfera com uma rachadura de luz no centro. | | A esfera de cubos vista de longe |

### Ato III · O tesseract (cena The fall)

| # | Momento | O que já existe | O que falta |
| --- | --- | --- | --- |
| 11 | **A colmeia cúbica.** A esfera vira uma superfície de cubos, fica plana, parece que vamos bater e caímos dentro de um dos poços. | | A superfície e o mergulho |
| 12 | **Queda livre no poço**, girando, laterais escuras e ofuscantes. Parada brusca. Zero G, com um balanço. | Queda livre até o centro, depois a câmera endireita (v3 de hoje) | Parada com balanço, giro mais violento |
| 13 | **Olhar em volta.** Vigas tingidas pelas cores dos espaços do passado. Uma fresta mostra um quarto: **o quarto do Elias criança, com o primeiro computador**. | Memórias em 3D com luz que vaza nas vigas, navegação diagonal com lente grande-angular | A fresta como jeito de ver, o quarto |
| 14 | **Interagir.** Dá para mexer na parede e afetar o momento: algo no quarto se move e fica. | | Interação leve |
| 15 | **Quartos em todas as direções.** Navegamos até a memória mais importante. | Navegação diagonal | Muitos quartos ao longe |
| 16 | **A escolha (2011).** Corte para a frente do computador, um notebook, como no filme. Na tela, uma seleção de personagem no estilo dos jogos modernos: **Elias dev**, **Elias engenheiro civil** e **Elias engenheiro aeronáutico** (essa foi uma possibilidade real na época). A quest: tentar fazer o Elias de 2011 escolher o dev. Não funciona: ele escolhe o engenheiro civil. | Os tiles da escolha na The Call (a escolha retrô sai) | A tela de seleção, o notebook, a quest que falha de propósito |
| 17 | **O rádio.** Uma linha de texto com chiado, no estilo dos jogos indie em que os personagens falam uma língua que não existe e por isso representa qualquer uma. A virada: mudar aquela escolha apagaria o caminho que trouxe até aqui. | | Texto em língua inventada com chiado (som gerado na hora), o sentido em inglês por baixo |
| 18 | **A missão.** Não é mudar o passado, é mudar o presente. | | Copy |

### Ato IV · As memórias, em ordem

Com o propósito claro, navegamos pelas memórias em ordem, cada uma uma sala do tesseract que se abre na cena completa (como a visão já previa para o The fall):

1. O quarto e o primeiro computador, e a história pelas versões do Windows (**My computer**, os protótipos 95 a 8 já existem).
2. A engenharia: a sapata (**Structures**, já no site).
3. O deserto (**Desert**, já no site, simples).
4. O primeiro Python (**The Click**).
5. 2020 no Windows, o desafio A + B.
6. O Ubuntu e a NLW (**Tux**).
7. Primeiro emprego e os grandes feitos (capítulos ainda sem protótipo).

### Ato V · O presente e a volta

| # | Momento | O que já existe | O que falta |
| --- | --- | --- | --- |
| 19 | **O ponto de inflexão.** De volta ao presente. A mensagem para o Elias de hoje: você já se reinventou uma vez; o que parecia impossível se abriu com esforço, dedicação e alguma dose de talento. | | Copy |
| 20 | **A nova jornada.** Em vez de recusar a IA e perder espaço, abraçá-la: engenheiro de IA. A intervenção que dá certo. | | Copy e o gesto final |
| 21 | **O colapso.** O tesseract se fecha sobre si, num colapso confuso. A luz cresce até o clarão e a tela branca. | O tesseract em 3D | O colapso, o clarão |
| 22 | **A volta pelo wormhole**, agora mais iluminado, pacífico, gentil. A despedida do Elias antigo: fazer as pazes com ele e com as escolhas dele. | O túnel do wormhole | A versão clara e calma do túnel, a despedida |
| 23 | **Prata derretida.** Clarão com sombras onduladas, como um líquido viscoso e escaldante. | | Shader de líquido |
| 24 | **De volta a Saturno.** O clarão some e revela o flare de um ponto muito brilhante: estamos de volta ao começo. O fim fecha o círculo. **CTA: entrar em contato ou recomeçar a jornada.** "Work →" em destaque. Substitui o "To be continued". | O planeta do Ato I | O CTA, o "recomeçar" (volta ao topo da jornada) |

Rascunho de copy (inglês simples, sem travessão, a revisar com o Elias):
- A escolha: "I shouted at him. Computer Science. He picked Civil Engineering anyway."
- O rádio: "Change that, and you erase the road that brought you here."
- A missão: "I am not here to change the past. I am here to change what comes next."
- O fim: "You reinvented yourself once. Do it again." / "Next: AI engineer."

## Decidido (26/11/2026)

1. **O planeta entra na abertura**, no estilo de Saturno, com contraluz e o flare que muda no pan.
2. **Ponto de não retorno: piloto automático.** Ao passar do ponto, a sequência anda sozinha por alguns segundos (5 é a referência; pode passar um pouco se a cena pedir). Na ida, o scroll para cima ainda volta ao ponto (o "rewind"). "Work →", teclado e links continuam funcionando. Com reduced motion, vira um corte.
3. **O rádio:** uma linha de texto com chiado, numa língua inventada, no estilo dos jogos indie.
4. **My computer é a primeira sala do Ato IV**, entrando pela fresta do quarto. A escolha do curso corta para a frente de um notebook e vira uma seleção de personagem moderna (Elias dev, Elias engenheiro civil, Elias engenheiro aeronáutico), no lugar da escolha retrô.
5. **O tom do fim:** a ideia de que o mercado está mudando e ficar parado é o risco é sentimento, não copy final. A copy vem depois.
6. **Tempo:** refinado no caminho, equilibrando engajamento, entretenimento e entendimento.
7. **Pivô:** a nova narrativa é a direção. O que não fizer mais sentido do que já foi feito pode ser descartado.
8. **A estante pode ficar**, como referência e easter egg.
9. **Cutscene e jogo:** os planos de Saturno (abertura com pan, o close e o take por baixo do planeta olhando para cima, separados por cortes secos) são cutscenes em terceira pessoa, com barras de cinema. As barras saem quando a câmera passa para a primeira pessoa, o "jogo".
10. **A nave (por enquanto):** uma nave tripulada original, um anel que gira para dar gravidade à tripulação (a ideia antiga da roda giratória), com quatro raios, um eixo central e o motor na ponta, num modelo básico. Aparece no take por baixo do planeta para dar escala, e por ser tripulada justifica a passagem para a primeira pessoa. Naves de filme (Falcon, Enterprise, Endurance) ficam fora: são assets dos estúdios.

11. **Scroll da narrativa:** a partida anda em paradas, um gesto por take, e a câmera nunca pula: ela anda no ritmo do filme mesmo com um scroll rápido. Voltar no meio da narrativa mostra um rewind (a imagem volta rápida, com marca de rewind), para ficar claro que é a fita voltando.

## Princípios de tela (27/11/2026)

Toda cena da viagem segue as técnicas de narrativa, imersão e ambientação das telas de abertura e de seleção de personagem dos jogos. Valem para o Ato I e para as cenas seguintes.

1. **O fundo é a promessa do mundo.** O quadro é ocupado de ponta a ponta. Uma imagem resume o tom e a aventura que vem pela frente; fundo vazio é cenário, fundo cheio é mundo.
2. **Um lugar base por cena.** Uma localização reconhecível, adaptada para ser "jogável", em vez de muitas referências misturadas. O real entra como referência; a composição manda.
3. **Personagem pequeno, mundo grande, os dois juntos.** Contraste de escala. Teleobjetiva para comprimir as camadas e trazer o fundo para perto.
4. **Camadas de profundidade.** Primeiro plano, meio e fundo, cada camada mais clara pela névoa, dando ao olho um caminho do personagem ao mundo e de volta.
5. **Vista e abrigo.** Um elemento perto da lente (abrigo) e o mundo aberto atrás (vista): o espectador está ali, junto do personagem.
6. **Ele olha para nós.** O personagem encara a câmera, de três quartos, em pose relaxada e aberta.
7. **O personagem é o visitante também.** Painel de atributos com fatos reais (classe, origem, missão atual), nunca inventados.
8. **Tudo vivo.** Respiração, vento, partículas, luzes; a tela se mexe mesmo com o visitante parado.
9. **Céu exato, cena montada.** As estrelas são as reais; a orientação, a lente e o cenário são direção de arte.

## Em espera (pin)

- **Seletor de naves no começo da jornada:** opcional, no visual minimalista dos posters (só o contorno). Opções originais ou reais, nunca naves de filme. A nave escolhida aparece nas cutscenes e a passagem para a primeira pessoa acontece de dentro dela.

## Ordem de trabalho proposta (uma cena por PR, em stack)

1. **Horizon v3, a partida:** planeta, wormhole revelado aos poucos, túnel visto da borda, calmaria, universo parado. Momentos 1 a 5.
2. **Horizon v3, o buraco negro:** estrela que vira buraco negro, órbita, queda, tempestade, apagão, paz. Momentos 6 a 10.
3. **The fall v4, a chegada:** a colmeia, o poço, zero G, a fresta, o quarto. Momentos 11 a 14.
4. **The fall v4, a escolha:** quartos em todas as direções, a quest da escolha, o rádio, a missão. Momentos 15 a 18.
5. **As salas do Ato IV:** o hub de memórias e a entrada no My computer; as cenas que já existem (Structures, Desert) passam a ser salas.
6. **O presente e a volta:** o ponto de inflexão, o colapso do tesseract, a volta gentil pelo wormhole, a prata derretida e a chegada a Saturno com o CTA (contato ou recomeçar). Substitui o "To be continued".

Cada passo com desktop e iPhone, check, testes e Lighthouse, como sempre.

## O que fica de fora do site, de propósito

Por ser do filme: a nave e o anel da nave, o robô e o nome dele, os nomes dos astros e da missão, a menina e a família do filme, a trilha, falas do filme, logos. Fica a homenagem no estilo: luz, lente, ritmo, a estrutura de vigas, a ideia de ver o passado por frestas e, como easter egg, a estante (decidido em 26/11/2026). O quarto que aparece é o do Elias, não o do filme.

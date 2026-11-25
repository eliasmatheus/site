# The fall: o espaço onde o passado vive

Protótipo: `reference/prototype/the-fall.html`. Versão viva: https://claude.ai/artifact/GiNRNckPdZp1nwjKHHDxSv

## Intenção

Depois da queda no Horizon, o visitante entra num espaço tridimensional onde o passado é um lugar: dá para passar por ele, olhar de perto e interagir de leve. As cenas da história (Call, Structures, Desert, Click, 2020, Tux) viram momentos desse espaço; cada um é uma porta para a cena completa.

## Beats (por scroll)

1. O clarão branco da queda se apaga e um tombo lento estabiliza. "Here, the past is a place you can visit."
2. Um corredor infinito de fios de luz (âmbar perto, verde-azulado longe, uma luz quente no fim) e poeira dourada. O scroll leva a câmera para a frente no tempo; o mouse inclina o olhar.
3. Os momentos flutuam alternando os lados, em ordem: o primeiro computador (late 90s), a escolha do curso (2011), a sapata (2012 a 2020), o deserto (2019 a 2020), `print('Olá, Mundo!')` (2020), o desafio A + B (julho de 2020), o Ubuntu na maratona de programação (agosto de 2020) e "Next stop" (hoje).
4. Um contador no canto ("Now passing") mostra o ano que está passando.

## Interação

- Passar o mouse (ou focar com o teclado) acende o momento e os fios que o ligam aos vizinhos no tempo.
- Clicar abre o momento no centro: imagem maior, legenda e "Step in →", que no site leva à cena completa. Esc ou "Back to the corridor" fecha.
- Momentos com quest levam a marca "Side quest" (a sapata e o primeiro Python).

## Técnica

- Corredor e poeira em canvas 2D com projeção perspectiva própria; os momentos são botões HTML posicionados pela mesma projeção (texto nítido e acessível, sem WebGL).
- Momentos são `<button>` com rótulo completo; o cartão aberto é um diálogo modal com foco gerenciado.

## Em aberto

- Visual de cada momento é um "still" simples; no site, deve vir da própria cena.
- Como o "Step in" volta ao corredor depois da cena (voltar pelo mesmo ponto do tempo).
- Mobile: os momentos ficam pequenos no fundo; avaliar um caminho mais central.

## Aceite

- [ ] Toda posição de scroll mostra o corredor e pelo menos um momento ou o título.
- [ ] Momentos alcançáveis por teclado; diálogo fecha com Esc e devolve o foco.
- [ ] Reduced motion: sem tombo e sem poeira se movendo.

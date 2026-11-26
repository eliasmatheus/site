# Horizon: o buraco negro

Protótipo: `reference/prototype/black-hole.html` (v5: wormhole, Cinematic Off-axis, lens flare no cursor, queda em primeira pessoa).

## Intenção

Abrir a jornada com algo de tirar o fôlego e que mostre o tom do site: um buraco negro calculado no navegador, com a luz curvada em volta dele e o disco de gás passando na frente. Homenagem de estilo a Interestelar, sem nomes, naves, trilha ou imagens do filme.

## Beats (por scroll)

1. **Wormhole:** a jornada começa rolando, sem botão, diante de uma esfera no espaço: um wormhole com outra galáxia distorcida dentro e arcos de luz na borda ("The long version starts far from here."). O buraco negro não aparece aqui: o que vem depois é surpresa. O scroll aproxima a esfera até ela encher a tela e a câmera entra num túnel azul-escuro com faíscas quentes.
2. **Parada brusca:** tranco e clarão, longe do buraco negro.
3. **Chegada ao hoje:** a câmera se aproxima até o enquadramento Off-axis e aparece "Meet Elias.".
4. "Every story has a point of no return." A câmera começa a descer.
5. **Queda em primeira pessoa:** tremor crescente, vinheta vermelha, instrumentos (distância, dilatação do tempo, integridade do casco) e alertas ("Tidal stress rising", "Hull integrity critical", "Navigation offline", "Signal lost"). "Past this line, there is only forward." Clarão e corte para The fall.

## Visual

- Disco com movimento rápido perto do buraco, riscos e grumos que derivam, brilho difuso em volta (luz espalhada pelo gás) e borda fria azulada.
- Anel de fótons: uma linha fina, quente e brilhante colada na borda da sombra, calculada pelo parâmetro de impacto de cada raio.
- Flares de lente: brilho, risco anamórfico horizontal e reflexos fantasmas a partir do lado mais brilhante do disco.

## Interação no cursor: lens flare

- O cursor é a fonte de luz de um lens flare no estilo dos títulos de Duna (só a estética): núcleo âmbar quente, bloom largo, risco anamórfico horizontal com pontas verde-azuladas, reflexos fantasmas espelhados pelo centro da tela, uma lâmina ciano e poeira dourada flutuando.
- Sem cursor (celular), o flare descansa no lado mais brilhante do disco.

## Em espera (pin, 25/11/2026)

- **Planeta gasoso no cursor:** segue o cursor com atraso proporcional à dilatação do tempo, perde gás para o buraco, gira devagar e avermelha perto do horizonte. Não ficou bom na prática. O código está no protótipo atrás de `PLANET = false`.
- Sem quest no Horizon por enquanto.

## Técnica

- Shader de fragmento em WebGL1, sem three.js: integra o raio de luz em volta do buraco (passos adaptativos), disco com textura polar em riscos, brilho Doppler.
- Resolução e número de passos caem sozinhos se o aparelho não aguentar.
- Antes do shader, sem WebGL e sem JS: gradientes CSS. Na abertura, um wormhole parado (esfera com núcleo de galáxia e borda clara); depois do túnel, o buraco negro parado (sombra, anel quente e disco achatado). O texto aparece por cima desde a primeira pintura.
- Reduced motion: disco quase parado, sem tremor nem clarão, sem gás caindo.

## Mobile

- Buraco menos deslocado para não sair da tela, câmera um pouco mais longe.
- O flare segue o dedo enquanto ele toca a tela; o arrasto vertical continua rolando a página.

## Aceite

- [x] LCP < 2,5 s no mobile (texto aparece antes do shader). Lighthouse mobile em `/journey`: 100 / 100 / 100, LCP 0,9 s, TBT 0 ms.
- [ ] 50 fps num celular médio, ou a qualidade cai sozinha. A queda automática existe (resolução, depois passos); falta medir num celular real.
- [x] Nenhuma marca, nome ou imagem de filme.

## Implementação

- Cena: `src/scenes/horizon/` (`Horizon.astro`, `controller.ts`, `beats.ts` com testes, `shader.ts`, `flare.ts`). Copy: `src/content/horizon.ts`. Primeira cena do registro, `dwell` 5200 px.
- O shader só liga no primeiro sinal do visitante (mouse, toque, rolagem, tecla). Até lá, o buraco negro em CSS. Com o timer de 2,5 s do protótipo, o Lighthouse caía para 92 (TBT 240 ms).
- O flare segue o mouse e, no celular, o dedo (eventos de toque continuam durante a rolagem). Sem ponteiro, descansa no lado brilhante do disco.
- HUD da queda abaixo do header da jornada.
- Visibilidade das falas e do HUD vira na hora ao aparecer e só depois do fade ao sumir, para nada vazar quando a camada é escondida.
- A cena seguinte ainda é The Call (a The fall não existe no site). O clarão final faz a ponte.

Prints: `docs/screens/fase-4/horizon-*.jpg`.

## Revisão de 26/11/2026

- A abertura mostrava o buraco negro e estragava a surpresa. Agora é a esfera do wormhole (estilo das referências em `reference/inspiration/2026-11-26-tesseract-wormhole/`, fora do repositório), que cresce com o scroll, vira túnel e só então para no buraco negro.
- **Scroll com massa:** a câmera segue o scroll por uma mola criticamente amortecida (`src/engine/follow.ts`): começa e termina devagar, sem passar do ponto. O texto continua no scroll cru. No túnel, as faíscas aceleram com a velocidade do scroll. Reduced motion desliga a mola.
- Rótulo e aviso sem WebGL não falam mais do buraco negro na abertura.

## Ato I, a partida (26/11/2026, ver `docs/viagem.md`)

- **Linha do tempo:** a partida ocupa o começo do dwell (agora 8000 px) e o buraco negro mantém a linha do tempo dele (`q`), remapeada para depois. Saturno até 0,11; o wormhole revelado aos poucos até a boca em 0,2; o túnel até 0,27; a calmaria até 0,31; o céu parado até 0,36. Os beats e enquadramentos do buraco negro não mudaram, só a posição deles no scroll (`atQ`).
- **Saturno contra a luz** (shader): crescente na borda iluminada, faixas, anéis com a divisão escura, iluminados por trás, a metade da frente sobre o planeta, e a estrela logo além da borda com quatro raios. O flare da tela fica preso à estrela; o pan leva o planeta para a esquerda (a estrela, mais longe, anda menos), então o flare muda. O ponteiro dá um pouco de paralaxe. No celular o planeta fica acima do texto.
- **O wormhole revelado aos poucos:** de longe é só uma lente (as estrelas se curvam em volta); a galáxia de dentro e a borda ganham luz conforme ele chega perto. A aproximação é de lado: a esfera entra pela direita e só parte dela aparece. Perto da borda, as estrelas viram flashes finos.
- **O túnel visto da borda:** o fundo fica em cima e à esquerda, a parede com o universo borrado ondula e passa, faíscas saem do fundo. A tela chacoalha e clarões cortam o túnel.
- **A calmaria:** as faíscas desaceleram até parar, a parede escurece e o fundo se abre. **O céu parado:** estrelas finas, galáxias pequenas e uma nebulosa num canto, sem movimento. Daí o buraco negro aparece (a revelação como estrela vem no Ato II).
- **Sem o tranco** na saída do wormhole: a virada é a calmaria, como na cena descrita.
- **Imagem parada:** Saturno em gradientes CSS (crescente, anel inclinado, estrela). Uma regra antiga do celular pintava o buraco negro em todo `.still`; agora vale só para `.hole`.
- **Landing:** a porta mostrava um buraco negro e dizia "The long one starts at the edge of a black hole.", o que estragava a surpresa. Agora desenha um planeta com anéis contra a luz e diz "The long one starts out past Saturn." (a descrição de `/journey` acompanha).

Não verificado: LCP mobile de `/journey` deu 2,6 s com a máquina carregada (load average 9); medir de novo com a máquina tranquila. A partida ainda não tem o piloto automático do ponto de não retorno (passo próprio no plano).

Prints: `docs/screens/fase-4b/horizon-departure-*.jpg` e `landing-door-planet.jpg`.

# Horizon: o buraco negro

Protótipo: `reference/prototype/black-hole.html` (v4: wormhole, Cinematic Off-axis, planeta no cursor, queda em primeira pessoa).

## Intenção

Abrir a jornada com algo de tirar o fôlego e que mostre o tom do site: um buraco negro calculado no navegador, com a luz curvada em volta dele e o disco de gás passando na frente. Homenagem de estilo a Interestelar, sem nomes, naves, trilha ou imagens do filme.

## Beats (por scroll)

1. **Wormhole:** a jornada começa rolando, sem botão. Quem sai da landing entra num túnel de luz ("The long version starts far from here.").
2. **Parada brusca:** tranco e clarão, longe do buraco negro.
3. **Chegada ao hoje:** a câmera se aproxima até o enquadramento Off-axis e aparece "Meet Elias.".
4. "Every story has a point of no return." A câmera começa a descer.
5. **Queda em primeira pessoa:** tremor crescente, vinheta vermelha, instrumentos (distância, dilatação do tempo, integridade do casco) e alertas ("Tidal stress rising", "Hull integrity critical", "Navigation offline", "Signal lost"). "Past this line, there is only forward." Clarão e corte para The fall.

## Visual

- Disco com movimento rápido perto do buraco, riscos e grumos que derivam, brilho difuso em volta (luz espalhada pelo gás) e borda fria azulada.
- Anel de fótons: uma linha fina, quente e brilhante colada na borda da sombra, calculada pelo parâmetro de impacto de cada raio.
- Flares de lente: brilho, risco anamórfico horizontal e reflexos fantasmas a partir do lado mais brilhante do disco.

## Interação: o planeta gasoso no cursor

- Um planeta gasoso pequeno segue o cursor (ou o dedo) com atraso. O atraso é o tempo dele: o relógio do planeta anda a sqrt(1 - rs/r) do relógio de quem olha, então perto do buraco ele fica cada vez mais para trás. Uma linha pontilhada liga o planeta ao cursor e mostra esse atraso.
- Perto do buraco ele gira mais devagar, avermelha, estica em direção ao horizonte e perde gás, que cai em espiral no disco. Mostra "TIME ×0.05".
- Ele nunca cruza o horizonte: perto dele quase congela, mas volta a se mexer bem devagar quando o cursor se afasta.
- Sem cursor (celular parado), o planeta faz uma órbita lenta e larga sozinho.
- Ainda sem quest definida. Ideia: concluir ao deixar o relógio do planeta 10 vezes mais lento.

## Técnica

- Shader de fragmento em WebGL1, sem three.js: integra o raio de luz em volta do buraco (passos adaptativos), disco com textura polar em riscos, brilho Doppler.
- Resolução e número de passos caem sozinhos se o aparelho não aguentar.
- Sem WebGL: versão em partículas 2D.
- Reduced motion: disco quase parado, sem tremor nem clarão, sem gás caindo.

## Mobile

- Buraco menos deslocado para não sair da tela, câmera um pouco mais longe.
- O planeta segue o dedo enquanto ele toca a tela; o arrasto vertical continua rolando a página.

## Aceite

- [ ] LCP < 2,5 s no mobile (texto aparece antes do shader).
- [ ] 50 fps num celular médio, ou a qualidade cai sozinha.
- [ ] Quest resolvível com mouse, toque e teclado.
- [ ] Nenhuma marca, nome ou imagem de filme.

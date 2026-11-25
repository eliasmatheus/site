# Horizon: o buraco negro

Protótipo: `reference/prototype/black-hole.html` (Cinematic, enquadramento Off-axis).

## Intenção

Abrir a jornada com algo de tirar o fôlego e que mostre o tom do site: um buraco negro calculado no navegador, com a luz curvada em volta dele e o disco de gás passando na frente. Homenagem de estilo a Interestelar, sem nomes, naves, trilha ou imagens do filme.

## Beats (por scroll)

1. "Meet Elias." sobre o buraco negro, enquadrado fora do centro (Off-axis), um pouco afastado.
2. "Every story has a point of no return."
3. "Past this line, there is only forward." A câmera volta ao centro e se aproxima.
4. Clarão e entrada: "Here, the past is a place you can visit." Leva ao The fall.

## Quest: o planeta

- Um planeta pequeno orbita o buraco negro, com um relógio em volta dele.
- O visitante arrasta o planeta (mouse, dedo ou setas do teclado). Quanto mais perto do horizonte, mais devagar o relógio dele anda, com a fórmula real (sqrt(1 - rs/r)), calibrada para a borda da sombra.
- Feedback no próprio planeta: avermelha (redshift), estica em direção ao buraco perto da borda, e mostra "×N SLOWER".
- Uma frase traduz o efeito: "1 hour on the planet = 3 days far away".
- Soltar dentro da sombra faz o planeta cair; outro aparece.
- Quest concluída quando o relógio do planeta fica pelo menos 10 vezes mais lento (a definir no aceite).

## Técnica

- Shader de fragmento em WebGL1, sem three.js: integra o raio de luz em volta do buraco (passos adaptativos), disco com textura polar em riscos, brilho Doppler.
- Resolução e número de passos caem sozinhos se o aparelho não aguentar.
- Sem WebGL: versão em partículas 2D.
- Reduced motion: disco quase parado, sem clarão.

## Mobile

- Buraco menos deslocado para não sair da tela, câmera um pouco mais longe.
- O planeta tem área de toque de 64 px e não briga com o scroll (só ele tem `touch-action: none`).

## Aceite

- [ ] LCP < 2,5 s no mobile (texto aparece antes do shader).
- [ ] 50 fps num celular médio, ou a qualidade cai sozinha.
- [ ] Quest resolvível com mouse, toque e teclado.
- [ ] Nenhuma marca, nome ou imagem de filme.

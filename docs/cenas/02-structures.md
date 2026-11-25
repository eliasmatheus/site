# 02 · Structures: a sapata (2012 a 2020)

Copy e lógica: cena `s-eng`, métodos `ftCalc`, `initFooting`, `showMe` e o bloco de `ftStep` em `World.dc.html`. Modelo em `docs/modelos.md#sapata`.

## Intenção

Mostrar o dilema real do projeto estrutural: pequena demais falha, grande demais fica cara. E o que ele levava a sério: investigação do solo (ele negociava para que clientes aceitassem fazer sondagem), segurança, normas. Usa o perfil de solo real de uma sondagem dele.

## Beats

1. Modelo 3D estilo software de cálculo estrutural (tema escuro, grid, linhas de construção): uma das igrejas que ele projetou, dois pavimentos, seis pilares, seis sapatas. Tudo passa. ("One of the churches, in 3D.")
2. "Then the plans changed." A carga do pilar central sobe para 480 kN, a sapata fica vermelha (FAILING). Quest.
3. Quest guiada, um passo por vez no painel:
   - Step 1: arrastar um canto amarelo para fora até sair do vermelho.
   - Step 2: seguro mas caro; puxar a seta para baixo até a camada rija (~2,5 m).
   - Step 3: arrastar um canto para dentro e parar antes do vermelho. Contorno verde mostra o alvo.
   - Botão "Show me the sweet spot" anima até a solução.
4. "The sweet spot." Quest +1.

Painéis: HUD (dimensões, pressão no solo vs admissível com barra, custo, % acima do mais barato seguro, veredito, passo atual) e perfil do solo da sondagem (profundidade, N, kPa, linha destacada na profundidade atual).

## Mobile (problema conhecido)

Ver `reference/screens/2026-11-24-mobile-footing.png`: o perfil do solo cobre o HUD, o texto fica por cima do 3D e as alças são pequenas.

- Texto da cena curto no topo, 3D no meio com câmera mais fechada na sapata central.
- Bottom sheet com o HUD resumido (status, custo, passo) e dois sliders grandes: LARGURA e PROFUNDIDADE. Arrastar no 3D continua possível, mas os sliders são o caminho principal.
- Perfil do solo recolhido num botão "Soil" dentro da sheet, ou como régua fina ao lado da escavação no próprio 3D.
- Render só enquanto a cena estiver ativa; pixel ratio ≤ 2; sem sombras.

## Aceite

- [ ] three.js carregado só quando a cena anterior começa (import dinâmico) e com fallback estático se WebGL falhar.
- [ ] Os três estados e o ótimo batem com os testes do modelo.
- [ ] Quest resolvível só com teclado e só com toque.
- [ ] Nenhum painel sobrepõe outro em 390 x 844.

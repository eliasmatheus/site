# Landing TL;DR (Orbit)

Protótipo: `reference/prototype/landing-orbit.html` (direção Orbit). Conteúdo: `src/content/work.ts`.

## Intenção

Quem está com pressa resolve tudo aqui em 10 segundos: quem é, o que faz, onde trabalhou, projetos e contato. Também é a página que os buscadores leem. Design simples e preciso, com tempero no detalhe.

## Layout

- Desktop: coluna da identidade fixa à esquerda (nome, posicionamento, frase curta, navegação da página, links), registro rolando à direita (About, Experience, Projects). Referência: brittanychiang.com.
- Mobile: uma coluna, sem a navegação lateral.
- Fim da página: a porta para a jornada, com um buraco negro pequeno e "Begin the journey ↓". Rolar além dela entra no Horizon.

## Tempero

- Céu escuro com estrelas discretas e leve paralaxe.
- Nebulosa no estilo da árvore de habilidades do Skyrim (homenagem só no estilo): uma pintura larga e parada do céu (gás azul-esverdeado à esquerda, ferrugem e âmbar à direita, faixas de poeira escura, aglomerados de estrelas), 1,7 tela de largura, pintada uma vez em WebGL. Ela não se mexe; o que muda é para onde olhamos. Cada parte da página tem um ponto no céu (About, Experience, Projects, a porta). Ao rolar até outra parte, a vista desliza até lá e a nebulosa brilha durante o movimento, apagando de volta quando para. O mouse inclina a vista de leve. Uma camada de estrelas mais próxima anda um pouco mais rápido (paralaxe).
- (Substituiu a primeira versão, em que o cursor revelava a nebulosa: parecia arte abstrata, não nebulosa.)
- Um satélite pequeno orbitando ao lado do nome.
- Itens da lista se destacam ao passar o mouse (os outros esmaecem).

## Regras

- Tudo legível sem JS; o canvas de estrelas é decoração.
- O e-mail aparece como texto selecionável, não só como link.
- O parágrafo "About" do protótipo é rascunho: revisar com o Elias antes de publicar.

## Aceite

- [x] Lighthouse mobile ≥ 95 em performance, SEO 100, acessibilidade 100. (100 / 100 / 100, LCP 0,9 s, TBT 0 ms, CLS 0,007. Best practices 96 só pelo script do Vercel Analytics, que dá 404 fora da Vercel.)
- [x] Sem JS, a página inteira continua lá.
- [x] Reduced motion: estrelas e satélite parados.
- [ ] A porta leva ao Horizon sem frame vazio. Por enquanto leva à jornada atual em `/journey`; o texto da porta muda quando o Horizon existir.

## Implementação

- Página: `src/pages/index.astro`. Conteúdo: `src/content/landing.ts` + `src/content/work.ts`. Céu: `src/landing/` (`sky.ts`, `nebula.ts`, `view.ts` com testes).
- A jornada mudou para `/journey`. `/work` redireciona para `/` (308 na Vercel via `vercel.json`, meta refresh no build estático).
- O céu só liga na primeira interação (mouse, toque, scroll, tecla) ou 3 s depois do load, para não pesar no LCP nem no TBT.
- Vista: `src/landing/view.ts` (pontos por seção, inclinação do mouse, suavização e brilho, com testes). A nebulosa é repintada só quando muda a largura da janela. Em repouso fica a 55% de opacidade; o movimento leva até 100%. O texto do registro tem sombra escura.
- Reduced motion: a vista pula direto para o ponto da seção, sem deslizar nem brilhar.
- O "About" está em rascunho com fatos que já estão no site (estruturas, igrejas, sondagens, 2020, pagamentos, internet banking, agritech). Revisar com o Elias.

Prints: `docs/screens/fase-4/landing-*.jpg`.

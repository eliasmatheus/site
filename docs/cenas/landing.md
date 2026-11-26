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
- Nebulosa no estilo da árvore de habilidades do Skyrim (homenagem só no estilo): uma pintura larga e parada do céu (faixa de gás com filamentos, faixas de poeira escura, aglomerados de estrelas), 1,7 tela de largura, pintada uma vez em WebGL. Paleta da primeira versão puxada para o Duna: sombras em preto esverdeado, gás verde-azulado apagado, laranja de especiaria e realces cor de areia.
- O céu fica escuro (17% de opacidade em repouso). A luz em volta do mouse acende a nebulosa por inteiro, com um rastro que se apaga em ~2,5 s. Sem mouse (celular), uma luz fraca passeia sozinha.
- A nebulosa não se mexe; o que muda é para onde olhamos. Cada parte da página tem um ponto no céu (About, Experience, Projects, a porta). Ao rolar até outra parte, a vista desliza até lá e o céu clareia um pouco durante o movimento. O mouse inclina a vista de leve. Uma camada de estrelas mais próxima anda um pouco mais rápido (paralaxe).
- Histórico: a primeira versão (gás revelado só pelo cursor) parecia arte abstrata; a segunda (nebulosa parada e clara, cores frias e quentes separadas) perdeu o contraste e a paleta antiga. Esta junta os desenhos da segunda com a luz e a paleta da primeira.
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

- Página: `src/pages/index.astro`. Conteúdo: `src/content/landing.ts` + `src/content/work.ts`. Céu: `src/landing/` (`sky.ts`, `nebula.ts`, `view.ts` e `trail.ts` com testes).
- A jornada mudou para `/journey`. `/work` redireciona para `/` (308 na Vercel via `vercel.json`, meta refresh no build estático).
- O céu só liga na primeira interação (mouse, toque, scroll, tecla) ou 3 s depois do load, para não pesar no LCP nem no TBT.
- Vista: `src/landing/view.ts` (pontos por seção, inclinação do mouse, suavização e brilho, com testes). Luz: `src/landing/trail.ts` (rastro, luz que passeia e a máscara CSS de uma cópia acesa da pintura, com testes). A nebulosa é repintada só quando muda a largura da janela. O rastro se apaga pelo tempo real, mesmo com quadros lentos. O texto do registro tem sombra escura.
- Reduced motion: a vista pula direto para o ponto da seção, sem deslizar nem brilhar.
- O "About" está em rascunho com fatos que já estão no site (estruturas, igrejas, sondagens, 2020, pagamentos, internet banking, agritech). Revisar com o Elias.

Prints: `docs/screens/fase-4/landing-*.jpg`.

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
- Nebulosa por baixo (WebGL, gás com distorção de domínio em verde-azulado e âmbar, estética dos títulos de Duna): quase invisível em repouso, revelada onde o cursor passa, com um rastro que se apaga em ~2,5 s. Sem cursor (celular), uma janela lenta vagueia sozinha. Renderizada em meia resolução.
- Um satélite pequeno orbitando ao lado do nome.
- Itens da lista se destacam ao passar o mouse (os outros esmaecem).

## Regras

- Tudo legível sem JS; o canvas de estrelas é decoração.
- O e-mail aparece como texto selecionável, não só como link.
- O parágrafo "About" do protótipo é rascunho: revisar com o Elias antes de publicar.

## Aceite

- [x] Lighthouse mobile ≥ 95 em performance, SEO 100, acessibilidade 100. (100 / 100 / 100, LCP 0,9 s, TBT 0 ms, CLS 0,002. Best practices 96 só pelo script do Vercel Analytics, que dá 404 fora da Vercel.)
- [x] Sem JS, a página inteira continua lá.
- [x] Reduced motion: estrelas e satélite parados.
- [ ] A porta leva ao Horizon sem frame vazio. Por enquanto leva à jornada atual em `/journey`; o texto da porta muda quando o Horizon existir.

## Implementação

- Página: `src/pages/index.astro`. Conteúdo: `src/content/landing.ts` + `src/content/work.ts`. Céu: `src/landing/` (`sky.ts`, `nebula.ts`, `trail.ts` com testes).
- A jornada mudou para `/journey`. `/work` redireciona para `/` (308 na Vercel via `vercel.json`, meta refresh no build estático).
- O céu só liga na primeira interação (mouse, toque, scroll, tecla) ou 3 s depois do load, para não pesar no LCP nem no TBT.
- Se os 12 primeiros quadros saírem mais lentos que 24 fps, a nebulosa desliga e ficam só as estrelas.
- Rastro do cursor só com mouse. No toque, a janela que vagueia é fraca (força 0,07 por ponto) para o texto continuar legível; o texto do registro tem sombra escura.
- O "About" está em rascunho com fatos que já estão no site (estruturas, igrejas, sondagens, 2020, pagamentos, internet banking, agritech). Revisar com o Elias.

Prints: `docs/screens/fase-4/landing-*.jpg`.

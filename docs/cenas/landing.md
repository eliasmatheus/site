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

- [ ] Lighthouse mobile ≥ 95 em performance, SEO 100, acessibilidade 100.
- [ ] Sem JS, a página inteira continua lá.
- [ ] Reduced motion: estrelas e satélite parados.
- [ ] A porta leva ao Horizon sem frame vazio.

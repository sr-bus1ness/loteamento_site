# Protótipo Loteamento (40 lotes) - GitHub Pages

Arquivos:
- index.html
- styles.css
- script.js
- assets/sample.svg
- assets/logo.png

## Como publicar no GitHub Pages
1. Crie um repositório no GitHub.
2. Faça upload dos arquivos (mantenha a estrutura).
3. Vá em Settings → Pages → Branch: `main` e `/ (root)` → Save.
4. Aguarde ~1 minuto e abra `https://SEU-USUARIO.github.io/NOME-REPO/`.

## Como usar
- Clique em um lote na planta para abrir a barra inferior (detalhes).
- Altere valores/status e clique em "Salvar" ou use os botões de status rápidos.
- Pan e zoom: use mouse scroll ou pinça no celular; arraste para mover.
- Exportar/Importar: transfira dados entre dispositivos.
- Busca: digite o ID do lote (ex: L12) e pressione Enter.

## Como substituir a planta por SVG real
1. Abra `assets/sample.svg` no Inkscape.
2. Importe sua planta (PDF/JPG) como camada de fundo com baixa opacidade.
3. Desenhe polígonos/paths sobre cada lote e dê IDs correspondentes (ex: L1..L40).
4. Salve como SVG e substitua o arquivo `assets/sample.svg`.
5. Certifique-se que os IDs dos elementos no SVG correspondam aos IDs das chaves do `data` (L1..L40 para Loteamento 1; M1..M40 para Loteamento 2).

## Persistência
- Dados são salvos no `localStorage` do navegador.
- Para compartilhar, use Exportar (gera JSON) e importe no outro dispositivo.

## Próximos passos possíveis
- Conectar com Firebase/ Supabase para persistência online e multiusuário.
- Adicionar autenticação e histórico de vendas.

# Fortrex

Defesa de fortaleza em voxel: você é o general. Contrate minions por função (reparo, coleta, artilharia, soldados, curandeiros), veja o loot cair dos inimigos e ser carregado até o baú, enfrente hordas infinitas e chefes que se despedaçam pedaço por pedaço. No mapa do Reino, outras fortalezas crescem, guerreiam entre si e vêm atrás de você — cada batalha é fortaleza contra fortaleza.

## Jogar
Abra `dist/index.html` num navegador (precisa de internet para carregar three.js e as fontes via CDN). Funciona no celular.

**Teclas:** `B` construir · `I` arsenal · `U` upgrades · `M` mapa do reino · `Espaço` horda · `F` velocidade · `WASD` câmera · `H` centralizar · heróis `Q E T G Y O`.

O jogo **salva sozinho** a cada horda (no navegador). Na tela inicial, **▶ Continuar** retoma a partida; saves antigos continuam valendo depois de atualizações e uma tela de **Novidades** mostra o que mudou.

## O que tem
- **Hordas infinitas** com dificuldade crescente (Tranquilo / Normal / Brutal), eventos (bruma, eclipse, lua de sangue, revoada, terremoto, piratas, nevasca…) e chefes a cada 5 hordas — a partir da 15 podem vir *Furiosos* ou com *Escudo*.
- **Inimigos variados:** escaladores, aranhas, aríetes, sabotadores que desarmam armadilhas, porta-estandartes que inspiram a horda, elites com afixos (veloz, blindado, vampiro, explosivo, regenerante).
- **Armas:** canhão, balista, lança-chamas, morteiro, tesla, torre de vento, canhão de gelo, catapulta, raio-sol — limitadas por plataformas.
- **Cidadela que cresce sozinha:** expansões por horda, **Alvenaria** que troca blocos por melhores (madeira → aço rúnico), reparo grátis entre hordas, **Égide** (escudo de 7 s), **Óleo fervente**, **Sapadores** que espalham armadilhas, **Canil** com cães de guarda.
- **Distritos** (escolha a cada fase: Ferraria, Torre arcana, Celeiro, Mercado, Caserna, Santuário) e **Maravilhas** para o fim de jogo.
- **Heróis** (Paladina, Arqueira, Mago, Engenheira, Berserker, Sacerdotisa) com habilidades e **talentos** nos níveis 3/6/9.
- **Reino:** fortalezas rivais, alianças (ajude uma cidade cercada e ela vira aliada), covis, ruínas, caravanas, **expedições** de coletores e um **viajante** com tratos arriscados.
- **5 biomas** com regras próprias: Verdes (colheita), Rubro (calor), Gelada (gelo que racha), Vulcânico (erupções), Bruma (horda invisível à noite).
- Conquistas, relíquias, veio de ouro disputado, caçada noturna ao lobo alfa, tesouros enterrados.

## Desenvolvimento
O código fica em `src/` (módulos JS concatenados num único HTML):

```
python3 build.py      # gera index.html (fragmento) e dist/index.html (página completa)
```

Ordem dos módulos: `core, world, entities, units, rival, realm, ui, progress, save, main`.
Registro das rodadas de desenvolvimento em `docs/LOOP.md`. Saves de teste em `tests/` (compatibilidade entre versões).

## Deploy (Coolify)
O repositório tem um `Dockerfile` (nginx servindo `dist/`). No Coolify: novo recurso → este repositório → build pack **Dockerfile** → porta **80**. Lembre de rodar `python3 build.py` e commitar `dist/` antes de cada deploy.

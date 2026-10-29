# Fortrex

Defesa de fortaleza em voxel: você é o general. Contrate minions por função (reparo, coleta, artilharia, soldados, curandeiros), veja o loot cair dos inimigos e ser carregado até o baú, enfrente hordas infinitas e chefes que se despedaçam pedaço por pedaço. No mapa do Reino, outras fortalezas crescem, guerreiam entre si e vêm atrás de você — cada batalha é fortaleza contra fortaleza.

## Jogar
Abra `dist/index.html` num navegador (precisa de internet para carregar three.js e as fontes via CDN).

## Desenvolvimento
O código fica em `src/` (módulos JS concatenados num único HTML):

```
python3 build.py      # gera index.html (fragmento) e dist/index.html (página completa)
```

Ordem dos módulos: `core, world, entities, units, rival, realm, ui, main`.

## Deploy (Coolify)
O repositório tem um `Dockerfile` (nginx servindo `dist/`). No Coolify: novo recurso → este repositório → build pack **Dockerfile** → porta **80**. Lembre de rodar `python3 build.py` e commitar `dist/` antes de cada deploy.

Teclas: `B` construir · `I` arsenal · `U` upgrades · `M` mapa do reino · `Espaço` horda · `F` velocidade · `WASD` câmera

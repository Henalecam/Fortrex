# Fortrex

Defesa de fortaleza em voxel: você é o general. Contrate minions por função (reparo, coleta, artilharia, soldados, curandeiros), veja o loot cair dos inimigos e ser carregado até o baú, enfrente hordas infinitas e chefes que se despedaçam pedaço por pedaço. No mapa do Reino, outras fortalezas crescem, guerreiam entre si e vêm atrás de você — cada batalha é fortaleza contra fortaleza.

## Jogar
Abra `dist/index.html` num navegador (precisa de internet para carregar three.js e as fontes via CDN). Funciona no celular.

**Teclas:** `B` construir · `I` arsenal · `U` upgrades · `M` mapa do reino · `Espaço` horda · `F` velocidade · `WASD` câmera · `H` centralizar · heróis `Q E T G Y O`.

**Sem fim:** perder uma horda não encerra a partida — a cidadela recua uma horda e você navega entre as hordas já alcançadas (‹ › no topo). O jogo **salva sozinho** a cada horda (no navegador). Na tela inicial, **▶ Continuar** retoma a partida; saves antigos continuam valendo depois de atualizações e uma tela de **Novidades** mostra o que mudou.

## O que tem
- **Construção livre:** arraste para fileiras, − / = para altura, Pequenas obras prontas (torre, muro, bunker, ponte, escadaria, arco, campo minado, barricada, vala de espinhos, bastião de canto, torre de arqueiros, portão duplo). Tudo o que você constrói é reconstruído pelos reparadores; o terreno natural se regenera por completo e você constrói por cima dele.
- **Raids** (☠️ no descanso a partir da horda 6, a cada 4 hordas): três ondas de elites insanas, mini-chefes e o Arauto do Abismo; recompensas grandes.
- **Hordas infinitas** com dificuldade crescente (Tranquilo / Normal / Brutal), eventos (bruma, eclipse, lua de sangue, revoada, terremoto, piratas, nevasca, **aurora boreal**…) e chefes a cada 5 hordas — a partir da 15 podem vir *Furiosos* ou com *Escudo*; na 35 (e a cada 20) chega a **Sentinela Rúnica**, com runas explosivas, raio que corta muralhas e escudo. Perder uma horda só faz recuar uma; ‹ › no topo navega entre hordas.
- **Inimigos variados** (corpos em voxels pequenos, despedaçáveis): escaladores, aranhas, aríetes, sabotadores, porta-estandartes, escudeiros, cavadores que passam por baixo das muralhas, bombardeiros voadores, mímicos, golens de cristal, cavaleiros com investida, **Portadores de Bruma** (horda 18+, névoa que protege os vizinhos), **Colossos de Rastejantes** (horda 25+, se dividem ao morrer), elites com afixos (veloz, blindado, vampiro, explosivo, regenerante) e **Campeões** nomeados (horda 8+) com barra de chefe, afixos próprios a partir da 12 (Veloz, Regenerador, Blindado, Furioso) e lendário garantido. Chefes com golpes telegrafados e fases.
- **Armas:** canhão, balista, lança-chamas, morteiro, tesla, torre de vento, canhão de gelo, catapulta, raio-sol — limitadas por plataformas.
- **Estilos de castelo** (Construir → Castelo): Clássico, Cidadela Colossal, Zigurate Solar, Agulhas Góticas, Forte Estrela, Fortaleza Anã, Cidadela Élfica — ao trocar, reparadores e pedreiros desmontam e constroem bloco por bloco.
- **Cidadela que cresce sozinha:** expansões por horda, blocos trocados pelo melhor disponível com Upgrade automático (madeira → aço rúnico), reparo grátis entre hordas, **Égide** (escudo de 7 s), **Óleo fervente**, **Sapadores** que espalham armadilhas, **Canil** com cães de guarda.
- **Distritos** (escolha a cada fase: Ferraria, Torre arcana, Celeiro, Mercado, Caserna, Santuário) e **Maravilhas** para o fim de jogo.
- **Heróis** (Paladina, Arqueira, Mago, Engenheira, Berserker, Sacerdotisa) com habilidades e **talentos** nos níveis 3/6/9.
- **Reino:** fortalezas rivais, alianças (ajude uma cidade cercada e ela vira aliada), covis, ruínas, caravanas, **expedições** de coletores e um **viajante** com tratos arriscados.
- **Climas que vêm e vão** durante a partida (3–5 hordas cada): Estação fértil (colheita), Onda de calor, Inverno rigoroso (lagos congelam e racham), Despertar vulcânico (erupções), Bruma do pântano (horda invisível à noite).
- **Bênçãos** no descanso (horda 4+): escolha 1 de 2 para a próxima horda (Fúria, Muralha firme, Colheita, Olhos de águia, Vigor).
- **Marcos de horda** (10, 20, 30…): estandarte, fogos, +6% de dano permanente e lendário garantido.
- **Códex** (📖 ou C): bestiário com contagem de abates e eventos já vividos; a cada 5 inimigos descobertos, um **selo** com +2% de dano permanente.
- **Renascer** (horda 30+, no Códex): recomece da horda 1 com bônus permanente e título (até 10 vezes).
- **Motivar**: no descanso, toque num minion e motive-o (3 por descanso) para a próxima horda.
- **Prévia da próxima horda** no descanso (tipos, quantidades e chefe) e **renda/gasto** da última horda no 💰.
- **Modo foto** (P): esconde a interface por alguns segundos.
- **Setas de borda** apontam inimigos fora da tela (douradas para chefes/campeões); interface pensada também para celular.
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

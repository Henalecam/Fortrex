# Fortrex — loop de melhoria contínua

Artifact: https://claude.ai/artifact/1GT9715PPQGsP62FmowQhw (publicar sempre o mesmo arquivo `/home/claude/fortrex/index.html`)
Doc de conceito: https://claude.ai/artifact/AaKAfQTXcQZmVohJQb61uc

## Procedimento de cada rodada
1. Escolher 2–4 itens do backlog (prioridade: diversão > caos > conteúdo > polimento).
2. Editar `src/*.js` / `src/index.html` (ordem: core, world, entities, units, rival, ui, main) e rodar `python3 build.py`.
3. `node --check` no bundle (build.py grava em scratchpad/game.js).
4. Teste headless: `cd <scratchpad> && node t5.js 900` (bot joga; olhar erros, `plan` preso, minions presos, baú, economia).
5. Screenshot renderizado: `node shot.js` → ler s1.png / s2.png.
6. Publicar com Artifact (mesmo file_path), avisar o usuário em 1–2 linhas, atualizar este backlog, agendar a próxima rodada (send_later, ~1 min).
7. GitHub (Coolify faz deploy de `main`): `rm -rf ../fortrex-repo/src && cp -r src ../fortrex-repo/src && cp build.py ../fortrex-repo/ && cp -r dist ../fortrex-repo/ && cp LOOP.md ../fortrex-repo/docs/` → commit (autor Henalecam, linhas Co-Authored-By/Claude-Session) → `git push`.
   Build: `FORTREX_SCRATCH=<scratchpad> python3 build.py` (gera index.html, dist/index.html e scratchpad/game.js).

## Feito
- v0.5: código em módulos; sem fogo amigo (explosões/projéteis do jogador ignoram a base e os minions); modo Construir (blocos, especiais, fluidos, armas, remover, cavar); 6 armas (canhão, balista, lança-chamas, morteiro, Tesla, gelo); 15 equipamentos com raridade; 10 blocos especiais; baús do tesouro clicáveis; loot com prioridade por clique; Arsenal; ficha do minion com troca de função e equipamento; Curandeiro; Xamã; chuva de meteoros; reparadores aterram crateras.

- v0.6: mapa 72×72×24 (terreno 5 camadas, morros, 3 lagos de lava, 3 lagos), unidades 1,6× (voxels menores relativamente), muralhas grossas com ameias, torres 5×5×10, renderização só de faces expostas; Construção automática e Upgrade automático (botões no topo); chefes com mecânicas (Devorador cospe ácido, Colosso pisa); combos com bônus de material; críticos e números de dano; forja 3→1; vapor (lava+água) e ponte de gelo; baú ancorado na rocha; drops e limites maiores; coletor "aspirador".
- Testes: `AUTO=1 node nobot.js 4` (sem jogador, automações ligadas) chega à horda 27–28. `node t5.js 900` com bot.
- v0.7.1: controle de velocidade 1×/2×/3×/5× (botão ⏩ e tecla F), simulação em subpassos.
- v0.7: minions com XP e nível (até 30, bônus de dano/vida/trabalho, efeito dourado); evento Tempestade (raios + vento que espalha fogo, choque em quem está na água); upgrade Portal de coleta (loot esquecido voa ao baú); Voadores mergulham para atacar (soldados alcançam); artilheiros sem arma usam arco; anti-travamento de inimigos (pula ou esmaga o chão); projéteis fora do mapa somem; coletores extras quando há muito loot. Sem automação agora chega à horda 24–25; com automação 28.

- v0.9: mapa 128×128×32; cidadela vertical (torre de menagem oca com portão, 2 andares, janelas, 4 pináculos com telhados e estandartes, casas); modos Hordas / Conquista (3 cidades rivais) / Duelo (1 rival, nações renascem); cidades rivais com guardas, torres que atiram nos minions, núcleo vermelho e reconstrução própria; raids rivais (cavaleiros, arqueiros, aríetes); ⚔️ Atacar / 🏳️ Recuar (expedição sai pelo portão, rompe muralhas, destrói núcleo → conquista com tesouro e armas capturadas; retirada automática se todos caírem); construção auto põe minas/espinhos/gelo/barris no caminho real dos inimigos (mapa de calor, barris longe da base); dia/noite (240 s, noites com mais inimigos); só blocos de ambiente se recuperam com o tempo — base e o que o jogador constrói/cava ficam por conta dos reparadores. Testes: `node t6.js` (MODE=conquista|duelo), `node t7.js` (posições), `node shotc.js`.

- v0.10: guerras entre rivais (bandos marcham, lutam com guardas, rompem muralhas, tomam o núcleo; vencedor sobe de nível, tesouro fica no chão); nova geração de rivais 60 s após todos caírem (Conquista e Duelo); chip de força da expedição (nós vs guardas+torres, núcleo x/8, vantagem/perigo); à noite minions ociosos descansam dentro da torre de menagem e se curam; HUD compacto; noites mais escuras. Teste: `node t8.js` (nova rodada), `node t9.js` (descanso).
- v0.10.1: 🎯 alterna a cidade-alvo (câmera + alvo do ⚔️ Atacar); trilha procedural (arpejos pentatônicos, menor à noite, mais rápida em horda/chefe).

- v0.11: um só jogo (sem modos). Mapa 160×160; cidadela no centro. 🗺️ Reino (tecla M): ~10 fortalezas com impérios, guarnição e nível; exércitos marcham, conquistam e fortalecem quem vence; novas fortalezas mais fortes surgem nas bordas. Quando um exército chega até nós (após 220 s de trégua) → fortaleza de cerco ergue-se num dos 4 lados (fortaleza vs fortaleza); declarar guerra pelo mapa faz o mesmo. Conquista → cidade vira sua (+tributo por horda), ruínas somem em 30 s, 160 s de trégua. Inimigos têm corpo em pedaços (voxels) que se soltam com o dano; pernas perdidas = mais lento, cabeça = mais fraco; chefes -20% de vida. Após cada horda a base se reconstrói sozinha (blocos estruturais, grátis); reparadores servem durante a batalha. Soldados ficam fora das muralhas, na frente do portão. Limite de 60 minions. Blocos da base não soltam material (sem farm).

- v0.12: fortaleza inimiga com telhados e estandartes na cor do império; General rival (chefe com coroa, barra de chefe, vida/dano por nível) guarda o núcleo; no Reino, clicar num exército mostra origem, destino, força, guerreiros estimados, chegada e previsão. Teste: `node t11.js` (batalhas seguidas), `node shotb.js`.

- v0.13–0.14: mapa do Reino redesenhado (litoral, rios, lagos, florestas, montanhas, estradas, territórios, castelos com torres/bandeiras, exércitos com estandarte); objetivos secundários (💀 covil de chefe, ⚔️ escaramuça, 💎 ruínas) com tempo para sumir; chance de vitória mostrada e confirmação em 2 passos antes de toda batalha; fortalezas derrotadas SOMEM (sem domínio, sem tributo), o vencedor entre rivais sobe de nível, e quando uma cai outra cresce ou nasce mais forte; o mundo cresce sozinho a cada ~3 min. Recompensas só a cada 5 hordas + 🎁 Recompensa auto; avisos só importantes (r3/r4 ou resposta a clique). Propósito: Renome, 9 títulos (Senhor de Aldeia → Lenda de Fortrex), 3 contratos ativos com progresso no HUD; subir de título dá vagas de minion e recompensa, mas o mundo endurece (vida/quantidade de inimigos por título). Economia: material cai 1× por célula (sem farm de terreno regenerado), drops menores, baús menores, menos itens. Bot (`__bot`) agora ataca fortalezas e aceita objetivos quando a chance é boa; passivo morre ~horda 8, ativo chega à 22 em 30 min.

- v0.15: mapa 192×192 (hordas surgem num anel a ~60 do centro p/ ritmo rápido; descanso 15 s); chefes diferenciados com nível (nv = 1+horda/5) em rodízio: Devorador → Golem de Pedra (arremessa rochas nas armas) → Serpe de Fogo (voa, bolas de fogo) → Colosso → Necromante (ergue esqueletos; escudo de ossos com ≥3 vivos) → Rainha → Titã; 2 chefes a partir da 25. Novos desafios no mapa: 🏆 Desafio de elite, ☄️ Chuva de estrelas (45 s), 🌪️ Cerco relâmpago (até 6 objetivos). Limites: armas instaladas (6 +2 por 🧱 Plataformas +1 a cada 8 hordas), vagas por função (Quartel/Oficina/Escola). Contratar com Posto (Livre/Portão/Norte/Leste/Oeste/Torre) e trocar posto na ficha; soldados/artilheiros priorizam o setor. Desbloqueios por horda (armas, funções, blocos, upgrades; 🔒 na loja/contratação; aviso 🔓). 💰 Venda auto (equipamento inútil e armas sobrando, 25% do valor). Economia: venda e drops bem menores. Bot ativo: horda 19 em 30 min com material <300, base pressionada.

- v0.16 (UI/UX): HUD novo — uma faixa de status (🌊 horda · 💰 material · 👥 minions/feridos · 👾 inimigos · relógio), à direita chip do Reino/Guerra (clique: abre o mapa ou mostra a fortaleza inimiga) e menu ⚙️ Automação com 4 interruptores (substitui 4 botões no topo). Dock único embaixo (ícones; rótulos só em telas largas), Atacar só em guerra, Recuar só com expedição. Removidos: botão Fogo (clique no inimigo já concentra fogo), 🎯, posto ao contratar, avisos dos interruptores. Painéis param acima do dock; no celular viram folha inferior e o dock quebra em 2 linhas. Contratos recolhíveis (clique). Tecla H centraliza. Build mostra armas x/limite; contratar mostra minions x/limite. Loot esquecido voa sozinho ao baú após 75 s; coletores base 7.

- v0.17: novas criaturas com anatomias próprias — 🐺 Lobo (rápido, focinho e cauda), 🕷️ Aranha (8 patas, 6 olhos), 🟢 Gosma (translúcida, se divide em 2 ao morrer), 😈 Diabrete (asas, explode em fogo), 🦍 Bruto (bípede, braços enormes), 🪲 Besouro Blindado (carapaça corta 50% do dano até quebrar). Entram nas hordas a partir das hordas 2–9. Criaturas clássicas ganham variação aleatória (chifres, espinhos, cauda, olho extra, carapaça, tom). Chefes maiores com aura no chão e marcador de impacto antes das rochas/bolas de fogo. Curva tardia mais dura após a 15 (base sob pressão na 18–20). Corrigido: botões com hidden aparecendo.

- v0.18: aranhas escalam muralhas (como escaladores); lobos surgem em matilhas de 3–5 e correm +30% juntos ("Auuu!"); Bruto arromba muralhas/portões como aríete; 🛒 Mercador itinerante a cada 3 hordas (4 ofertas por raridade, fica 2 hordas; o que você compra chega pelo portão e os coletores levam ao baú); cache de geometrias dos modelos (simulação ~10% mais rápida, menos memória). Bot compra do mercador.

- v0.19: Relíquias — cada chefe derrotado dá um bônus permanente que acumula (🦷 Devorador +8% dano, 🪨 Golem reparo +15%, 🐉 Serpe fogo grego, 🦶 Colosso raio de bomba, 📕 Necromante cura +30%, 👑 Rainha sorte, 🌋 Titã crítico), mostradas no painel de contratos. Heroína Aurora, a Paladina (lendária, 2,5× vida, auréola) chega após o 1º chefe; ⭐ Martelo Sagrado (tecla Q, 40 s): dano + atordoamento em área e cura minions próximos. Bot usa a habilidade com 4+ inimigos perto.

- v0.20: eventos de clima (❄️ Nevasca: tudo 30% mais lento, lagos viram gelo; 🌍 Terremoto: tremores, crateras e inimigos derrubados; 🌑 Eclipse: escuro, inimigos +1 raridade, loot melhor). 🛢️ Catapulta (horda 12): barris explosivos em arco com área enorme e fogo. Heróis: Aurora (⭐ Q, 1 relíquia), Lyra a Arqueira (🏹 E, 3 relíquias: 3 rajadas no maior grupo), Orin o Mago (❄️ T, 5 relíquias: nova de gelo). Opção Tremor de tela no menu ⚙️ (salva no navegador). Construção e reparo de graça (só a mão de obra limita); a cidadela cresce sozinha: paliçada (h3) → muralha externa de pedra (h6) → 4 bastiões com +4 vagas de arma (h9) → metal e portão externo (h12) → fosso de água (h15). Venda auto 12%, baús e objetivos dão menos material. Bot: horda 20 em 25 min, material ~1,6k.

- v0.21: heróis ficam mais fortes com o nível (dano/raio +7%/nível, recarga menor; nível no botão). Expansão continua: torres de vigia (h18, +3 vagas de arma), campo de espinhos além do fosso (h21), base de obsidiana e ameias de aço rúnico (h24). Upgrades sem limite (🔱 Forja real, 🛡️ Baluarte) e Upgrade auto agora gasta o material que sobra nas melhorias mais baratas — fim do material acumulado. Curva +5%/horda após a 20. Bot: horda 25 em 30 min, material < 700.

- v0.22: ao juntar 1, 3 e 5 relíquias você ESCOLHE 1 de 2 heróis (Recompensa auto escolhe sozinho); novos heróis: 🔧 Bruna, a Engenheira (G: reergue até 160 blocos e conserta todas as armas) e 🪓 Thor, o Berserker (Y: 8 s de fúria, soldados próximos com dano triplo). Desempenho: A* com carimbo de geração (sem limpar 37 mil células por busca) + atalho em linha reta, regeneração do terreno com varredura limitada, partículas sem Euler, dia/noite a 10 Hz → cena pesada de 9,9 s caiu para 5,7 s.

- v0.23: ☀️ Torre de raio-sol (horda 15): feixe contínuo que esquenta no mesmo alvo (até 4× de dano, incendeia). Tela de escolha de herói revisada (subtítulo próprio). Dificuldade tardia: vida dos inimigos ×1,07 por horda após a 14, mais inimigos após a 18, armadura até 45% (2,5%/horda após a 14) e +1,5% de velocidade por horda após a 12. Bot (todas as automações + heróis): horda 27 em 30 min, base cedendo a partir da 24–27.

- v0.24: ficha do herói (habilidade, tecla, recarga, botão de usar, história; sem troca de função). Diabretes imunes a fogo e se curam na lava. Lobos caçam minions que estão fora das muralhas (dano +40% em matilha). Bot: horda 22 em 25 min.

- v0.25: biomas sorteados a cada partida — 🌿 Campos Verdes, 🏜️ Deserto Rubro (areia, poucos lagos, mais morros), ❄️ Tundra Gelada (neve, lagos congelados, pinheiros), 🐸 Pântano da Bruma (lodo, muitos lagos). 🎬 Câmera de chefe: aproxima e gira quando um chefe cai (opção no menu ⚙️).

- v0.26: biomas mudam o jogo — 🏜️ Deserto tem 🌪️ Tempestade de areia (armas enxergam 35% menos, inimigos +12% de velocidade) e nunca nevasca; ❄️ Tundra tem nevasca 4× mais comum; 🐸 Pântano tem bruma 4× mais comum e lama que deixa inimigos terrestres 12% mais lentos.

## Backlog (próximas rodadas)
- [ ] Minions: necessidades leves (moral/descanso) que afetam rendimento
Ciclo de cada rodada: 1) testar (t5 1500 com bot ativo + t11) e medir (horda alcançada, material, plan, loot, renome); 2) pensar 1–2 features novas da lista abaixo; 3) aplicar; 4) refinar com screenshot; 5) publicar + push.
- [ ] Ficha do minion e Arsenal no estilo HUD v0.16; tooltips de comparação
- [ ] Reino: mensagens de embaixada (tributo/aliança)
- [ ] Mercador de barco com loja rotativa
- [ ] Desempenho no mapa 160: medir FPS real; LOD de sombras
- [ ] Expedição: bandeira de rally
- [ ] Diplomacia leve: tributo para adiar raid, aliança temporária contra o mais forte
- [ ] Balanceamento: agora fácil demais (horda 25+ sem perder) → curva dura após 12, chefes novos a cada 15 (Rainha da Bruma que invoca, Titã de lava), modo Pesadelo
- [ ] Mercador de barco: vende/compra itens; loja rotativa com raridades
- [ ] Combos de elementos: água + Tesla já existe; óleo inflamável, vapor (água+lava fere), gelo sobre água vira ponte
- [ ] Pets/monturas lendárias, minions com nível/XP e kill count visível
- [ ] Juice: confete em lendário
- [ ] Mobile: botões maiores, toque longo para remover
- [ ] Salvar partida (localStorage) e recorde
- [ ] Desempenho: medir FPS real com muitos inimigos; reduzir sombras se preciso

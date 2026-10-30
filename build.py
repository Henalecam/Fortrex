# Build Fortrex: concatenates src/*.js into the HTML template.
#   index.html       → page fragment published as the Claude artifact
#   dist/index.html  → full standalone document for static hosting (Coolify/nginx)
import os
order=['core','world','entities','units','rival','realm','ui','progress','save','main']
js='\n'.join(open(f'src/{n}.js').read() for n in order)
html=open('src/index.html').read().replace('/*JS*/','(function(){\n'+js+'\n})();')
open('index.html','w').write(html)
os.makedirs('dist',exist_ok=True)
open('dist/index.html','w').write('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n'+html+'\n</body>\n</html>\n')
sp=os.environ.get('FORTREX_SCRATCH')
if sp:open(os.path.join(sp,'game.js'),'w').write(js)
print('built',len(html))

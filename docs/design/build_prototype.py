
import json,re
imgs=json.load(open('img/imgs.json')); cards=json.load(open('prod/cards.json'))
IM={}
for k in ['cwa','mt','af','cc']:
    for sfx in ['_o','_t']: IM[k+sfx]={'b64':imgs[k+sfx]['b64']}
for k,v in cards.items(): IM[k]={'b64':v['b64']}
t=open('proto.tpl.html').read()
svg=open('img/logo_vert.svg').read()
body=re.search(r'<svg[^>]*>(.*)</svg>',svg,re.S).group(1)
body=re.sub(r'<defs>.*?</defs>','',body,flags=re.S);body=re.sub(r'<!--.*?-->','',body,flags=re.S)
body=body.replace('class="st0"','class="lg0"').replace('class="st1"','class="lg1"').replace('class="st2"','class="lg2"');body=re.sub(r'\s+',' ',body).strip()
logo='<svg class="lgo" viewBox="44 359 524 74" role="img" aria-label="ItalTherm">'+body+'</svg>'
t=t.replace('__IMG__',json.dumps(IM,separators=(',',':'))).replace('__LOGO__',logo.replace("'","\\'"))
open('proto.html','w').write(t);print(len(t))

import re,json,sys
from bs4 import BeautifulSoup
def txt(el):
    for br in el.find_all('br'): br.replace_with('\n')
    return re.sub(r'[ \t]+',' ',el.get_text()).strip()
out={}
for n in ['kb','cc','af','bf','cwa','gt','gms','gmb','mt','sm','fm']:
    s=BeautifulSoup(open(f'p-{n}.html').read(),'html.parser')
    d={}
    d['title']=txt(s.select_one('.product_title'))
    d['short']=[ (el.name, txt(el)) for el in s.select_one('.woocommerce-product-details__short-description').find_all(['p','h4','h3','ul','li','a'],recursive=False)] if s.select_one('.woocommerce-product-details__short-description') else []
    d['short_links']=[a['href'] for a in s.select('.woocommerce-product-details__short-description a[href]')]
    tabs=[]
    for p in s.select('.woocommerce-Tabs-panel'):
        t=[]
        for tb in p.select('table'):
            rows=[[txt(c) for c in r.find_all(['th','td'])] for r in tb.find_all('tr')]
            t.append(rows); tb.decompose()
        tabs.append({'id':p.get('id'),'text':txt(p),'tables':t})
    d['tabs']=tabs
    d['tab_titles']=[txt(a) for a in s.select('.wc-tabs a')]
    d['meta']=txt(s.select_one('.product_meta')) if s.select_one('.product_meta') else ''
    d['imgs']=sorted(set(re.findall(r'https://ital-therm\.it/wp-content/uploads/[^"\' )]+\.(?:jpg|jpeg|png|webp)',str(s.select_one('.woocommerce-product-gallery') or ''))))
    out[n]=d
json.dump(out,open('products.json','w'),ensure_ascii=False,indent=1)
for n,d in out.items():
    print('=====',n,'|',d['title']);print('SHORT:',d['short']);print('TABS:',[(t['id'],t['text'][:200],t['tables']) for t in d['tabs']]);print('META:',d['meta']);print('IMGS:',d['imgs'])

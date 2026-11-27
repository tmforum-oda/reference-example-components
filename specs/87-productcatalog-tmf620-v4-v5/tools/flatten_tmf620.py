"""Flatten TMF620 v4 (Swagger 2) and v5 (OAS 3) resource schemas into attribute paths.

Usage: python -P flatten.py <v4 swagger.yaml> <v5 oas.yaml> <out_dir>
Writes <out_dir>/v4_<Res>.txt, v5_<Res>.txt and diff_<Res>.txt
"""
import sys, os, yaml

V4, V5, OUT = sys.argv[1:4]
v4 = yaml.safe_load(open(V4, encoding='utf8'))['definitions']
v5doc = yaml.safe_load(open(V5, encoding='utf8'))
v5 = v5doc['components']['schemas']

MAXDEPTH = 4


def refname(r):
    return r.split('/')[-1]


def props(schemas, name, seen=()):
    """Merged properties + required of a schema, following allOf. Returns (props, required, discriminator mapping)."""
    s = schemas[name]
    out, req, disc = {}, set(s.get('required', [])), {}
    for part in s.get('allOf', []):
        if '$ref' in part:
            p, r, _ = props(schemas, refname(part['$ref']), seen + (name,))
            out.update(p); req |= r
        else:
            out.update(part.get('properties', {})); req |= set(part.get('required', []))
    out.update(s.get('properties', {}))
    if 'discriminator' in s:
        disc = s['discriminator'].get('mapping', {})
    return out, req, disc


def typeof(schemas, p):
    if '$ref' in p:
        return 'ref', refname(p['$ref'])
    if 'oneOf' in p or 'anyOf' in p:
        return 'union', [refname(x['$ref']) if '$ref' in x else x.get('type') for x in p.get('oneOf', p.get('anyOf'))]
    if p.get('type') == 'array':
        return 'array', p['items']
    t = p.get('type', 'any')
    if p.get('format'): t += '(' + p['format'] + ')'
    if p.get('enum'): t += ' enum' + str(p['enum'])
    return 'prim', t


def walk(schemas, name, prefix, depth, lines, stack):
    if name not in schemas:
        lines.append(f'{prefix} -> ?{name}'); return
    s = schemas[name]
    if 'oneOf' in s:  # RefOrValue / PartyRefOrPartyRoleRef style
        members = [refname(x['$ref']) for x in s['oneOf']]
        lines.append(f'{prefix} = oneOf{members}')
        for m in members:
            if depth < MAXDEPTH and m not in stack:
                walk(schemas, m, f'{prefix}<{m}>', depth + 1, lines, stack + (m,))
        return
    if 'enum' in s or s.get('type') in ('string', 'number', 'integer', 'boolean') and 'properties' not in s and 'allOf' not in s:
        lines.append(f'{prefix} : {s.get("type")} {s.get("enum", "")}'); return
    p, req, disc = props(schemas, name)
    for k in sorted(p):
        kind, t = typeof(schemas, p[k])
        path = f'{prefix}.{k}' if prefix else k
        star = '*' if k in req else ''
        ro = ' readOnly' if p[k].get('readOnly') else ''
        if kind == 'prim':
            lines.append(f'{path}{star} : {t}{ro}')
        elif kind == 'ref':
            lines.append(f'{path}{star} : {t}')
            if depth < MAXDEPTH and t not in stack:
                walk(schemas, t, path, depth + 1, lines, stack + (t,))
        elif kind == 'union':
            lines.append(f'{path}{star} : oneOf{t}')
        else:  # array
            ik, it = typeof(schemas, t)
            lines.append(f'{path}{star} : [{it if ik != "union" else "oneOf" + str(it)}]')
            if ik == 'ref' and depth < MAXDEPTH and it not in stack:
                walk(schemas, it, path + '[]', depth + 1, lines, stack + (it,))


RES = [('Catalog', 'ProductCatalog'), ('Category', 'Category'), ('ProductOffering', 'ProductOffering'),
       ('ProductOfferingPrice', 'ProductOfferingPrice'), ('ProductSpecification', 'ProductSpecification')]
os.makedirs(OUT, exist_ok=True)
for r4, r5 in RES:
    for tag, schemas, name in (('v4', v4, r4), ('v5', v5, r5)):
        for variant in ('', '_Create' if tag == 'v4' else '_FVO'):
            n = name + variant
            if n not in schemas: continue
            lines = []
            walk(schemas, n, '', 0, lines, (n,))
            open(os.path.join(OUT, f'{tag}_{n}.txt'), 'w', encoding='utf8').write('\n'.join(lines) + '\n')
    # top-level diff (depth 0 and 1 attribute names, ignoring types)
    def names(schemas, n):
        L = []; walk(schemas, n, '', 0, L, (n,))
        return {l.split(' ')[0].rstrip('*') for l in L}
    a, b = names(v4, r4), names(v5, r5)
    with open(os.path.join(OUT, f'diff_{r4}.txt'), 'w', encoding='utf8') as f:
        f.write('# only in v4\n' + '\n'.join(sorted(a - b)) + '\n# only in v5\n' + '\n'.join(sorted(b - a)) + '\n')
print('ok')

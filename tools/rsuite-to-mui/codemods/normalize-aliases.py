"""`const {Group, Label, Control} = RForm` hides the same shape form-control.mjs
already converts. Normalise the aliases to the dotted names so it can see them.
"""
import re, sys

for p in sys.argv[1:]:
    s = open(p).read()
    m = re.search(r"const \{([^}]*)\} = R?Form;\n", s)
    if not m:
        continue
    alias = {}
    for part in m.group(1).split(','):
        part = part.strip()
        if not part:
            continue
        if ':' in part:
            real, local = [x.strip() for x in part.split(':')]
        else:
            real = local = part
        alias[local] = real
    for local, real in alias.items():
        s = re.sub(r"<" + local + r"(?=[\s/>])", f"<Form.{real}", s)
        s = re.sub(r"</" + local + r">", f"</Form.{real}>", s)
    s = s.replace(m.group(0), "")
    s = re.sub(r"<R?Form\.Stack[^>]*>", "<Form.Stack>", s)
    s = re.sub(r"</R?Form\.Stack>", "</Form.Stack>", s)
    open(p, 'w').write(s)
    print('normalised', p)

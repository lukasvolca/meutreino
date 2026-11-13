"""Publica o MeuTreino na HostGator via cPanel UAPI (Fileman/upload_files).

  python scripts/deploy.py api        → envia api/ (inclui config.php local)
  python scripts/deploy.py web        → envia o app estático (out/)
  python scripts/deploy.py all

Credenciais: lidas de um JSON local fora do repositório. Nada é impresso.
"""
import json, mimetypes, os, ssl, sys, uuid, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Caminho do JSON com {"hostgator": {"usuario", "apiToken"}}: variável MEUTREINO_CPANEL_CONFIG
# ou scripts/.deploy.local.json ({"config": "<caminho>"}), que fica fora do git.
_local = os.path.join(ROOT, 'scripts', '.deploy.local.json')
CFG = os.environ.get('MEUTREINO_CPANEL_CONFIG') or (json.load(open(_local, encoding='utf-8'))['config'] if os.path.exists(_local) else '')
if not CFG:
    raise SystemExit('Defina MEUTREINO_CPANEL_CONFIG ou crie scripts/.deploy.local.json')
HOST = 'volca.com.br'
DOCROOT = 'treino.volca.com.br'          # relativo ao home do cPanel
NUNCA = {'.DS_Store', 'Thumbs.db'}

_hg = json.load(open(CFG, encoding='utf-8'))['hostgator']
_AUTH = {'Authorization': f"cpanel {_hg['usuario']}:{_hg['apiToken']}"}
_HOME = f"/home1/{_hg['usuario']}"
_CTX = ssl.create_default_context()


def _req(url, data=None, headers=None, method='GET'):
    h = dict(_AUTH); h.update(headers or {})
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=180, context=_CTX) as resp:
        return json.load(resp)


def mkdir(parent_rel, name):
    q = urllib.parse.urlencode({'cpanel_jsonapi_apiversion': 2, 'cpanel_jsonapi_module': 'Fileman',
                                'cpanel_jsonapi_func': 'mkdir', 'path': f'{_HOME}/{parent_rel}', 'name': name})
    try:
        _req(f'https://{HOST}:2083/json-api/cpanel?{q}', data=b'', method='POST')
    except Exception:
        pass  # já existe


def upload(local_dir, remote_rel, files):
    """Envia em lotes de até 40 arquivos para a mesma pasta remota."""
    total = 0
    for i in range(0, len(files), 40):
        lote = files[i:i + 40]
        boundary = uuid.uuid4().hex
        parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="dir"\r\n\r\n{_HOME}/{remote_rel}\r\n'.encode(),
                 f'--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\n1\r\n'.encode()]
        for n, f in enumerate(lote, 1):
            ctype = mimetypes.guess_type(f)[0] or 'application/octet-stream'
            data = open(os.path.join(local_dir, f), 'rb').read()
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file-{n}"; filename="{f}"\r\n'
                         f'Content-Type: {ctype}\r\n\r\n'.encode() + data + b'\r\n')
        parts.append(f'--{boundary}--\r\n'.encode())
        out = _req(f'https://{HOST}:2083/execute/Fileman/upload_files', data=b''.join(parts),
                   headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='POST')
        if out.get('status') != 1:
            raise SystemExit(f'upload em {remote_rel} falhou: {out.get("errors")}')
        falhas = [u.get('file') for u in out['data'].get('uploads', []) if u.get('status') != 1]
        if falhas:
            raise SystemExit(f'arquivos falharam em {remote_rel}: {falhas}')
        total += out['data'].get('succeeded', len(lote))
    return total


def upload_tree(local_root, remote_root, skip=lambda rel: False):
    n = 0
    for dirpath, dirnames, filenames in os.walk(local_root):
        rel = os.path.relpath(dirpath, local_root).replace('\\', '/')
        remote = remote_root if rel == '.' else f'{remote_root}/{rel}'
        if rel != '.':
            parent, name = remote.rsplit('/', 1)
            mkdir(parent, name)
        files = [f for f in filenames if f not in NUNCA and not skip(f'{rel}/{f}'.lstrip('./'))]
        if files:
            n += upload(dirpath, remote, files)
            print(f'  {remote}: {len(files)} arquivo(s)')
    return n


def deploy_api():
    api = os.path.join(ROOT, 'api')
    if not os.path.exists(os.path.join(api, 'config.php')):
        raise SystemExit('api/config.php não existe — rode a criação do banco primeiro')
    mkdir(DOCROOT, 'api')
    files = [f for f in os.listdir(api) if os.path.isfile(os.path.join(api, f)) and f not in ('config.example.php',)]
    upload(api, f'{DOCROOT}/api', files)
    print(f'api: {len(files)} arquivo(s) enviados')


def deploy_web():
    out = os.path.join(ROOT, 'out')
    if not os.path.isdir(out):
        raise SystemExit('out/ não existe — rode `npm run build` antes')
    n = upload_tree(out, DOCROOT)
    print(f'web: {n} arquivo(s) enviados')


if __name__ == '__main__':
    alvo = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if alvo in ('api', 'all'):
        deploy_api()
    if alvo in ('web', 'all'):
        deploy_web()

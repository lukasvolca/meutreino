"""Gera os ícones do MeuTreino (tela inicial, iPhone, aba do navegador) a partir de um
único desenho: halter inclinado verde-limão sobre fundo escuro.
Uso: python scripts/gerar-icones.py   (precisa de Pillow)
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIME = (204, 255, 0, 255)
BG_TOP, BG_BOT = (24, 27, 34), (8, 9, 12)
S = 2048                     # desenha grande e reduz (bordas suaves)

# Halter na horizontal, centrado em (0,0), unidades do canvas de 1024. [x0, x1, altura, raio]
PECAS = [
    (-200, 200, 64, 32),      # pegada (passa por baixo das anilhas)
    (-262, -178, 330, 34),    # anilha grande esq.
    (178, 262, 330, 34),      # anilha grande dir.
    (-330, -270, 230, 28),    # anilha pequena esq.
    (270, 330, 230, 28),
    (-372, -338, 96, 16),     # ponta esq.
    (338, 372, 96, 16),
]
ANGULO = 45                  # graus (sobe para a direita)


def fundo(size):
    img = Image.new('RGBA', (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(round(BG_TOP[i] * (1 - t) + BG_BOT[i] * t) for i in range(3))
        d.line([(0, y), (size, y)], fill=c + (255,))
    return img


def halter(size, escala=1.0):
    k = size / 1024 * escala
    lay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    cx = cy = size / 2
    for x0, x1, h, r in PECAS:
        d.rounded_rectangle([cx + x0 * k, cy - h / 2 * k, cx + x1 * k, cy + h / 2 * k], radius=r * k, fill=LIME)
    return lay.rotate(ANGULO, resample=Image.BICUBIC, center=(cx, cy))


def icone(size, cantos=0.0, escala=1.0):
    """cantos: raio relativo (0 = quadrado inteiro, p/ ícones que o sistema recorta)."""
    img = fundo(S)
    # brilho verde suave atrás do halter
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([S * .22, S * .22, S * .78, S * .78], fill=(204, 255, 0, 46))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(S * .09)))
    img = Image.alpha_composite(img, halter(S, escala))
    if cantos:
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=S * cantos, fill=255)
        img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)


def svg():
    """Mesmo desenho em SVG (aba do navegador nítida em qualquer tela)."""
    rects = ''.join(
        f'<rect x="{512 + x0}" y="{512 - h / 2}" width="{x1 - x0}" height="{h}" rx="{r}"/>' for x0, x1, h, r in PECAS)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb{BG_TOP}"/><stop offset="1" stop-color="rgb{BG_BOT}"/></linearGradient></defs>
<rect width="1024" height="1024" rx="230" fill="url(#g)"/>
<g fill="#CCFF00" transform="rotate(-{ANGULO} 512 512)">{rects}</g>
</svg>
'''


if __name__ == '__main__':
    pub = os.path.join(ROOT, 'public')
    # Android/PWA: quadrado inteiro (o sistema aplica a máscara); halter dentro da área segura
    icone(512).save(os.path.join(pub, 'icon-512.png'), optimize=True)
    icone(192).save(os.path.join(pub, 'icon-192.png'), optimize=True)
    # iPhone: quadrado inteiro (o iOS arredonda sozinho)
    icone(180).convert('RGB').save(os.path.join(pub, 'apple-touch-icon.png'), optimize=True)
    # Aba do navegador: cantos arredondados, halter maior para ler em 16px
    fav = icone(256, cantos=0.22, escala=1.18)
    fav.save(os.path.join(ROOT, 'src', 'app', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
    open(os.path.join(pub, 'icon.svg'), 'w', encoding='utf-8').write(svg())
    icone(1024, cantos=0.22).save(os.path.join(ROOT, 'scripts', 'icone-preview.png'))
    print('ícones gerados')

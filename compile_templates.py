import os
from jinja2 import Environment, FileSystemLoader
from datetime import datetime
import shutil

SITE_URL = "https://rodriguestmo.github.io/calculo-tornado-facil"

PAGE_META = {
    "index.html": {
        "page_title": "Cálculo Tornado Fácil | Silvanus P. Thompson (PT-BR)",
        "page_description": (
            "Tradução pública e gratuita para português brasileiro de Calculus Made Easy, "
            "o clássico de Silvanus P. Thompson. Aprenda cálculo diferencial e integral de forma "
            "simples. Projeto sem fins lucrativos por Thales Rodrigues."
        ),
        "page_path": "index.html",
        "og_type": "website",
    },
    "prologue.html": {
        "page_title": "Prólogo | Cálculo Tornado Fácil",
        "page_description": (
            "Prólogo de Calculus Made Easy em português: o que um tolo consegue, outro também "
            "consegue. Introdução ao cálculo sem terror, por Silvanus P. Thompson."
        ),
        "page_path": "prologue.html",
        "og_type": "article",
    },
    "1.html": {
        "page_title": "Terrores Preliminares | Cálculo Tornado Fácil - Cap. I",
        "page_description": (
            "Capítulo I: para livrá-lo dos terrores preliminares. O significado de d e da integral "
            "em linguagem simples."
        ),
        "page_path": "1.html",
        "og_type": "article",
    },
    "2.html": {
        "page_title": "Graus de Pequenez | Cálculo Tornado Fácil - Cap. II",
        "page_description": "Capítulo II: sobre diferentes graus de pequenez e quantidades infinitesimais.",
        "page_path": "2.html",
        "og_type": "article",
    },
    "3.html": {
        "page_title": "Crescimentos Relativos | Cálculo Tornado Fácil - Cap. III",
        "page_description": "Capítulo III: sobre crescimentos relativos e a ideia de derivada.",
        "page_path": "3.html",
        "og_type": "article",
    },
    "4.html": {
        "page_title": "Casos Mais Simples | Cálculo Tornado Fácil - Cap. IV",
        "page_description": "Capítulo IV: os casos mais simples de diferenciação.",
        "page_path": "4.html",
        "og_type": "article",
    },
    "5.html": {
        "page_title": "Constantes | Cálculo Tornado Fácil - Cap. V",
        "page_description": "Capítulo V: o que fazer com constantes na diferenciação.",
        "page_path": "5.html",
        "og_type": "article",
    },
    "6.html": {
        "page_title": "Somas, Produtos e Quocientes | Cálculo Tornado Fácil - Cap. VI",
        "page_description": "Capítulo VI: somas, diferenças, produtos e quocientes na diferenciação.",
        "page_path": "6.html",
        "og_type": "article",
    },
    "7.html": {
        "page_title": "Diferenciação Sucessiva | Cálculo Tornado Fácil - Cap. VII",
        "page_description": "Capítulo VII: diferenciação sucessiva e derivadas de ordem superior.",
        "page_path": "7.html",
        "og_type": "article",
    },
    "8.html": {
        "page_title": "Quando o Tempo Varia | Cálculo Tornado Fácil - Cap. VIII",
        "page_description": "Capítulo VIII: diferenciação quando o tempo varia; velocidade e aceleração.",
        "page_path": "8.html",
        "og_type": "article",
    },
    "9.html": {
        "page_title": "Um Truque Útil | Cálculo Tornado Fácil - Cap. IX",
        "page_description": "Capítulo IX: apresentando um truque útil na diferenciação.",
        "page_path": "9.html",
        "og_type": "article",
    },
    "10.html": {
        "page_title": "Significado Geométrico | Cálculo Tornado Fácil - Cap. X",
        "page_description": "Capítulo X: significado geométrico da diferenciação e inclinação da tangente.",
        "page_path": "10.html",
        "og_type": "article",
    },
    "11.html": {
        "page_title": "Máximos e Mínimos | Cálculo Tornado Fácil - Cap. XI",
        "page_description": "Capítulo XI: máximos e mínimos com cálculo diferencial.",
        "page_path": "11.html",
        "og_type": "article",
    },
    "12.html": {
        "page_title": "Curvatura de Curvas | Cálculo Tornado Fácil - Cap. XII",
        "page_description": "Capítulo XII: curvatura de curvas.",
        "page_path": "12.html",
        "og_type": "article",
    },
    "13.html": {
        "page_title": "Outros Truques Úteis | Cálculo Tornado Fácil - Cap. XIII",
        "page_description": "Capítulo XIII: outros truques úteis no cálculo.",
        "page_path": "13.html",
        "og_type": "article",
    },
    "14.html": {
        "page_title": "Juros Compostos e Crescimento | Cálculo Tornado Fácil - Cap. XIV(a)",
        "page_description": "Capítulo XIV(a): juros compostos verdadeiros e a lei do crescimento orgânico.",
        "page_path": "14.html",
        "og_type": "article",
    },
    "14b.html": {
        "page_title": "Curva de Decaimento | Cálculo Tornado Fácil - Cap. XIV(b)",
        "page_description": "Capítulo XIV(b): a curva de decaimento.",
        "page_path": "14b.html",
        "og_type": "article",
    },
    "15.html": {
        "page_title": "Senos e Cossenos | Cálculo Tornado Fácil - Cap. XV",
        "page_description": "Capítulo XV: como lidar com senos e cossenos no cálculo.",
        "page_path": "15.html",
        "og_type": "article",
    },
    "16.html": {
        "page_title": "Diferenciação Parcial | Cálculo Tornado Fácil - Cap. XVI",
        "page_description": "Capítulo XVI: diferenciação parcial.",
        "page_path": "16.html",
        "og_type": "article",
    },
    "17.html": {
        "page_title": "Integração | Cálculo Tornado Fácil - Cap. XVII",
        "page_description": "Capítulo XVII: integração, o processo inverso da diferenciação.",
        "page_path": "17.html",
        "og_type": "article",
    },
    "18.html": {
        "page_title": "Integrar como Inverso | Cálculo Tornado Fácil - Cap. XVIII",
        "page_description": "Capítulo XVIII: integrar como o inverso de diferenciar.",
        "page_path": "18.html",
        "og_type": "article",
    },
    "19.html": {
        "page_title": "Áreas por Integração | Cálculo Tornado Fácil - Cap. XIX",
        "page_description": "Capítulo XIX: sobre achar áreas integrando.",
        "page_path": "19.html",
        "og_type": "article",
    },
    "20.html": {
        "page_title": "Truques e Armadilhas | Cálculo Tornado Fácil - Cap. XX",
        "page_description": "Capítulo XX: truques, armadilhas e triunfos na integração.",
        "page_path": "20.html",
        "og_type": "article",
    },
    "21.html": {
        "page_title": "Encontrando Soluções | Cálculo Tornado Fácil - Cap. XXI",
        "page_description": "Capítulo XXI: encontrando algumas soluções.",
        "page_path": "21.html",
        "og_type": "article",
    },
    "epilogue.html": {
        "page_title": "Epílogo e Apólogo | Cálculo Tornado Fácil",
        "page_description": "Epílogo e apólogo de Cálculo Tornado Fácil.",
        "page_path": "epilogue.html",
        "og_type": "article",
    },
    "table.html": {
        "page_title": "Tabela de Formas-Padrão | Cálculo Tornado Fácil",
        "page_description": "Tabela de formas-padrão de derivadas e integrais.",
        "page_path": "table.html",
        "og_type": "article",
    },
}

PARTIALS = {
    "seo_head.html",
    "toolbar.html",
    "footer.html",
    "googleanalytics.html",
    "buy_solutions.html",
}


def process_directory():
    env = Environment(loader=FileSystemLoader("templates"))
    global_vars = {
        "year": datetime.now().year,
        "site_url": SITE_URL,
    }
    os.makedirs("public", exist_ok=True)

    for root, _, files in os.walk("templates"):
        for file in files:
            template_path = os.path.join(root, file)
            relative_path = os.path.relpath(template_path, "templates")
            output_dir = os.path.join("public", os.path.dirname(relative_path))
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join("public", relative_path)

            if file in PARTIALS:
                continue

            if file.endswith((".html", ".htm")):
                try:
                    template = env.get_template(relative_path)
                    page_vars = dict(global_vars)
                    meta = PAGE_META.get(relative_path)
                    if meta:
                        page_vars.update(meta)
                    else:
                        page_vars.setdefault("page_title", "Cálculo Tornado Fácil")
                        page_vars.setdefault(
                            "page_description",
                            "Calculus Made Easy em português - Cálculo Tornado Fácil.",
                        )
                        page_vars.setdefault("page_path", relative_path)
                        page_vars.setdefault("og_type", "website")
                    output = template.render(**page_vars)
                    with open(output_path, "w", encoding="utf-8") as f:
                        f.write(output)
                    print(f"Processed: {relative_path}")
                except Exception as e:
                    print(f"Error processing {relative_path}: {str(e)}")
            else:
                shutil.copy2(template_path, output_path)
                print(f"Copied: {relative_path}")


if __name__ == "__main__":
    process_directory()

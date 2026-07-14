import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from datetime import datetime
import shutil

SITE_URL = "https://rodriguestmo.github.io/calculo-tornado-facil"

# Metadados por página (SEO)
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
            "em linguagem simples. Cálculo Tornado Fácil em português."
        ),
        "page_path": "1.html",
        "og_type": "article",
    },
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

            # Partials só entram via include; não viram páginas em public/
            partials = {
                "seo_head.html",
                "toolbar.html",
                "footer.html",
                "googleanalytics.html",
                "buy_solutions.html",
            }
            if file in partials:
                continue

            if file.endswith((".html", ".htm")):
                try:
                    template = env.get_template(relative_path)
                    page_vars = dict(global_vars)
                    meta = PAGE_META.get(relative_path)
                    if meta:
                        page_vars.update(meta)
                    else:
                        page_vars.setdefault(
                            "page_title", "Cálculo Tornado Fácil"
                        )
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

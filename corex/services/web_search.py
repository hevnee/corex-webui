from requests import get
from bs4 import BeautifulSoup
from ..utils import get_useragent
from urllib.parse import unquote


def _request(query):
    response = get(
        url="https://google.com/search",
        params={
            "q": query,
            "hl": "en"
        },
        headers={
            "User-Agent": get_useragent(),
            "Accept": "*/*"
        },
        cookies={
            'CONSENT': 'PENDING+987',
            'SOCS': 'CAESHAgBEhIaAB'
        }
    )
    response.raise_for_status()
    return response


def search(query: str) -> list[dict[str]]:
    response = _request(query)
    results = []

    soup = BeautifulSoup(response.text, "html.parser")
    all_links = soup.find_all("div", class_="ezO2md")

    for link in all_links:
        title_tag = link.find("span", class_="CVA68e")
        url_tag = link.find("a", href=True)
        description_tag = link.find("span", class_="FrIlee")

        url = unquote(url_tag["href"].split("&")[0].replace("/url?q=", "")) if url_tag else None
        if url and not url.startswith("https://"):
            continue

        title = title_tag.text if title_tag else None
        description = description_tag.text.strip() if description_tag else None

        if title and url and description:
            results.append({"title": title, "url": url, "description": description})

    return results
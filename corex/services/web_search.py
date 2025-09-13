from requests import get
from bs4 import BeautifulSoup
from ..utils import get_useragent


def _request(query):
    response = get(
        url="https://duckduckgo.com/html",
        params={
            "q": query
        },
        headers={
            "User-Agent": get_useragent(),
            "Accept": "*/*"
        }
    )
    response.raise_for_status()
    return response


def search(query: str) -> list[dict[str, str]]:
    response = _request(query)
    results = []

    soup = BeautifulSoup(response.text, "html.parser")
    all_links = soup.find_all("div", class_="links_main")

    for link in all_links:
        title_tag = link.find("a", class_="result__a")
        url_tag = link.find("a", class_="result__url")
        snippet_tag = link.find("a", class_="result__snippet")
        
        title = title_tag.text if title_tag else None
        url = url_tag.text.strip() if url_tag else None
        snippet = snippet_tag.text if snippet_tag else None
        
        if title and url and snippet:
            results.append({"title": title, "url": url, "snippet": snippet})

    return results
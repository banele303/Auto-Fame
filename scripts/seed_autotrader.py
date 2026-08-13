"""
AutoTrader listing -> Convex seed pipeline.
Scrapes a listing page, downloads full-size photos, uploads to Convex storage,
resolves storage URLs, then creates the dealership + car via HTTP API.
"""
import json
import re
import sys
import time
import urllib.parse

import requests

CONVEX_URL = "https://reliable-sturgeon-574.convex.cloud"
LISTING_URL = (
    "https://www.autotrader.co.za/car-for-sale/renault/sandero/stepway/28682390"
    "?vf=6&db=0&s360=0&so=0&pl=0&pr=2&po=1&pq=0&sp=1"
)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    )
}


def scrape_listing() -> dict:
    r = requests.get(LISTING_URL, headers=HEADERS, timeout=60)
    r.raise_for_status()
    raw = r.text

    # --- JSON-LD structured data ---
    m = re.search(r'"description": "(Discover[^"]+)"', raw)
    description = m.group(1).encode().decode("unicode_escape") if m else ""

    m = re.search(r'"modelDate":\s*"(\d{4})-', raw)
    model_date = m.group(1) if m else None

    m = re.search(r'"name":\s*"(\d{4}) Renault Sandero Stepway 1\.6"', raw)
    name_year = m.group(1) if m else None

    # --- pageParameters (ground truth key/values) ---
    params = {}
    for m in re.findall(r"""pageParameters\[(['"])(.*?)\1\]\s*=\s*(['"])(.*?)\3""", raw):
        params[m[1]] = m[3]

    # --- unique image IDs -> full size ---
    image_ids = sorted(set(re.findall(r"img\.autotrader\.co\.za/(\d+)", raw)))
    photos = [f"https://img.autotrader.co.za/{i}/Crop1280x960" for i in image_ids]

    return {
        "make": params.get("make", "Renault"),
        "model": params.get("model", "Sandero"),
        "variant": params.get("variant", "Stepway 1.6"),
        "year": int(params.get("year") or model_date or name_year or 2019),
        "price": int(params.get("price", "0").replace(" ", "")),
        "mileage": int(params.get("mileage", "0").replace(" ", "")),
        "condition": params.get("vehicle_type", "Used").upper(),  # USED
        "body_type": params.get("body_type", "Hatchback").upper(),  # HATCHBACK
        "fuel_type": params.get("fuel_type", "Petrol").upper(),  # PETROL
        "transmission": params.get("gearbox", "Manual").upper(),  # MANUAL
        "engine_capacity": params.get("engine_capacity", "1600"),  # 1600
        "colour": params.get("colour", "Red"),
        "driven_wheels": params.get("transmission_drive", "Front Wheel Drive"),
        "owners": params.get("number_of_owners", "1"),
        "service_history": params.get("service_history", ""),
        "province": params.get("province", "Gauteng"),
        "city": params.get("city", "Johannesburg"),
        "suburb": params.get("suburb", "Aeroton"),
        "dealer_name": params.get("dealer_name", "Auto Fame"),
        "dealer_id": params.get("dealer_id", ""),
        "description": description,
        "photos": photos,
    }


def convex_query(path: str, args: dict):
    r = requests.post(
        f"{CONVEX_URL}/api/query",
        headers={"Content-Type": "application/json"},
        json={"path": path, "args": args},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def convex_mutation(path: str, args: dict):
    r = requests.post(
        f"{CONVEX_URL}/api/mutation",
        headers={"Content-Type": "application/json"},
        json={"path": path, "args": args},
        timeout=120,
    )
    r.raise_for_status()
    return r.json()


def upload_photo(photo_url: str) -> str:
    """Download photo, upload to Convex storage, return RESOLVED public URL."""
    r = requests.get(photo_url, headers=HEADERS, timeout=60)
    r.raise_for_status()
    content_type = r.headers.get("content-type", "image/jpeg")
    data = r.content

    upload_resp = convex_mutation("files:generateUploadUrl", {})
    upload_url = (
        upload_resp.get("value")
        or upload_resp.get("url")
        or upload_resp.get("result")
        or upload_resp.get("uploadUrl")
    )
    if not upload_url:
        raise RuntimeError(f"No upload URL in: {upload_resp}")

    # Convex generateUploadUrl accepts a POST with raw file body
    up = requests.post(upload_url, headers={"Content-Type": content_type}, data=data, timeout=120)
    up.raise_for_status()
    try:
        sid = up.json().get("storageId")
    except Exception:
        sid = up.text.strip()
    if not sid:
        raise RuntimeError(f"No storageId from upload: {up.status_code} {up.text[:200]}")

    resolved = convex_query("files:getUrl", {"storageId": sid})
    public_url = resolved.get("value") or resolved.get("result")
    if not public_url:
        raise RuntimeError(f"No resolved URL: {resolved}")
    return public_url


def main():
    print("== Scraping listing ==")
    car = scrape_listing()
    print(json.dumps({k: v for k, v in car.items() if k != "photos"}, indent=2))
    print(f"photos: {len(car['photos'])}")

    # 1. Create dealership (idempotent: skip if one exists)
    print("\n== Ensuring dealership ==")
    existing = convex_query("dealerships:list", {})
    dealers = existing.get("value") or existing.get("result") or []
    if not dealers:
        created = convex_mutation("dealerships:create", {
            "name": car["dealer_name"],
            "address": f"{car['suburb']}, {car['city']}",
            "city": car["city"],
            "state": car["province"],
            "country": "South Africa",
            "postalCode": "2091",
            "phoneNumber": "+27680720424",
            "email": "info@advanceauto.co.za",
        })
        dealer = created.get("value") or created.get("result") or created
        print("created dealership:", dealer.get("id") if isinstance(dealer, dict) else dealer)
        dealership_id = dealer["id"]
    else:
        dealership_id = dealers[0]["id"]
        print("existing dealership:", dealership_id)

    # 2. Upload photos
    print("\n== Uploading photos ==")
    photo_urls = []
    for i, url in enumerate(car["photos"]):
        try:
            resolved = upload_photo(url)
            photo_urls.append(resolved)
            print(f"  [{i+1}/{len(car['photos'])}] {resolved[:80]}")
        except Exception as e:
            print(f"  [{i+1}] SKIP {url}: {e}")
        time.sleep(0.3)

    # 3. Create car
    print("\n== Creating car ==")
    features = [
        "Full Service History",
        f"{car['owners']} Owner" if car["owners"] == "1" else f"{car['owners']} Owners",
        f"{car['driven_wheels']}",
        "5 Doors",
    ]
    payload = {
        "make": car["make"],
        "model": car["model"],
        "year": car["year"],
        "price": car["price"],
        "mileage": car["mileage"],
        "condition": car["condition"],
        "carType": car["body_type"],
        "fuelType": car["fuel_type"],
        "transmission": car["transmission"],
        "engine": f"{car['engine_capacity']}cc",
        "exteriorColor": car["colour"],
        "interiorColor": "Not specified",
        "description": car["description"],
        "features": features,
        "photoUrls": photo_urls,
        "status": "AVAILABLE",
        "featured": True,
        "dealershipId": dealership_id,
    }
    result = convex_mutation("cars:create", payload)
    print("car created:", json.dumps(result, indent=2)[:800])

    # 4. Verify
    print("\n== Verify ==")
    cars = convex_query("cars:list", {})
    listed = cars.get("value") or cars.get("result") or []
    print("cars in DB:", len(listed))
    for c in listed:
        print(f"  id={c['id']} {c['make']} {c['model']} {c['year']} R{c['price']} "
              f"photos={len(c['photoUrls'])} status={c['status']}")


if __name__ == "__main__":
    main()

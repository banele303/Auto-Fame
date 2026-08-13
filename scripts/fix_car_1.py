"""
Fix car id=1 with correctly scraped AutoTrader fields.
Photos were already uploaded; this only patches the metadata.
"""
import importlib.util
import json

import requests

CONVEX_URL = "https://reliable-sturgeon-574.convex.cloud"

spec = importlib.util.spec_from_file_location("seed", "scripts/seed_autotrader.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
car = mod.scrape_listing()

# Fetch the existing car to keep its photoUrls
r = requests.post(
    f"{CONVEX_URL}/api/query",
    headers={"Content-Type": "application/json"},
    json={"path": "cars:get", "args": {"id": 1}},
    timeout=60,
)
existing = r.json()["value"]

features = [
    "Full Service History",
    "1 Owner",
    "Front Wheel Drive",
    "5 Doors",
]

payload = {
    "id": 1,
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
    "photoUrls": existing["photoUrls"],
    "status": "AVAILABLE",
    "featured": True,
    "dealershipId": 1,
    "vin": existing["vin"],
}

resp = requests.post(
    f"{CONVEX_URL}/api/mutation",
    headers={"Content-Type": "application/json"},
    json={"path": "cars:update", "args": payload},
    timeout=120,
)
resp.raise_for_status()
updated = resp.json()["value"]
print("UPDATED car:")
print("  year:", updated["year"])
print("  price:", updated["price"])
print("  mileage:", updated["mileage"])
print("  fuelType:", updated["fuelType"])
print("  transmission:", updated["transmission"])
print("  carType:", updated["carType"])
print("  make/model:", updated["make"], updated["model"])
print("  photos:", len(updated["photoUrls"]))
print("  status:", updated["status"])

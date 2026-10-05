import os
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

API_KEY = os.getenv("WEATHER_API_KEY")
BASE_URL = "https://api.weatherapi.com/v1"


def search_locations(query):
    """Search WeatherAPI for matching locations."""

    if not API_KEY:
        raise ValueError("Weather API key is not configured.")

    if not query or len(query.strip()) < 2:
        return []

    url = f"{BASE_URL}/search.json"

    params = {
        "key": API_KEY,
        "q": query.strip()
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        locations = response.json()

        results = []

        for location in locations[:6]:
            results.append({
                "name": location["name"],
                "region": location.get("region", ""),
                "country": location["country"],
                "lat": location["lat"],
                "lon": location["lon"]
            })

        return results

    except requests.Timeout:
        raise ConnectionError(
            "Location search request timed out."
        )

    except requests.RequestException:
        raise ConnectionError(
            "Unable to search for locations."
        )


def get_weather(location):
    """Get current weather and hourly forecast."""

    if not API_KEY:
        raise ValueError("Weather API key is not configured.")

    url = f"{BASE_URL}/forecast.json"

    params = {
        "key": API_KEY,
        "q": location,
        "days": 2,
        "aqi": "no",
        "alerts": "no"
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        if response.status_code == 400:
            raise ValueError("Location not found.")

        response.raise_for_status()

        data = response.json()

        location_data = data["location"]
        current = data["current"]
        forecast_days = data["forecast"]["forecastday"]

        astro = forecast_days[0]["astro"]

        all_hours = []

        for day in forecast_days:
            all_hours.extend(day["hour"])

        current_epoch = location_data["localtime_epoch"]

        upcoming_hours = [
            hour
            for hour in all_hours
            if hour["time_epoch"] >= current_epoch
        ][:12]

        hourly_forecast = []

        for hour in upcoming_hours:
            hourly_forecast.append({
                "time": hour["time"],
                "temp_c": hour["temp_c"],
                "temp_f": hour["temp_f"],
                "condition": hour["condition"]["text"],
                "icon": "https:" + hour["condition"]["icon"],
                "chance_of_rain": hour.get(
                    "chance_of_rain",
                    0
                )
            })

        weather_data = {
            "location": {
                "name": location_data["name"],
                "region": location_data["region"],
                "country": location_data["country"],
                "localtime": location_data["localtime"]
            },

            "current": {
                "temp_c": current["temp_c"],
                "temp_f": current["temp_f"],
                "feelslike_c": current["feelslike_c"],
                "feelslike_f": current["feelslike_f"],
                "condition": current["condition"]["text"],
                "icon": "https:" + current["condition"]["icon"],
                "humidity": current["humidity"],
                "wind_kph": current["wind_kph"],
                "wind_mph": current["wind_mph"],
                "wind_dir": current["wind_dir"],
                "is_day": current["is_day"]
            },

            "sun": {
                "sunrise": astro["sunrise"],
                "sunset": astro["sunset"]
            },

            "hourly": hourly_forecast
        }

        return weather_data

    except requests.Timeout:
        raise ConnectionError(
            "Weather service request timed out."
        )

    except requests.RequestException:
        raise ConnectionError(
            "Unable to connect to the weather service."
        )
from flask import Flask, render_template, request, jsonify

from weather_service import (
    get_weather,
    search_locations
)

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/search")
def search():
    query = request.args.get("q", "").strip()

    if len(query) < 2:
        return jsonify([])

    try:
        locations = search_locations(query)

        return jsonify(locations)

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    except ConnectionError as error:
        return jsonify({
            "error": str(error)
        }), 503

    except Exception:
        return jsonify({
            "error": "Unable to search locations."
        }), 500


@app.route("/api/weather")
def weather():
    location = request.args.get("q", "").strip()

    if not location:
        return jsonify({
            "error": "Please enter a location."
        }), 400

    try:
        weather_data = get_weather(location)

        return jsonify(weather_data)

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    except ConnectionError as error:
        return jsonify({
            "error": str(error)
        }), 503

    except Exception:
        return jsonify({
            "error": "Something went wrong. Please try again."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
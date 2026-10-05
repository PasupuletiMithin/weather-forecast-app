/* =========================================
   HTML ELEMENTS
========================================= */

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const suggestions =
    document.getElementById("suggestions");

const celsiusButton =
    document.getElementById("celsiusButton");

const fahrenheitButton =
    document.getElementById("fahrenheitButton");

const loadingMessage =
    document.getElementById("loadingMessage");

const errorMessage =
    document.getElementById("errorMessage");

const weatherContent =
    document.getElementById("weatherContent");


/* =========================================
   VARIABLES
========================================= */

let currentWeatherData = null;

let currentUnit = "C";

let searchTimer = null;

let selectedSuggestionIndex = -1;


/* =========================================
   SEARCH BUTTON
========================================= */

searchButton.addEventListener(
    "click",
    function () {

        searchWeather();

    }
);


/* =========================================
   ENTER KEY + DROPDOWN KEYBOARD CONTROL
========================================= */

searchInput.addEventListener(
    "keydown",
    function (event) {

        const items =
            suggestions.querySelectorAll(
                ".suggestion-item"
            );


        /*
            Arrow Down
        */

        if (
            event.key === "ArrowDown" &&
            items.length > 0
        ) {

            event.preventDefault();

            selectedSuggestionIndex++;

            if (
                selectedSuggestionIndex >=
                items.length
            ) {

                selectedSuggestionIndex = 0;

            }

            updateSelectedSuggestion(items);

            return;

        }


        /*
            Arrow Up
        */

        if (
            event.key === "ArrowUp" &&
            items.length > 0
        ) {

            event.preventDefault();

            selectedSuggestionIndex--;

            if (
                selectedSuggestionIndex < 0
            ) {

                selectedSuggestionIndex =
                    items.length - 1;

            }

            updateSelectedSuggestion(items);

            return;

        }


        /*
            Enter
        */

        if (event.key === "Enter") {

            event.preventDefault();


            if (
                selectedSuggestionIndex >= 0 &&
                items[selectedSuggestionIndex]
            ) {

                items[
                    selectedSuggestionIndex
                ].click();

            } else {

                searchWeather();

            }

        }


        /*
            Escape closes suggestions
        */

        if (event.key === "Escape") {

            hideSuggestions();

        }

    }
);


/* =========================================
   TEMPERATURE UNIT BUTTONS
========================================= */

celsiusButton.addEventListener(
    "click",
    function () {

        currentUnit = "C";

        celsiusButton.classList.add(
            "active"
        );

        fahrenheitButton.classList.remove(
            "active"
        );


        if (currentWeatherData) {

            displayWeather(
                currentWeatherData
            );

        }

    }
);


fahrenheitButton.addEventListener(
    "click",
    function () {

        currentUnit = "F";

        fahrenheitButton.classList.add(
            "active"
        );

        celsiusButton.classList.remove(
            "active"
        );


        if (currentWeatherData) {

            displayWeather(
                currentWeatherData
            );

        }

    }
);


/* =========================================
   LOCATION AUTOCOMPLETE
========================================= */

searchInput.addEventListener(
    "input",
    function () {

        const query =
            searchInput.value.trim();


        /*
            Cancel the previous timer whenever
            the user types another character.
        */

        clearTimeout(searchTimer);


        selectedSuggestionIndex = -1;


        /*
            Don't search until at least
            2 characters are entered.
        */

        if (query.length < 2) {

            hideSuggestions();

            return;

        }


        /*
            Wait 300 milliseconds.

            Example:

            User types:
            h
            hy
            hyd

            Instead of calling the API
            immediately for every key,
            we wait briefly.

            This is called debouncing.
        */

        searchTimer = setTimeout(
            function () {

                searchLocations(query);

            },
            300
        );

    }
);


/* =========================================
   SEARCH LOCATIONS
========================================= */

async function searchLocations(query) {

    try {

        const response =
            await fetch(
                `/api/search?q=${encodeURIComponent(query)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            hideSuggestions();

            return;

        }


        /*
            Prevent an old API response from
            showing after the user has already
            typed something different.
        */

        if (
            searchInput.value.trim() !== query
        ) {

            return;

        }


        displaySuggestions(data);


    } catch (error) {

        console.error(
            "Location search error:",
            error
        );


        hideSuggestions();

    }

}


/* =========================================
   DISPLAY LOCATION SUGGESTIONS
========================================= */

function displaySuggestions(locations) {

    suggestions.innerHTML = "";

    selectedSuggestionIndex = -1;


    if (
        !Array.isArray(locations) ||
        locations.length === 0
    ) {

        suggestions.innerHTML = `
            <div class="no-suggestions">
                No matching locations
            </div>
        `;


        suggestions.classList.remove(
            "hidden"
        );


        return;

    }


    locations.forEach(
        function (location) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "suggestion-item";


            /*
                Location name
            */

            const name =
                document.createElement(
                    "span"
                );

            name.className =
                "suggestion-name";

            name.textContent =
                location.name;


            /*
                Region + Country
            */

            const details =
                document.createElement(
                    "span"
                );

            details.className =
                "suggestion-details";


            if (location.region) {

                details.textContent =
                    `${location.region}, ${location.country}`;

            } else {

                details.textContent =
                    location.country;

            }


            item.appendChild(name);

            item.appendChild(details);


            /*
                When user clicks a location
            */

            item.addEventListener(
                "click",
                function () {

                    selectLocation(
                        location
                    );

                }
            );


            suggestions.appendChild(
                item
            );

        }
    );


    suggestions.classList.remove(
        "hidden"
    );

}


/* =========================================
   KEYBOARD HIGHLIGHT
========================================= */

function updateSelectedSuggestion(items) {

    items.forEach(
        function (item) {

            item.classList.remove(
                "active"
            );

        }
    );


    if (
        selectedSuggestionIndex >= 0 &&
        items[selectedSuggestionIndex]
    ) {

        const selectedItem =
            items[
                selectedSuggestionIndex
            ];


        selectedItem.classList.add(
            "active"
        );


        selectedItem.scrollIntoView({
            block: "nearest"
        });

    }

}


/* =========================================
   SELECT LOCATION
========================================= */

function selectLocation(location) {

    /*
        Show readable location in
        the search box.
    */

    if (location.region) {

        searchInput.value =
            `${location.name}, ${location.region}, ${location.country}`;

    } else {

        searchInput.value =
            `${location.name}, ${location.country}`;

    }


    hideSuggestions();


    /*
        Latitude + longitude are used for
        the actual weather request.

        This avoids confusion when two
        cities have the same name.
    */

    const exactLocation =
        `${location.lat},${location.lon}`;


    getWeatherByLocation(
        exactLocation
    );

}


/* =========================================
   HIDE LOCATION SUGGESTIONS
========================================= */

function hideSuggestions() {

    suggestions.classList.add(
        "hidden"
    );


    suggestions.innerHTML = "";


    selectedSuggestionIndex = -1;

}


/* =========================================
   CLOSE DROPDOWN WHEN CLICKING OUTSIDE
========================================= */

document.addEventListener(
    "click",
    function (event) {

        const searchWrapper =
            document.querySelector(
                ".search-wrapper"
            );


        if (
            searchWrapper &&
            !searchWrapper.contains(
                event.target
            )
        ) {

            hideSuggestions();

        }

    }
);


/* =========================================
   NORMAL SEARCH
========================================= */

function searchWeather() {

    const location =
        searchInput.value.trim();


    if (!location) {

        showError(
            "Please enter a city or location."
        );

        return;

    }


    hideSuggestions();


    getWeatherByLocation(
        location
    );

}


/* =========================================
   GET WEATHER FROM FLASK
========================================= */

async function getWeatherByLocation(
    location
) {

    showLoading();


    try {

        const response =
            await fetch(
                `/api/weather?q=${encodeURIComponent(location)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to get weather."
            );

        }


        currentWeatherData =
            data;


        displayWeather(
            data
        );


    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================
   DISPLAY WEATHER
========================================= */

function displayWeather(data) {

    hideMessages();


    weatherContent.classList.remove(
        "hidden"
    );


    /*
        Location
    */

    let locationName =
        data.location.name;


    if (data.location.region) {

        locationName +=
            `, ${data.location.region}`;

    }


    locationName +=
        `, ${data.location.country}`;


    document.getElementById(
        "cityName"
    ).textContent =
        locationName;


    /*
        Local time
    */

    document.getElementById(
        "localTime"
    ).textContent =
        formatLocalTime(
            data.location.localtime
        );


    /*
        Weather icon
    */

    const weatherIcon =
        document.getElementById(
            "weatherIcon"
        );


    weatherIcon.src =
        data.current.icon;


    weatherIcon.alt =
        data.current.condition;


    /*
        Condition
    */

    document.getElementById(
        "weatherCondition"
    ).textContent =
        data.current.condition;


    /*
        Humidity
    */

    document.getElementById(
        "humidity"
    ).textContent =
        `${data.current.humidity}%`;


    /*
        Sunrise
    */

    document.getElementById(
        "sunrise"
    ).textContent =
        data.sun.sunrise;


    /*
        Sunset
    */

    document.getElementById(
        "sunset"
    ).textContent =
        data.sun.sunset;


    updateTemperature(data);


    displayHourlyForecast(
        data.hourly
    );


    updateTheme(
        data.current
    );

}


/* =========================================
   TEMPERATURE + WIND
========================================= */

function updateTemperature(data) {

    let temperature;

    let feelsLike;

    let wind;


    if (currentUnit === "C") {

        temperature =
            data.current.temp_c;

        feelsLike =
            data.current.feelslike_c;

        wind =
            `${data.current.wind_kph} km/h`;

    } else {

        temperature =
            data.current.temp_f;

        feelsLike =
            data.current.feelslike_f;

        wind =
            `${data.current.wind_mph} mph`;

    }


    document.getElementById(
        "temperature"
    ).textContent =
        `${Math.round(temperature)}°${currentUnit}`;


    document.getElementById(
        "feelsLike"
    ).textContent =
        `Feels like ${Math.round(feelsLike)}°${currentUnit}`;


    document.getElementById(
        "wind"
    ).textContent =
        `${wind} ${data.current.wind_dir}`;

}


/* =========================================
   HOURLY FORECAST
========================================= */

function displayHourlyForecast(
    hourlyData
) {

    const container =
        document.getElementById(
            "hourlyForecast"
        );


    container.innerHTML = "";


    hourlyData.forEach(
        function (hour) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "hour-card";


            const temperature =
                currentUnit === "C"
                    ? hour.temp_c
                    : hour.temp_f;


            const time =
                document.createElement(
                    "div"
                );

            time.className =
                "hour-time";

            time.textContent =
                formatHour(
                    hour.time
                );


            const icon =
                document.createElement(
                    "img"
                );

            icon.src =
                hour.icon;

            icon.alt =
                hour.condition;


            const temp =
                document.createElement(
                    "div"
                );

            temp.className =
                "hour-temp";

            temp.textContent =
                `${Math.round(temperature)}°${currentUnit}`;


            const rain =
                document.createElement(
                    "div"
                );

            rain.className =
                "rain-chance";

            rain.textContent =
                `Rain ${hour.chance_of_rain}%`;


            card.appendChild(time);

            card.appendChild(icon);

            card.appendChild(temp);

            card.appendChild(rain);


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================
   FORMAT HOURLY TIME
========================================= */

function formatHour(dateTime) {

    const time =
        dateTime.split(" ")[1];


    const [hour, minute] =
        time.split(":");


    let hourNumber =
        parseInt(hour);


    const period =
        hourNumber >= 12
            ? "PM"
            : "AM";


    hourNumber =
        hourNumber % 12 || 12;


    return (
        `${hourNumber}:${minute} ${period}`
    );

}


/* =========================================
   FORMAT LOCAL TIME
========================================= */

function formatLocalTime(dateTime) {

    const [date, time] =
        dateTime.split(" ");


    const dateObject =
        new Date(
            `${date}T${time}`
        );


    return dateObject.toLocaleString(
        "en-US",
        {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =========================================
   WEATHER BACKGROUND THEME
========================================= */

function updateTheme(current) {

    document.body.classList.remove(
        "sunny",
        "cloudy",
        "rainy",
        "night"
    );


    /*
        Night
    */

    if (current.is_day === 0) {

        document.body.classList.add(
            "night"
        );

        return;

    }


    const condition =
        current.condition.toLowerCase();


    /*
        Rain
    */

    if (
        condition.includes("rain") ||
        condition.includes("drizzle") ||
        condition.includes("storm") ||
        condition.includes("thunder")
    ) {

        document.body.classList.add(
            "rainy"
        );

    }


    /*
        Clouds
    */

    else if (
        condition.includes("cloud") ||
        condition.includes("overcast") ||
        condition.includes("mist") ||
        condition.includes("fog")
    ) {

        document.body.classList.add(
            "cloudy"
        );

    }


    /*
        Clear / Sunny
    */

    else {

        document.body.classList.add(
            "sunny"
        );

    }

}


/* =========================================
   LOADING
========================================= */

function showLoading() {

    errorMessage.classList.add(
        "hidden"
    );


    weatherContent.classList.add(
        "hidden"
    );


    loadingMessage.classList.remove(
        "hidden"
    );

}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    loadingMessage.classList.add(
        "hidden"
    );


    weatherContent.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message;


    errorMessage.classList.remove(
        "hidden"
    );

}


/* =========================================
   HIDE MESSAGES
========================================= */

function hideMessages() {

    loadingMessage.classList.add(
        "hidden"
    );


    errorMessage.classList.add(
        "hidden"
    );

}
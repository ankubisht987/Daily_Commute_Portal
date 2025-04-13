const map = L.map('map').setView([28.6139, 77.2090], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let routeLayer;

function geocodeAndRoute() {
    const fromLocation = document.getElementById('from').value;
    const toLocation = document.getElementById('to').value;

    if (!fromLocation || !toLocation) {
        alert('Please enter both locations.');
        return;
    }

    Promise.all([
        geocodeLocation(fromLocation),
        geocodeLocation(toLocation)
    ]).then(results => {
        const [start, end] = results;
        if (start && end) {
            calculateRoute(start, end);
            fetchAvailableRoutes(fromLocation, toLocation);
        } else {
            alert('Could not find one or both locations.');
        }
    });
}

function geocodeLocation(query) {
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                return [data[0].lat, data[0].lon];
            }
            return null;
        });
}

function calculateRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (routeLayer) map.removeLayer(routeLayer);
            const routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            routeLayer = L.polyline(routeCoords, { color: 'blue' }).addTo(map);
            map.fitBounds(routeLayer.getBounds());
        })
        .catch(err => console.error(err));
}
// ...map setup and geocode/calculate functions remain the same...

function fetchAvailableRoutes(from, to) {
    fetch(`http://localhost:3000/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .then(res => res.json())
        .then(data => {
            console.log("Available routes:", data);
            displayAvailableRoutes(data);
        })
        .catch(err => {
            console.error("Failed to fetch routes:", err);
            displayAvailableRoutes([]);
        });
}

function displayAvailableRoutes(routes) {
    const existing = document.querySelector('.available-routes');
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.className = "available-routes";

    const heading = document.createElement("h3");
    heading.textContent = "Available Travel Options:";
    container.appendChild(heading);

    if (routes.length === 0) {
        const noRoutes = document.createElement("p");
        noRoutes.textContent = "No available transport found for this route.";
        container.appendChild(noRoutes);
    } else {
        routes.forEach(route => {
            const card = document.createElement("div");
            card.className = "route-card";

            card.innerHTML = `
                <strong>${route.provider} (${route.mode})</strong><br>
                From: ${route.from} → To: ${route.to}<br>
                Price: ₹${route.price}<br>
                Time: ${route.time} | Seats: ${route.seats}
                <br><br>
                <button onclick='bookRide(${JSON.stringify(route)})'>Book Now</button>
            `;
            container.appendChild(card);
        });
    }

    document.querySelector('.container').appendChild(container);
}

function bookRide(route) {
    fetch('http://localhost:3000/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route)
    })
    .then(res => res.json())
    .then(data => {
        alert('✅ Ride booked successfully!');
        console.log(data);
    })
    .catch(err => {
        alert('❌ Failed to book ride.');
        console.error("Booking error:", err);
    });
}
function viewMyBookings() {
    fetch('http://localhost:3000/bookings')
        .then(res => res.json())
        .then(data => {
            console.log("📘 My Bookings:", data);
            displayMyBookings(data);
        })
        .catch(err => {
            console.error("Failed to fetch bookings:", err);
            alert("❌ Could not load bookings.");
        });
}

function displayMyBookings(bookings) {
    const container = document.querySelector('.my-bookings');
    container.innerHTML = ''; // Clear previous content

    const heading = document.createElement("h3");
    heading.textContent = "📘 Your Booked Rides:";
    container.appendChild(heading);

    if (bookings.length === 0) {
        const noBookings = document.createElement("p");
        noBookings.textContent = "No bookings made yet.";
        container.appendChild(noBookings);
        return;
    }

    bookings.forEach(booking => {
        const card = document.createElement("div");
        card.className = "route-card";

        card.innerHTML = `
            <strong>${booking.provider} (${booking.mode})</strong><br>
            From: ${booking.from} → To: ${booking.to}<br>
            Price: ₹${booking.price}<br>
            Time: ${booking.time} | Seats: ${booking.seats}<br><br>
            <button onclick="cancelBooking('${booking._id}')">Cancel Ride</button>
        `;
        container.appendChild(card);
    });
}

window.onload = function () {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
        displayUserEmail(storedEmail);
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};



function login() {
    const email = document.getElementById('emailInput').value;
    if (email.trim() === '') {
        alert('Please enter your email');
        return;
    }

    localStorage.setItem('userEmail', email);
    displayUserEmail(email);
    document.getElementById('loginModal').style.display = 'none';
}

function displayUserEmail(email) {
    document.getElementById('userInfo').textContent = `👤 Logged in as: ${email}`;
}

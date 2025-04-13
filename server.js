const express = require('express'); 
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost/travelDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB travelDB'))
.catch(err => console.error('❌ MongoDB connection failed:', err));

// Schema
const routeSchema = new mongoose.Schema({
    provider: String,
    mode: String,
    from: String,
    to: String,
    price: Number,
    time: String,
    seats: Number,
});

const Route = mongoose.model('Route', routeSchema, 'routes');
const Booking = mongoose.model('Booking', routeSchema, 'bookings');

// ✅ Route to fetch all bookings
app.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        res.status(500).send('Error fetching bookings.');
    }
});

// Existing routes
app.get('/routes', async (req, res) => {
    const { from, to } = req.query;
    try {
        const results = await Route.find({ from, to });
        res.json(results);
    } catch (err) {
        console.error("❌ Error fetching routes:", err);
        res.status(500).send('Error fetching routes.');
    }
});

app.post('/book', async (req, res) => {
    const bookingDetails = req.body;
    console.log("📦 Booking request received:", bookingDetails);

    const { provider, from, to } = bookingDetails;
    if (!provider || !from || !to) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const booking = new Booking(bookingDetails);
        await booking.save();
        res.status(200).json({ message: 'Booking confirmed!', booking: bookingDetails });
    } catch (err) {
        console.error("❌ Booking failed:", err);
        res.status(500).json({ message: 'Failed to book ride, please try again later.' });
    }
});


app.listen(3000, () => {
    console.log('🚀 Server running at http://localhost:3000');
});

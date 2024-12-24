// Import required libraries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const airportSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Airport name
    lat: { type: Number, required: true }, // Latitude
    lon: { type: Number, required: true }, // Longitude
});

// Create the Airport model
const Airport = mongoose.model('Airport', airportSchema);
// Initialize the app
const app = express();
const PORT = 4000; // You can change this if needed

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.get('/airports', async (req, res) => {
    try {
        const airports = await Airport.find(); // Fetch all airports
        res.json(airports); // Send them back to the frontend
    } catch (err) {
        console.error("Error fetching airports:", err);
        res.status(500).send("Error fetching airports.");
    }
});

app.post('/airports', async (req, res) => {
    try {
        const { name, lat, lon } = req.body; // Extract airport data from the request
        const newAirport = new Airport({ name, lat, lon }); // Create a new airport
        await newAirport.save(); // Save it to the database
        res.status(201).json(newAirport); // Send the saved airport back
    } catch (err) {
        console.error("Error adding airport:", err);
        res.status(500).send("Error adding airport.");
    }
});

app.delete('/airports/:id', async (req, res) => {
    try {
        const { id } = req.params; // Extract the airport ID from the request URL
        console.log("DELETE request received for ID:", id); // Log the ID received
        const deletedAirport = await Airport.findByIdAndDelete(id); // Delete from MongoDB

        if (!deletedAirport) {
            return res.status(404).send("Airport not found.");
        }

        res.status(200).send(`Airport ${deletedAirport.name} deleted successfully.`);
    } catch (err) {
        console.error("Error deleting airport:", err);
        res.status(500).send("Error deleting airport.");
    }
});

// Test route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

/* test commit */
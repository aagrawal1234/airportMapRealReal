const express = require('express'); // Import express
const Airport = require('../models/airport');
const router = express.Router();

// Get all airports
router.get('/', async (req, res) => {
    try {
        const airports = await Airport.find();
        res.json(airports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching airports' });
    }
});

// Add an airport
router.post('/', async (req, res) => {
    const { name, lat, lon } = req.body;

    try {
        const existingAirport = await Airport.findOne({ name, lat, lon });
        if (existingAirport) {
            return res.status(400).json({ message: 'Airport already exists' });
        }

        const airport = new Airport({ name, lat, lon });
        await airport.save();
        res.status(201).json(airport);
    } catch (error) {
        res.status(500).json({ message: 'Error adding airport' });
    }
});

// Delete an airport
router.delete('/', async (req, res) => {
    const { lat, lon } = req.body;
    try {
        const airport = await Airport.findOneAndDelete({ lat, lon });
        if (!airport) {
            return res.status(404).json({ message: 'Airport not found' });
        }
        res.json({ message: 'Airport deleted successfully' });
    } catch (error) {
        console.error('Error deleting airport:', error);
        res.status(500).json({ message: 'Error deleting airport' });
    }
});

module.exports = router;
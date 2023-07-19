const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight');
const airportCityController = require('../controllers/airportCity');


router.get('/offer/search',  flightController.offerSearch);

router.get('/offer/price',  flightController.offerPrice);

router.get('/airport/city/search',  airportCityController.searchByKeyword);

module.exports = router;

const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight');
const airportCityController = require('../controllers/airportCity');

router.get('/offer/price',  flightController.offerPrice);

router.get('/airport/city/search',  airportCityController.searchByKeyword);

router.post('/save-offer',  flightController.saveOfferForBookingPage);

router.get('/rest/set-amadeus-access-token',  flightController.setAmadeusAccessToken);
router.get('/rest/get-amadeus-access-token',  flightController.getAmadeusAccessToken);
 
router.get('/rest/offer/search',  flightController.restOfferSearch);

router.get('/rest/graph/listing/offer/search',  flightController.restGraphOfferSearch);

router.post('/rest/offer/search/multicity',  flightController.restOfferSearchMulticity);



module.exports = router;

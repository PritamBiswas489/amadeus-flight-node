const mongoose = require('mongoose');
// Define the schema for your collection
const amadeusOffersPriceSchema = new mongoose.Schema({
  offers: {
    type: mongoose.Schema.Types.Mixed, // JSON data type
    required: true,
  },
});
//Create the model for the collection
const AmadeusOffersPrice = mongoose.model('amadeus_offers_price', amadeusOffersPriceSchema);

module.exports = AmadeusOffersPrice;

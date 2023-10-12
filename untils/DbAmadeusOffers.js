const mongoose = require('mongoose');
const AmadeusOffersPrice = require('../models/AmadeusOffersPrice');

const insertOffers = async function(offers){
    try{
         const newToken = new AmadeusOffersPrice({offers});
         const response = await newToken.save();
         return response;
    }catch (error) {
         console.log(error);
         throw error;
    }
}
const getOffers = async function(offerid){
    try{
        const response = await AmadeusOffersPrice.findById(offerid);
        return response;
   }catch (error) {
        console.log(error);
        throw error;
   }

} 
module.exports = {
    insertOffers,
    getOffers
};
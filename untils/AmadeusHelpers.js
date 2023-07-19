var Amadeus = require("amadeus");

const retrieveAirlineDetails = async function(airlineCodes){
        const amadeus = new Amadeus({
            clientId: process.env.AMADEUS_API_KEY,
            clientSecret: process.env.AMADEUS_API_SECRET,
    });
    try{
        const response = await amadeus.referenceData.airlines.get({
            airlineCodes: airlineCodes.join(',')
        });
        //console.log(response.data);
        return response.data;

    } catch (error) {

    }

}
const AirportCitySearch = async function(keyword){
    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_API_KEY,
        clientSecret: process.env.AMADEUS_API_SECRET,
    });
    try{
      const response =  await amadeus.referenceData.locations.get({
            keyword: keyword,
            subType: Amadeus.location.airport
          });
          const locations = response.data;
          return locations;

    }catch (error) {
        throw error;
    }
}

const flightPriceOffer = async function(offer){
    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_API_KEY,
        clientSecret: process.env.AMADEUS_API_SECRET,
    });
    try{

        const response =  await   amadeus.shopping.flightOffers.pricing.post(
            JSON.stringify({
              "data": {
                "type": "flight-offers-pricing",
                "flightOffers": [
                  offer
                ]
              }
            })
          );


        return (response.data);

    }catch (error) {
            throw error;
    }

}

const flightOfferSearch = async function(searchData){

    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_API_KEY,
        clientSecret: process.env.AMADEUS_API_SECRET,
    });
         try{
               const response =  await amadeus.shopping.flightOffersSearch.get(searchData);
               const offers = response.data;
            //  // Retrieve unique airline codes from flight offers
                const airlineCodes = [...new Set(offers.map(offer => offer.validatingAirlineCodes[0]))];
            //     // Retrieve airline details for each airline code
                const airlineDetails = await retrieveAirlineDetails(airlineCodes);
            //     // Add airline details to flight offers
                const offersWithAirlineDetails = offers.map(offer => {
                    const airlineCode = offer.validatingAirlineCodes[0];
                    const airlineDetail = airlineDetails.find(detail => detail.iataCode === airlineCode);
                    return { ...offer, airline: airlineDetail };
                });
            
                return { offersWithAirlineDetails, airlineDetails};  

        }catch (error) {
            throw error;
        }
}

module.exports = {
    retrieveAirlineDetails ,
    flightOfferSearch,
    AirportCitySearch,
    flightPriceOffer
};
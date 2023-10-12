var Amadeus = require("amadeus");
var Helpers = require("./helpers");

const retrieveAirlineDetails = async function(airlineCodes){
        const amadeus = new Amadeus({
            clientId: process.env.AMADEUS_SELF_API_KEY,
            clientSecret: process.env.AMADEUS_SELF_API_SECRET,
    });
    try{
        const response = await amadeus.referenceData.airlines.get({
            airlineCodes: airlineCodes.join(',')
        });
        //console.log(response.data);
        return response.data;

    } catch (error) {
        throw error;
    }

}
//airport city search
const AirportCitySearch = async function(keyword){
    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_SELF_API_KEY,
        clientSecret: process.env.AMADEUS_SELF_API_SECRET,
    });
    try{
      const response =  await amadeus.referenceData.locations.get({
            keyword: keyword,
            subType: Amadeus.location.airport
          });
          const locations = response.data;
          return locations;

    }catch (error) {
        console.log(process.env.AMADEUS_SELF_API_KEY);
        console.log(process.env.AMADEUS_SELF_API_SECRET);
        console.log(error);
        throw error;
    }
}
const retrieveAirportDetails = async function(airportCodes){
    let airportDetails = [];

    for (const code of airportCodes) {
      const response = await AirportCitySearch(code); // Wait for each async function to complete
      if(typeof response[0]!=='undefined'){
        airportDetails.push({
            name:response[0].name,
            iataCode:response[0].iataCode,
            location:{
                city:response[0].address.cityName,
                country:response[0].address.countryName,
            },
        });
      }
    }
    return airportDetails;
}
//flight price offer
const flightPriceOffer = async function(data){
    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_SELF_API_KEY,
        clientSecret: process.env.AMADEUS_SELF_API_SECRET,
    });
    try{
        const response =  await   amadeus.shopping.flightOffers.pricing.post(
            JSON.stringify({
              "data": {
                "type": "flight-offers-pricing",
                "flightOffers": data.offers
              }
            })
          );
          return response.data;
          const offers = response.data.flightOffers;
          return getOffersData(offers);
    }catch (error) {
            throw error;
    }

}

const flightOfferSearch = async function(searchData){

    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_SELF_API_KEY,
        clientSecret: process.env.AMADEUS_SELF_API_SECRET,
    });
         try{
               const response =  await amadeus.shopping.flightOffersSearch.get(searchData);
               const offers = response.data;
               return getOffersData(offers);

        }catch (error) {
           
            throw error;
        }
}

async function getOffersData(offers){
    const airlineCodes = [];
    const airportCodes = []; 
    let offerTiming = [];
    const offerStops = [];
    const offerFlights = [];
    offers.forEach(offer => {
        offer.itineraries.forEach((itinerary) => {
          let  offTiming = [];
          let  offlights = [];
          let  offStops = [];
          itinerary.segments.forEach(segment => {
                if (airlineCodes.indexOf(segment.carrierCode) === -1) {
                    airlineCodes.push(segment.carrierCode)
                }
                //offer timing
                offTiming.push({
                    'departure':segment.departure.at,
                    'arrival':segment.arrival.at,
                    'dep_date':Helpers.getDateFromDateTime(segment.departure.at),
                    'dep_time':Helpers.getTimeFromDateTime(segment.departure.at),
                    'ar_date':Helpers.getDateFromDateTime(segment.arrival.at),
                    'ar_time':Helpers.getTimeFromDateTime(segment.arrival.at),
                    'num_days':Helpers.numberOfDaysFromTwoDate(segment.departure.at,segment.arrival.at),
                    'total_duration':Helpers.totalDuration(segment.departure.at,segment.arrival.at),
                    'id':offer.id
                });
                //offer flights
                offlights.push({
                    'carrierCode': segment.carrierCode,
                    'number': segment.number,
                });
                if (airportCodes.indexOf(segment.departure.iataCode) === -1) {
                    airportCodes.push(segment.departure.iataCode)
                }
                if (airportCodes.indexOf(segment.arrival.iataCode) === -1) {
                    airportCodes.push(segment.arrival.iataCode)
                }
                //offer stops
                offStops.push({
                    'departure': segment.departure.iataCode,
                    'arrival': segment.arrival.iataCode,
                });
          });
          offerTiming.push(offTiming);
          offerFlights.push(offlights);
          offerStops.push(offStops);
        });
      });


    const   airlineDetails =  await retrieveAirlineDetails(airlineCodes);
    const   airportDetails =  await retrieveAirportDetails(airportCodes);
     
     //console.log(airportCodes);
     //console.log(airportDetails);

    //offer with airlines and airport details 
    const offersWithAirlineDetails = offers.map((offer, index) => {
            const airlineCodes = offerFlights[index];
            const airportCodes = offerStops[index];
            let airlineDetail = [];
            let airportDetail = [];
            //travel airline details
            for (let i = 0; i < airlineCodes.length; i++) {
                const v= airlineDetails.find(detail => detail.iataCode === airlineCodes[i].carrierCode);
                v['number'] = airlineCodes[i].number;
                
                v['image'] = v.icaoCode ? `https://flightaware.com/images/airline_logos/90p/${v.icaoCode}.png` : `https://pics.avs.io/90/90/${v.iataCode}.png`;
                airlineDetail.push(v);
            } 
            //travel airport details
            for (let i = 0; i < airportCodes.length; i++) {
                const ap= airportDetails.find(detail => detail.iataCode === airportCodes[i].departure);
                const d = {};
                d.departure = ap ? ap : {name:airportCodes[i].departure,iataCode:airportCodes[i].departure};
                const apv= airportDetails.find(detail => detail.iataCode === airportCodes[i].arrival);
                d.arrival = apv ? apv : {name:airportCodes[i].arrival,iataCode:airportCodes[i].arrival};
                airportDetail.push(d);
            }
            //price
            const totalPrice = offer.price.grandTotal;
            const currency = offer.price.currency;
            //get actual departure and arrival time
            const firstTimeSlot = offerTiming[index][0];
            const lastTimeSlot = offerTiming[index][offerTiming[index].length - 1];

           
            const departureDate = firstTimeSlot['departure'];
            const arrivalDate = lastTimeSlot['arrival'];


            // console.log("=============== Checking =======================");
            
            // console.log(Helpers.getTimeFromDateTime(departureDate));
            
            // console.log({arrivalDate});
            // console.log(Helpers.getDateFromDateTime(arrivalDate));
            // console.log(Helpers.getTimeFromDateTime(arrivalDate));



            const depDate = Helpers.getDateFromDateTime(departureDate);
            const depTime = Helpers.getTimeFromDateTime(departureDate);

            const arrDate = Helpers.getDateFromDateTime(arrivalDate);
            const arrTime = Helpers.getTimeFromDateTime(arrivalDate);

            const numberofdays = Helpers.numberOfDaysFromTwoDate(depDate,arrDate);
            const totalduration = Helpers.totalDuration(departureDate,arrivalDate);


            const cabinClass = offer?.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin;
            const baggage = offer?.travelerPricings[0]?.fareDetailsBySegment[0]?.includedCheckedBags?.weight;

            return {
                orginalTiming:{
                        depDate,
                        depTime,
                        arrDate,
                        arrTime,
                        numberofdays,
                        totalduration
                },
                baggage:baggage,
                cabinClass:cabinClass,
                timings: offerTiming[index], //all timing slots
                totalPrice : totalPrice,
                currency:currency,
                airline: airlineDetail, //airline details
                airport: airportDetail , //airport details
                offer
            };
    });
    return { offersWithAirlineDetails, airlineDetails,airportDetails};  
}

module.exports = {
    retrieveAirlineDetails ,
    retrieveAirportDetails,
    flightOfferSearch,
    AirportCitySearch,
    flightPriceOffer,
    getOffersData
};
let fetch;
(async () => {
  try {
    const fetchModule = await import("node-fetch"); // dynamic import
    fetch = fetchModule.default;
  } catch (error) {
    console.error("Error importing 'node-fetch':", error);
  }
})();
const { error } = require("console");
var AmadeusHelpers = require("../untils/AmadeusHelpers");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const DbAmadeus = require("./DbAmadeus");
var Helpers = require("./helpers");

/**
 * generate amaduse enterprize access token
 */
const generateAccessToken = async function () {
  const url = `https://${process.env.AMADEUS_API_ENDPOINT}/v1/security/oauth2/token`;

  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;

  const data = new URLSearchParams();
  data.append("grant_type", "client_credentials");
  data.append("client_id", clientId);
  data.append("client_secret", clientSecret);
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data,
  };
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const accessTokenData = await response.json();
    try {
      accessTokenData.created = Date.now();
      await DbAmadeus.clearAccessToken();
      await DbAmadeus.insertAccessToken(accessTokenData);
      return accessTokenData;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};
/**
 * get amaduse enterprize access token
 */
const getAccessToken = async function () {
  try {
    const accessTokenData = await DbAmadeus.getAccessToken();
    if (accessTokenData.access_token) {
      //access token life time will check here
      const isAmadeusAccessTokenExpired =
        Helpers.isAmadeusAccessTokenExpired(accessTokenData);
      //return {isAmadeusAccessTokenExpired};
      if (isAmadeusAccessTokenExpired) {
        console.log(
          "===================== NEW ACCESS TOKEN ============================"
        );
        const gtoken = await generateAccessToken();
        return gtoken;
      }
      console.log(
        "===================== OLD TOKEN ============================"
      );
      return accessTokenData;
    } else {
      console.log(
        "===================== NEW ACCESS TOKEN ============================"
      );
      const gtoken = await generateAccessToken();
      return gtoken;
    }
  } catch (err) {
    throw error;
  }
};
/**
 *
 * Rest offer pricing
 */
const restOffersPricing = async function ({ access_token, offers }) {
  const jsonData = {
    data: {
      type: "flight-offers-pricing",
      flightOffers: offers,
    },
  };
  const url = `https://${process.env.AMADEUS_API_ENDPOINT}/v1/shopping/flight-offers/pricing`;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(jsonData),
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/vnd.amadeus+json",
    },
  };

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();

    const offers = result.data.flightOffers;
    if (offers.length === 0) {
      throw error;
    }
    const dictionaries = result.dictionaries;

    return getPriceOfferProcess({ offers, dictionaries });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
async function getPriceOfferProcess({ offers, dictionaries }) {
  const carriers = [];
  offers &&
    offers.map((offer, index) => {
      offer.itineraries.forEach((itinerary, itineraryIndex) => {
        itinerary.segments.forEach((segment) => {
          carriers.push(segment.carrierCode);
        });
      });
    });
  const newcarriers = [...new Set(carriers)];
  const obj = {};
  for (let i = 0; i < newcarriers.length; i++) {
    obj[newcarriers[i]] = newcarriers[i];
  }
  dictionaries.carriers = obj;
  return getOfferData({ offers, dictionaries });
}

/**
 * get amaduse enterprize offer search
 */

async function restOfferSearch({
  access_token,
  originLocationCode,
  destinationLocationCode,
  departureDate,
  returnDate,
  adults,
  children,
  infants,
  nonStop,
  travelClass,
}) {
  const currencyCode = 'EUR';
  const originDestinations = [];

  const destinationObj = {
    id: "1",
    originLocationCode: originLocationCode,
    destinationLocationCode: destinationLocationCode,
    departureDateTimeRange: {
      date: departureDate,
    },
  };
  originDestinations.push(destinationObj);
  let returnObj = {};
  if (returnDate !== "") {
    returnObj = {
      id: "2",
      originLocationCode: destinationLocationCode,
      destinationLocationCode: originLocationCode,
      departureDateTimeRange: {
        date: returnDate,
      },
    };
    originDestinations.push(returnObj);
  }
  const travelers = [];
  let id = 1;
  let iCount = 0;
  if (adults > 0) {
    while (iCount < parseInt(adults)) {
      travelers.push({
        id: id.toString(),
        travelerType: "ADULT",
        fareOptions: ["STANDARD"],
      });
      iCount++;
      id++;
    }
  }

  let iCount_children = 0;
  if (children > 0) {
    while (iCount_children < parseInt(children)) {
      travelers.push({
        id: id.toString(),
        travelerType: "CHILD",
        fareOptions: ["STANDARD"],
      });
      iCount_children++;
      id++;
    }
  }

  let iCount_infants = 0;
  if (infants > 0) {
    while (iCount_infants < parseInt(infants)) {
      travelers.push({
        id: id.toString(),
        travelerType: "SEATED_INFANT",
        fareOptions: ["STANDARD"],
      });
      iCount_infants++;
      id++;
    }
  }

  const jsonData = {
    currencyCode,
    originDestinations,
    nonStop,
    travelClass,
    travelers,
    sources: ["GDS"],
    searchCriteria: {
      additionalInformation: {
        chargeableCheckedBags: true,
        brandedFares: true,
        fareRules: true,
      },
    },
  };

  const url = `https://${process.env.AMADEUS_API_ENDPOINT}/v2/shopping/flight-offers`;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(jsonData),
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/vnd.amadeus+json",
    },
  };
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    const offers = result.data;
    if (offers.length === 0) {
      throw error;
    }
    const dictionaries = result.dictionaries;
    return getOfferData({ offers, dictionaries });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 *
 *  get offer data in organized WAY
 */
async function getOfferData({ offers, dictionaries }) {
  const { carriers } = dictionaries;

  //const cityCodes = Object.keys(locations);
  const carrierCodes = Object.keys(carriers);

  const retrieveAirlineDetails = await AmadeusHelpers.retrieveAirlineDetails(
    carrierCodes
  );
  // const   airportDetails =  await AmadeusHelpers.retrieveAirportDetails(cityCodes);

  const pricinglist = [];

  let maxDeparttureDuration = -Infinity;
  let minDeparttureDuration = Infinity;

  let itineraryDurationLimit = [];
  offers[0].itineraries.forEach((itinerary, itineraryIndex) => {
    itineraryDurationLimit.push({
      minDeparttureDuration: Infinity,
      maxDeparttureDuration: -Infinity,
    });
  });

  let cheapestOffer = {};
  let bestOffer = {};
  let quickestOffer = {};
  let imageNeedToSave = [];
  let imagePngNeedToSave = [];
  let cheapPrice = Infinity;
  const offersWithAirlineDetails =
    offers &&
    offers.map((offer, index) => {
      const listedItineraries = [];
      /**
       * itineraries listing
       */
      const airports = [];
      const airlines = [];
      let departureNumberofStop = [];
      let departureTimingslot = [];
      let departureDuration = [];

      offer.itineraries.forEach((itinerary, itineraryIndex) => {
        const segmentDetails = [];
        const orginalTiming = {};
        const numberofStop = itinerary.segments.length - 1;
        if (numberofStop === 1) {
          departureNumberofStop.push("ONESTOP");
        } else if (numberofStop > 1) {
          departureNumberofStop.push("TWOPLUSSTOP");
        } else {
          departureNumberofStop.push("DIRECT");
        }

        itinerary.segments.forEach((segment) => {
          /**
           * segment details
           */
          const v = retrieveAirlineDetails.find(
            (detail) => detail.iataCode === segment.carrierCode
          );
          // const dc= airportDetails.find(detail => detail.iataCode === segment.departure.iataCode);
          // const ac= airportDetails.find(detail => detail.iataCode === segment.arrival.iataCode);
          // const imageURL = v.icaoCode
          // ? `https://flightaware.com/images/airline_logos/90p/${v.icaoCode}.png`
          // : `https://pics.avs.io/90/90/${v.iataCode}.png`;

          
          let imageURL = `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${v.iataCode}.svg`;

          const isNeedToSave = Helpers.checkImageNeedToSave(`${v.iataCode}.svg`);
          if(isNeedToSave){
            imageNeedToSave.push({url:imageURL,name: `${v.iataCode}.svg`});
          }else{
            const checkPngImageNeedToSave = Helpers.checkPngImageNeedToSave(`${v.iataCode}.png`);
            if(checkPngImageNeedToSave){
              if(!imagePngNeedToSave.includes(v.iataCode)){
                imagePngNeedToSave.push(v.iataCode);
              }
              imageURL = process.env.IMAGE_URL+`${v.iataCode}.svg`;
            }else{
              imageURL = process.env.IMAGE_URL+`svgpng/${v.iataCode}.png`;
            }
          }
          
          
          segmentDetails.push({
            departure: segment.departure.at,
            arrival: segment.arrival.at,
            dep_date: Helpers.getDateFromDateTime(segment.departure.at),
            dep_time: Helpers.getTimeFromDateTime(segment.departure.at),
            ar_date: Helpers.getDateFromDateTime(segment.arrival.at),
            ar_time: Helpers.getTimeFromDateTime(segment.arrival.at),
            num_days: Helpers.numberOfDaysFromTwoDate(
              segment.departure.at,
              segment.arrival.at
            ),
            total_duration: Helpers.totalDuration(
              segment.departure.at,
              segment.arrival.at
            ),
            dep_city: {
              iataCode: segment.departure.iataCode,
              name: segment.departure.iataCode,
            },
            ar_city: {
              iataCode: segment.arrival.iataCode,
              name: segment.arrival.iataCode,
            },
            airline: {
              name: carriers[segment.carrierCode],
              iataCode: segment.carrierCode,
              aircraft: segment.aircraft.code,
              image: imageURL,
              operating: {
                name: carriers[segment?.operating?.carrierCode],
                iataCode: segment?.operating?.carrierCode,
              },
            },
          });
          if (!airports.includes(segment.departure.iataCode)) {
            airports.push(segment.departure.iataCode);
          }
          if (!airports.includes(segment.arrival.iataCode)) {
            airports.push(segment.arrival.iataCode);
          }
          if (!airlines.includes(segment.carrierCode)) {
            airlines.push(segment.carrierCode);
          }
        });
        /**
         * from and to details
         */
        const firstTimeSlot = segmentDetails[0];
        const lastTimeSlot = segmentDetails[segmentDetails.length - 1];
        const departureDate = firstTimeSlot["departure"];
        const arrivalDate = lastTimeSlot["arrival"];

        const depDate = Helpers.getDateFromDateTime(departureDate);
        const depTime = Helpers.getTimeFromDateTime(departureDate);

        departureTimingslot.push(
          Helpers.getTimeInterval(depTime.hours, depTime.minutes)
        );

        const arrDate = Helpers.getDateFromDateTime(arrivalDate);
        const arrTime = Helpers.getTimeFromDateTime(arrivalDate);

        const numberofdays = Helpers.numberOfDaysFromTwoDate(depDate, arrDate);
        const totalduration = Helpers.totalDuration(departureDate, arrivalDate);

        const timeDiff = totalduration.timeDifference;

        departureDuration.push(timeDiff);

        if (
          timeDiff >
          itineraryDurationLimit[itineraryIndex].maxDeparttureDuration
        ) {
          itineraryDurationLimit[itineraryIndex].maxDeparttureDuration =
            timeDiff;
        }
        if (
          timeDiff <
          itineraryDurationLimit[itineraryIndex].minDeparttureDuration
        ) {
          itineraryDurationLimit[itineraryIndex].minDeparttureDuration =
            timeDiff;
        }

        const fromLocation = firstTimeSlot["dep_city"];
        const toLocation = lastTimeSlot["ar_city"];

        listedItineraries.push({
          from_to_details: {
            depDate,
            depTime,
            arrDate,
            arrTime,
            numberofdays,
            totalduration,
            fromLocation,

            toLocation,
          },
          segments: segmentDetails,
        });
      });
      const totalPrice = offer.price.grandTotal;
      pricinglist.push(parseFloat(totalPrice));
      const currency = offer.price.currency;
      const cabinClass =
        offer?.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin;
      const baggage =
        offer?.travelerPricings[0]?.fareDetailsBySegment[0]?.includedCheckedBags
          ?.weight;
      const baggageQty =
        offer?.travelerPricings[0]?.fareDetailsBySegment[0]?.includedCheckedBags
          ?.quantity;

      if (departureDuration[0] < minDeparttureDuration) {
        minDeparttureDuration = departureDuration[0];
        quickestOffer = { duration: minDeparttureDuration, cost: totalPrice };
      }
      if (parseFloat(totalPrice) < cheapPrice) {
        cheapPrice = parseFloat(totalPrice);
        cheapestOffer = {
          duration: departureDuration[0],
          cost: parseFloat(totalPrice),
        };
        if (
          departureNumberofStop[0] === "DIRECT" ||
          departureNumberofStop[0] === "ONESTOP"
        ) {
          bestOffer = { duration: departureDuration[0], cost: totalPrice };
        }
      }

      return {
        id: offer.id,
        airports: airports,
        airlines: airlines,
        departureDuration,
        departureTimingslot,
        departureNumberofStop,
        totalPrice: totalPrice,
        currency: currency,
        cabinClass: cabinClass,
        baggage: baggage,
        baggageQty: baggageQty,
        itineraries: listedItineraries,
        offer: offer
        
      };
    });
  const maxPrice = Math.max(...pricinglist);
  const minPrice = Math.min(...pricinglist);

  //  const maxDurationSlot = Math.max(...departureDurationslot);
  //  const minDurationSlot = Math.min(...departureDurationslot);

  //  const maxReturnSlot = Math.max(...returnDurationslot);
  //  const minReturnSlot = Math.min(...returnDurationslot);
  if(imageNeedToSave.length > 0){
    try{
      await Helpers.saveFlightImage(imageNeedToSave);
    }catch(err){
    }
      
  }
  if(imagePngNeedToSave.length > 0){
    try{
      await Helpers.convertFlightLogoImageSvgToPng(imagePngNeedToSave);
    }catch(err){

    }
   }
  return {
    // imagePngNeedToSave,
    // imageNeedToSave,
    offersWithAirlineDetails,
    dictionaries,
    cheapestOffer,
    bestOffer,
    quickestOffer,
    minPrice,
    maxPrice,
    itineraryDurationLimit,
  };
}
/**
 *
 * Calendar offer search function
 */
async function calendarOfferSearch({
  access_token,
  multiCityData,
  adults,
  children,
  infants,
  travelClass,
  nonStop,
  currencyCode
}) {
 
  const originDestinations = [];
  let countDestination = 0;
  while (countDestination < multiCityData.length) {
    const destinationObj = {
      id: (countDestination + 1).toString(),
      originLocationCode: multiCityData[countDestination].originLocationCode,
      destinationLocationCode:
        multiCityData[countDestination].destinationLocationCode,
      departureDateTimeRange: {
        date: multiCityData[countDestination].date,
        dateWindow: "P3D",
      },
    };
    originDestinations.push(destinationObj);
    countDestination++;
  }

  const travelers = [];
  let id = 1;
  let iCount = 0;
  if (adults > 0) {
    while (iCount < parseInt(adults)) {
      travelers.push({
        id: id.toString(),
        travelerType: "ADULT",
        fareOptions: ["STANDARD"],
      });
      iCount++;
      id++;
    }
  }
  let iCount_children = 0;
  if (children > 0) {
    while (iCount_children < parseInt(children)) {
      travelers.push({
        id: id.toString(),
        travelerType: "CHILD",
        fareOptions: ["STANDARD"],
      });
      iCount_children++;
      id++;
    }
  }

  let iCount_infants = 0;
  if (infants > 0) {
    while (iCount_infants < parseInt(infants)) {
      travelers.push({
        id: id.toString(),
        travelerType: "SEATED_INFANT",
        fareOptions: ["STANDARD"],
      });
      iCount_infants++;
      id++;
    }
  }
  const jsonData = {
    currencyCode,
    originDestinations,
    nonStop: nonStop,
    travelClass: travelClass,
    travelers,
    sources: ["GDS", "PYTON"],
    searchCriteria: {
      additionalInformation: {
        maxFlightOffers: 1,
        chargeableCheckedBags: false,
        brandedFares: false,
        fareRules: false,
      },
    },
  };

  const url = `https://${process.env.AMADEUS_API_ENDPOINT}/v2/shopping/flight-offers`;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(jsonData),
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/vnd.amadeus+json",
    },
  };
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    const offers = result.data;
    if (offers.length === 0) {
      return [];
    }
    return getCalendarOfferData({ offers });
  } catch (error) {
    return [];
  }
}
async function getCalendarOfferData({ offers }){
  const offersWithAirlineDetails =
    offers &&
    offers.map((offer, index) => {
      let dep_date = [];
      offer.itineraries.forEach((itinerary, itineraryIndex) => {
        const segment = itinerary.segments[0];
        dep_date .push(Helpers.getDateFromDateTime(segment.departure.at));
      })
      const totalPrice = offer.price.grandTotal;
      return {
        dep_date: dep_date,
        totalPrice:totalPrice
      };
    });
    offersWithAirlineDetails.sort((a, b) => {
      const dateA = new Date(a.dep_date[0]);
      const dateB = new Date(b.dep_date[0]);
      return dateA - dateB;
    });
    return {offersWithAirlineDetails};
}
/**
 *
 * multicity search function
 */
async function complexItinerarySearch({
  access_token,
  multiCityData,
  adults,
  children,
  infants,
  travelClass,
  nonStop,
   
}) {
  const currencyCode = 'EUR';
  const originDestinations = [];
  let countDestination = 0;
  while (countDestination < multiCityData.length) {
    const destinationObj = {
      id: (countDestination + 1).toString(),
      originLocationCode: multiCityData[countDestination].originLocationCode,
      destinationLocationCode:
        multiCityData[countDestination].destinationLocationCode,
      departureDateTimeRange: {
        date: multiCityData[countDestination].date,
      },
    };
    originDestinations.push(destinationObj);
    countDestination++;
  }

  const travelers = [];
  let id = 1;
  let iCount = 0;
  if (adults > 0) {
    while (iCount < parseInt(adults)) {
      travelers.push({
        id: id.toString(),
        travelerType: "ADULT",
        fareOptions: ["STANDARD"],
      });
      iCount++;
      id++;
    }
  }
  let iCount_children = 0;
  if (children > 0) {
    while (iCount_children < parseInt(children)) {
      travelers.push({
        id: id.toString(),
        travelerType: "CHILD",
        fareOptions: ["STANDARD"],
      });
      iCount_children++;
      id++;
    }
  }

  let iCount_infants = 0;
  if (infants > 0) {
    while (iCount_infants < parseInt(infants)) {
      travelers.push({
        id: id.toString(),
        travelerType: "SEATED_INFANT",
        fareOptions: ["STANDARD"],
      });
      iCount_infants++;
      id++;
    }
  }
  const jsonData = {
    currencyCode,
    originDestinations,
    nonStop: nonStop,
    travelClass: travelClass,
    travelers,
    sources: ["GDS", "PYTON"],
    searchCriteria: {
      additionalInformation: {
        chargeableCheckedBags: false,
        brandedFares: false,
        fareRules: false,
      },
    },
  };

  const url = `https://${process.env.AMADEUS_API_ENDPOINT}/v2/shopping/flight-offers`;
  const requestOptions = {
    method: "POST",
    body: JSON.stringify(jsonData),
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/vnd.amadeus+json",
    },
  };
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    const offers = result.data;
    if (offers.length === 0) {
      throw error;
    }
    const dictionaries = result.dictionaries;
    return getOfferData({ offers, dictionaries });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
module.exports = {
  generateAccessToken,
  getAccessToken,
  restOfferSearch,
  restOffersPricing,
  calendarOfferSearch,
  complexItinerarySearch,
};

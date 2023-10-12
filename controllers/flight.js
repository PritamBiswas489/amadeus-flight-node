const helpers = require("../untils/helpers");
const fs = require("fs");
const path = require("path");
var AmadeusHelpers = require("../untils/AmadeusHelpers");
var HttpError = require("../models/http-error");
var AmadeusRestHelpers = require("../untils/AmadeusRestHelpers");
const DbAmadeusOffers = require("../untils/DbAmadeusOffers");

exports.setAmadeusAccessToken = (req, res, next) => {
  AmadeusRestHelpers.generateAccessToken()
    .then(function (response) {
      res.status(200).json({ response });
    })
    .catch(function (error) {
      console.log(error.response);
      return next(new HttpError("Access Token Generation Failed", 500));
    });
};
exports.getAmadeusAccessToken = (req, res, next) => {
  AmadeusRestHelpers.getAccessToken()
    .then(function (response) {
      //console.log("=========== Hello3 ====================");
      console.log(response);
      res.status(200).json(response);
    })
    .catch(function (error) {
      console.log(error);
      return next(new HttpError("Access Token not found", 500));
    });
};

exports.restOfferSearch = async (req, res, next) => {
  try {
    const originLocationCode = req.query.originLocationCode || "CCU";
    const destinationLocationCode = req.query.destinationLocationCode || "BKK";
    const departureDate = req.query.departureDate || helpers.currentDate();
    const adults = parseInt(req.query.adults) || 2;
    const children = parseInt(req.query.children) || 0;
    const infants = parseInt(req.query.infants) || 0;
    const nonStop = req.query.nonStop;
    const travelClass = req.query.travelClass;
    let returnDate = req.query.returnDate;
    if (typeof returnDate === "undefined") {
      returnDate = "";
    }

    const accessTokenDetails = await AmadeusRestHelpers.getAccessToken();
    const { access_token } = accessTokenDetails;
    const delayMs = 2000; // Delay in milliseconds (e.g., 5000 ms = 5 seconds)

    // Create a function to handle the API call
    const handleApiCall = async () => {
      AmadeusRestHelpers.restOfferSearch({
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
      })
        .then(function (response) {
          res.status(200).json({ response });
        })
        .catch(function (error) {
          return next(new HttpError(error.message || "No offers found.", 500));
        });
    };

    handleApiCall();
    //setTimeout(handleApiCall, delayMs);
  } catch (error) {
    console.error(error);

    // Handle other errors
    return next(new HttpError("Internal server error", 500));
  }
};

exports.offerPrice = async (req, res, next) => {
  const itineraryId = req.query.itineraryId;
  try {
    const offerData = await DbAmadeusOffers.getOffers(itineraryId); //offer data
    const { offers } = offerData;
    const accessTokenDetails = await AmadeusRestHelpers.getAccessToken();
    const { access_token } = accessTokenDetails;
    const requestData = {
      access_token,
      offers,
    };
    const handleApiCall = async () => {
      AmadeusRestHelpers.restOffersPricing(requestData)
        .then(function (response) {
          res.status(200).json({ response });
        })
        .catch(function (error) {
          return next(new HttpError(error.message || "No offers found.", 500));
        });
    };
    handleApiCall();
  } catch (error) {
    return next(new HttpError(error.message || "Failed to find offer", 500));
  }
};
//save offer to booking page
exports.saveOfferForBookingPage = async (req, res, next) => {
  const offerData = req.body.offers;
  //console.log(offerData);
  try {
    const newOffer = await DbAmadeusOffers.insertOffers(offerData);
    res.status(200).json({
      response: { itineraryId: newOffer._id },
    });
  } catch (error) {
    return next(new HttpError(error.message || "Failed to save", 500));
  }
};

exports.restGraphOfferSearch = async (req, res, next) => {
  const accessTokenDetails = await AmadeusRestHelpers.getAccessToken();
  const { access_token } = accessTokenDetails;
  
  const originLocationCode = req.query.originLocationCode || "CCU";
  const destinationLocationCode = req.query.destinationLocationCode || "BKK";
  const date = req.query.departureDate || helpers.currentDate();
  const adult = parseInt(req.query.adults) || 2;
  const child = parseInt(req.query.children) || 0;
  const infant = parseInt(req.query.infants) || 0;
  const nonStop = req.query.nonStop;
  const cabinClass = req.query.travelClass;
  
  
  const getAllDatesBetweenTwoDate = helpers.getAllDatesBetweenTwoDateFourDaysGap(helpers.currentDate(),date);
   

  let dates = []; 
  dates = [...dates,...getAllDatesBetweenTwoDate];
  let loopLimit = 40;
  if(getAllDatesBetweenTwoDate.length > 0){
     loopLimit = getAllDatesBetweenTwoDate.length+20;
  }
  let dateLoop = date;
  if(getAllDatesBetweenTwoDate.length > 0){
    dateLoop = helpers.addDaysWithDaY(getAllDatesBetweenTwoDate[getAllDatesBetweenTwoDate.length-1],4);
  }
  dates.push(dateLoop);
  for(let i=0; i<=loopLimit; i++){
    const addDay = helpers.addDaysWithDaY(dateLoop,4);
    dates.push(addDay);
    dateLoop = addDay;
  }
 
  try {
    const currencyCode = 'EUR';
    const promises = dates.map(async (resDate, index) => {
      const multiCityData = [{ originLocationCode, destinationLocationCode , date:resDate   }];
        const data =  await  AmadeusRestHelpers.calendarOfferSearch({
          access_token,
          multiCityData,
          adults: adult,
          children: child,
          infants: infant,
          travelClass: cabinClass,
          nonStop: nonStop,
          currencyCode
        });
         
        return data.offersWithAirlineDetails;
    })
    const resolvedData = await Promise.all(promises);
    const graphDates = [].concat(...resolvedData);
    let minTotalPrice = 0;
    let maxTotalPrice = 0;
    if(graphDates){
      minTotalPrice = helpers.findMinTotalPrice(graphDates);
      maxTotalPrice = helpers.findMaxTotalPrice(graphDates);
    }
     

    return res.status(200).json({minTotalPrice, maxTotalPrice, currencyCode, graphDates, dates });

  }catch (error) {
    console.error("Error resolving Promises:", error);
    throw error; // Rethrow the error for consistent error handling
  }
  
};
exports.restOfferSearchMulticity = async (req, res, next) => {
  const accessTokenDetails = await AmadeusRestHelpers.getAccessToken();
  const { access_token } = accessTokenDetails;
  const { multiCity, adult, child, infant, nonStop, cabinClass } = req.body;

  const multiCityData = multiCity;
  AmadeusRestHelpers.complexItinerarySearch({
    access_token,
    multiCityData,
    adults: adult,
    children: child,
    infants: infant,
    travelClass: cabinClass,
    nonStop: nonStop,
  })
    .then(function (response) {
      return res.status(200).json({ response });
    })
    .catch(function (error) {
      return next(new HttpError(error.message || "No offers found.", 500));
    });

  // return res.status(200).json({ hello:1 });
};

const helpers = require("../untils/helpers");
const fs = require('fs');
var AmadeusHelpers = require("../untils/AmadeusHelpers");
 
 exports.offerSearch =    (req, res, next) => {
            const originLocationCode = req.query.originLocationCode || "CCU";
            const destinationLocationCode = req.query.destinationLocationCode || "BKfffK";
            const departureDate = req.query.departureDate || helpers.currentDate();
            const adults = parseInt(req.query.adults) || 2;
                    AmadeusHelpers.flightOfferSearch({
                                            originLocationCode,
                                            destinationLocationCode,
                                            departureDate,
                                            adults
                        }).then(function (response) {
                            //fs.unlink('hello.json');
                            if(typeof response['offersWithAirlineDetails'][1]!=='undefined'){
                                fs.writeFileSync('hello.json', JSON.stringify(response['offersWithAirlineDetails'][1]));
                            }
                           
                                    res.status(200).json({ 
                                        inputs: {
                                                originLocationCode,
                                                destinationLocationCode,
                                                departureDate
                                        },
                                        response : response
                                    });
                        }).catch(function (error) {
                                    
                                    next(error);
                        });

};
exports.offerPrice =  (req, res, next) => {
    fs.readFile('hello.json', (err, data) => {
       const offer = JSON.parse(data);
       AmadeusHelpers.flightPriceOffer(offer).then(function(response){
                    res.status(200).json({
                    response,
                    offer,
                });

       }); 
    });
}

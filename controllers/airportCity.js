const helpers = require("../untils/helpers");
var AmadeusHelpers = require("../untils/AmadeusHelpers");
var HttpError = require("../models/http-error");

exports.searchByKeyword =    (req, res, next) => {
    const keyword = req.query.keyword ;
    AmadeusHelpers.AirportCitySearch(keyword).then(function (response) {
        if(response.length === 0){
            return next(new HttpError(
                    'Airport for that city not found.',
                    500
            ));
        }
        res.status(200).json({ 
                keyword,
                response
        });
      }).catch(function (response) {
                return next(new HttpError(
                        'Airport for that city not found.',
                        500
                ));
       });

}
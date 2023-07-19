const helpers = require("../untils/helpers");
var AmadeusHelpers = require("../untils/AmadeusHelpers");

exports.searchByKeyword =    (req, res, next) => {
    const keyword = req.query.keyword ;
    AmadeusHelpers.AirportCitySearch(keyword).then(function (response) {
        res.status(200).json({ 
                keyword,
                response
            });
      }).catch(function (response) {
                const err = {};
                console.log(response);
                err.statusCode = 500;
                err.message = 'Airport city not found';
                next(err);
       });

}
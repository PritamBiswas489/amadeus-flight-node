const mongoose = require('mongoose');
const EnteroprizeToken = require('../models/EnteroprizeToken');

const clearAccessToken = async function(){
    try{
        await EnteroprizeToken.deleteMany({});
    }catch (error) {
        console.log(error);
        throw error;
    }

}
const insertAccessToken = async function(accessTokenData){
    try{
        const newToken = new EnteroprizeToken(accessTokenData);
        const response = await newToken.save();
       // mongoose.connection.close();
    }catch (error) {
        console.log(error);
        throw error;
    }
} 

const getAccessToken  = async function(){
    try{
       const response =  EnteroprizeToken.findOne({});
       return response;
    }catch (error) {
        console.log(error);
        throw error;
    }

}


module.exports = {
    insertAccessToken,
    clearAccessToken,
    getAccessToken
     
};
  
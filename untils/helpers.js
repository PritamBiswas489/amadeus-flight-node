const fs = require('fs');
const path = require('path');
const axios = require('axios');
const imageSize = require('image-size');
const https = require('https');
const svg2png = require('svg2png');
const cheerio = require('cheerio');


const currentDate = function(){
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}
function getTimeFromDateTime(datetime){
        const myDate = new Date(datetime);
        const timeInMilliseconds = myDate.getTime();
        const timeInSeconds = timeInMilliseconds / 1000;
        const hours = myDate.getHours();
        const minutes = myDate.getMinutes();
        const seconds = myDate.getSeconds();

        return {hours,minutes};
}
function getDateFromDateTime(datetime){
    const date = new Date(datetime);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
  
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month < 10 ? `0${month}` : month;
  
    return `${year}-${formattedMonth}-${formattedDay}`;
}
function numberOfDaysFromTwoDate(departuretime, arrivalDatetime){
    // Create two Date objects representing the two dates
        const startDate = new Date(departuretime);
        const endDate = new Date(arrivalDatetime);

        // Calculate the time difference in milliseconds
        const timeDifference = endDate.getTime() - startDate.getTime();

        // Convert the time difference from milliseconds to days
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        return Math.floor(daysDifference);
}
function totalDuration(departuretime, arrivalDatetime){
    const startDate = new Date(departuretime);
    const endDate = new Date(arrivalDatetime);
    
    // Calculate the time difference in milliseconds
    const timeDifference = endDate.getTime() - startDate.getTime();
    
    // Calculate hours and minutes from the time difference
    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    return {hours,minutes,timeDifference};
}



  function isAmadeusAccessTokenExpired(token) {
    // Assuming your token contains the expiration time in seconds
    const expirationSeconds = parseInt(token.expires_in) * 1000; // Replace this with the actual key that stores the expiration time in seconds
  
    // Get the token creation time (in Unix timestamp format)
    const creationTime = parseInt(token.created); // Replace this with the actual key that stores the creation time
  

    // Calculate the expiration time (in Unix timestamp format) by adding the seconds to the creation time
    const expirationTime = creationTime + expirationSeconds;
  
    // Get the current timestamp (in seconds)
    const currentTime = Date.now();


   
  
    // Calculate the time difference in seconds
    const timeDifferenceInMilliseconds = expirationTime - currentTime;
    const minutes = Math.floor(timeDifferenceInMilliseconds / (1000 * 60));

  
    console.log({expirationTime,currentTime,minutes});
  
    // Compare the time difference with 15 seconds or if the current time is greater than or equal to the expiration time
    if (minutes <= 8 ||  currentTime >= expirationTime) {
      return true;
    } else {
      return false;
    }
  }
  function removeDuplicateData(originalArray) {
    const uniqueObjects = originalArray.filter(
      (obj, index, arr) =>
        arr.findIndex((item) => item.iataCode === obj.iataCode) === index
    );
  
    return uniqueObjects;
  }

  function getTimeInterval(hour, minute) {
    // Convert hour and minute to a single minute value for easy comparison
    const totalMinutes = parseInt(hour) * 60 + parseInt(minute);

    // console.log("============= hour =======================");
    // console.log({hour,minute});

    // console.log("============= minute =======================");
  
    if (totalMinutes < 6 * 60) {
      return 'Before_6_AM';
    } else if (totalMinutes < 12 * 60) {
      return '6_AM_12_PM';
    } else if (totalMinutes < 18 * 60) {
      return '12_PM_6_PM';
    } else {
      return 'After_6_PM';
    }
  }
  function addDaysWithDaY(dateParams,numberOfDaysToAdd){
    let currentDate = new Date(dateParams); // For example, November 1, 2023

     

    // Add the specified number of days
    currentDate.setDate(currentDate.getDate() + numberOfDaysToAdd);

    // Format the new date as a string (e.g., YYYY-MM-DD)
    let formattedDate = currentDate.toISOString().split('T')[0];
    return formattedDate;

  }

  function getNumberOfDateBetWenTwoDate(fromDate,toDate){
    // Define two date strings
    const date1String = new Date(fromDate);
    const date2String = new Date(toDate);

    // Convert the date strings into Date objects
    const date1 = new Date(date1String);
    const date2 = new Date(date2String);

    // Calculate the time difference in milliseconds
    const timeDifference = date2.getTime() - date1.getTime();

    // Convert the time difference to days (1 day = 24 * 60 * 60 * 1000 milliseconds)
    const daysDifference = Math.floor(timeDifference / (24 * 60 * 60 * 1000));

    return daysDifference;

  }
  function getAllDatesBetweenTwoDateFourDaysGap(fromDate, toDate) {
    const dateArray = [];
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    let currentDate = new Date(startDate);
  
    while (currentDate <= endDate) {
      dateArray.push(getDateFromDateTime(new Date(currentDate)));
      currentDate.setDate(currentDate.getDate() + 4);
    }
  
    return dateArray;
  }

  function findMinTotalPrice(data) {
    if (data.length === 0) {
        return null; // Handle the case where the array is empty
    }

    let minPrice = 5000000000000;

    for (let i = 0; i <= data.length; i++) {
      if(data[i]?.totalPrice){
        const currentPrice = parseFloat(data[i]?.totalPrice);
        
        if (!isNaN(currentPrice) && currentPrice < minPrice) {
            minPrice = currentPrice;
        }
      }
       
    }

    return minPrice.toFixed(2); // Convert it back to a string with 2 decimal places
}

function findMaxTotalPrice(data) {
  if (data.length === 0) {
      return null; // Handle the case where the array is empty
  }

  let maxPrice = 0;

  for (let i = 0; i <= data.length; i++) {
    if(data[i]?.totalPrice){
      const currentPrice = parseFloat(data[i].totalPrice);
      if (!isNaN(currentPrice) && currentPrice > maxPrice) {
          maxPrice = currentPrice;
      }
    }
  }

  return maxPrice.toFixed(2); // Convert it back to a string with 2 decimal places
}
async function isImageFromUrlBroken(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    // Check if the HTTP request was successful
    if (response.status !== 200) {
      return true; // Consider it as a broken image
    }

    // Get the image dimensions (this will throw an error if the image is broken)
    const dimensions = imageSize(response.data);

    return dimensions.width === 0 || dimensions.height === 0;
  } catch (error) {
    return true; // Consider it as a broken image if there is an error during the request
  }
}

async function downloadImageFromURL(url, localPath) {
 
const file = fs.createWriteStream(localPath);

https.get(url, response => {
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log(`Image downloaded as ${url}`);
  });
}).on('error', err => {
  fs.unlink(imageName);
  console.error(`Error downloading image: ${err.message}`);
});

}
async function saveFlightImage(imageNeedToSave){
  const saveDirectory = './images';
  if (!fs.existsSync(saveDirectory)) {
      fs.mkdirSync(saveDirectory);
  }
  const promises = imageNeedToSave.map(async (imageArr, index) => {
      const localPath = path.join(saveDirectory, imageArr.name);
      fs.access(localPath, fs.constants.F_OK, async(err) => {
        if (err) {
          return await downloadImageFromURL(imageArr.url, localPath);
        } else {
          console.log("File exists");
        }
      });
  });
  const resolvedData = await Promise.all(promises);
  return resolvedData;
}

function checkImageNeedToSave(imageFile){
  const saveDirectory = './images';
  const localPath = path.join(saveDirectory, imageFile);
   
  if (fs.existsSync(localPath)) {
    return false;
  } else {
    return true;
  }

}
function checkPngImageNeedToSave(imageFile){
  const saveDirectory = './images/svgpng';
  const localPath = path.join(saveDirectory, imageFile);
   
  if (fs.existsSync(localPath)) {
    return false;
  } else {
    return true;
  }

}

async function convertFlightLogoImageSvgToPng(imageNeedToSave){
  const pngDirectory = './images/svgpng';
  const svgDirectory = './images';

  const promises = imageNeedToSave.map(async (imageArr, index) => {
      const localSvgPath = path.join(svgDirectory, imageArr+'.svg');
      const localPngPath = path.join(pngDirectory, imageArr+'.png');
      const svgContent = fs.readFileSync(localSvgPath, 'utf-8');
     
      const buffer = await svg2png(svgContent, { width:600, height:600 }) // Specify the desired width and height
      fs.writeFileSync(localPngPath, buffer);      
   })
   const resolvedData = await Promise.all(promises);
   return resolvedData;
}

  

module.exports = {
    currentDate ,
    getTimeFromDateTime, 
    getDateFromDateTime,
    numberOfDaysFromTwoDate,
    totalDuration,
    isAmadeusAccessTokenExpired,
    removeDuplicateData,
    getTimeInterval,
    addDaysWithDaY,
    getNumberOfDateBetWenTwoDate,
    getAllDatesBetweenTwoDateFourDaysGap,
    findMinTotalPrice,
    findMaxTotalPrice,
    downloadImageFromURL,
    saveFlightImage,
    isImageFromUrlBroken,
    checkImageNeedToSave,
    convertFlightLogoImageSvgToPng,
    checkPngImageNeedToSave
  };
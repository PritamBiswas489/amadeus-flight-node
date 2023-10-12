const path = require('path');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
require('dotenv').config();

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flight')
const { v4: uuidv4 } = require('uuid');

const app = express();

// const corsOptions = {
//   origin: ['http://localhost:3000', 
//   'https://http://amadeus.newpritam.aqualeafitsol.com/'
// ],
//   // You can also specify multiple origins:
//   // origin: ['https://frontend1.com', 'https://frontend2.com'],
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true, // If you're using cookies or sessions
// };

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET','POST','HEAD','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Type']
};


app.use(cors(corsOptions));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));
 


app.use((req, res, next) => {
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Request-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  if (req.method === "OPTIONS") {
    res.header('Access-Control-Allow-Methods', '*');
    return res.status(200).json({});
  }
  
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);


//================== flight booking amadeus AMADEUS API ==================================//

app.use('/flight',flightRoutes);

 



app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// app.listen(8080);

mongoose
  .connect(
    'mongodb+srv://myfirstdb:Pritam123@cluster0.t6lxghn.mongodb.net/mitigate?retryWrites=true'
  )
  .then(result => {
    console.log("======= server start at 8080 =======");
    app.listen(8080);
  })
  .catch(err => console.log(err));

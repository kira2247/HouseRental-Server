const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); //parse url
const morgan = require('morgan'); //logger
const app = express();
const cors = require('cors');

//routes
const housesRoute = require('./routes/houses');
const userRoute = require('./routes/user');

//DB Setup
mongoose.connect('mongodb://heroku_lhgfwx4j:heroku_lhgfwx4j@ds127963.mlab.com:27963/heroku_lhgfwx4j');
app.use(morgan('combined'));
app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/houses', housesRoute);
app.use('/user', userRoute);

//catch 404 and forward to error handler
app.use((req,res,next) => {
	const err = new Error('Can not find this path');
	err.status = 404;
	next(err);
})


const port = process.env.PORT || 3000;

const server = http.createServer(app);
server.listen(port);

console.log('Listening on port: ', port);

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); //parse url
const morgan = require('morgan'); //logger
const app = express();
const cors = require('cors');

//routes
const housesRoute = require('./routes/houses');

//DB Setup
mongoose.connect('mongodb://localhost:rental/rental');

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json({type: '*/*'}));

app.use('/houses', housesRoute);

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

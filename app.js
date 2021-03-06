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

// mongodb://localhost:rental/rental
// mongodb://tanhuynh1008:Loveu4ever@ds129043.mlab.com:29043/heroku_prg7ghqc
// https://thue-nha.herokuapp.com
//DB Setup
mongoose.connect('mongodb://tanhuynh1008:Loveu4ever@ds129043.mlab.com:29043/heroku_prg7ghqc');
app.use(morgan('combined'));

app.use(cors({
	"origin": "https://thue-nha.herokuapp.com",
	"methods": "GET,PUT,PATCH,POST,DELETE,OPTIONS",
	"allowedHeaders": "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json",
	"credentials": true
}));

app.disable('etag');

app.get('/favicon.ico', function(req, res) {
    res.status(204);
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

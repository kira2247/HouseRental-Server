const express = require('express');
const router = express.Router();
const House = require('../models/house');
const _ = require('lodash');
const cloudinary = require('cloudinary');
const superagent = require('superagent');
const multer  =   require('multer');

const storage = multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, './public/uploads');
      },
      filename: function (req, file, callback) {
        console.log(file);
        callback(null, Date.now()+'-'+file.originalname)
		}
    });

    const upload = multer({storage: storage}).array('cidImages');

cloudinary.config({ 
  cloud_name: 'n-m', 
  api_key: '142655681245557', 
  api_secret: 'occOyRMQ3ya90S5Rg9BD7OzVBXk' 
});

router.post('/create', (req,res,next) => {
	const {ownersName, address, phoneNumber, rentalTargets, totalRoom} = req.body;
	
	const house = new House({ ownersName, address, phoneNumber, rentalTargets, totalRoom });

	house.save((err) => {
		if (err) {
			return next(err);
		}
		res.json({message: 'Create House Successfully !!!'});
	});
});

//create room with house id
router.post('/details/:id/create', (req,res,next) => {
	const {id} = req.params;
	const {roomName, roomPrice, elecRate, waterRate, note} = req.body;

	House.findOne({_id: id}, (err,house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				error: {message: 'Can not find any house'}
			})
		}

		house.rooms.push({roomName, roomPrice, elecRate, waterRate, note});
		house.save((err, result)=> {
			if (err) {
                return next(err);
            }
            res.json({message: 'Room Added Successfully'});
		});
	});
});

//placeholder add image 

router.post('/add/image', (req,res,next) => {
	 upload(req, res, function(err) {
          if(err) {
            console.log('Error Occured');
            return;
        }
        console.log(req.files);
	});
	// console.log(req.body);
	// _.map(req.files, file=> {superagent.post("https://api.cloudinary.com/v1_1/n-m/upload")
	// 			.field("upload_preset","xbhwfh3j")
	// 			.field("file", file)
	// 			.end((err,response) => {
	// 				if(err){
	// 					// dispatch( actionError(err, CREATE_ERROR));
	// 					console.log(err);
	// 				}else {
	// 					// dispatch({type: UPLOAD_IMAGE});
	// 					console.log(response);
	// 				}

	// 			});
	// 		}) // contains non-file fields
  	 // contains files
	// const {houseid, roomid} = req.params;

	// House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) =>{
	// 	if(err) {
	// 		return res.status(500).json({
	// 			message: 'There are some error',
	// 			error: err
	// 		});
	// 	}
	// 	if(!house) {
	// 		return res.status(500).json({
	// 			message: 'Wrong house or room id!'
	// 		})
	// 	}


	// 	house.rooms.id(roomid).renters.push({fullName,cidNum,dob,homeTown,startRentingDate});
	// 	house.save((err, result)=> {
	// 		if (err) {
 //                return next(err);
 //            }
 //            res.json({message: 'Renter Added Successfully'});
	// 	});
	// });
	// cloudinary.v2.uploader.upload(cidImages[0].preview, (err,result) =>{
	// 	if(err) {
	// 		res.status(500).json({
	// 			error: err
	// 		});
	// 	}

	// 	res.status(200).json({
	// 		result:result
	// 	});
	// });	
	// 
	
	
});

//add renter with houseId and roomId
router.post('/add/:houseid/:roomid/renter', (req,res,next) => {
	const {houseid, roomid} = req.params;
	const {fullName,cidNum,dob,homeTown,startRentingDate} = req.body;

	House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}
		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room id!'
			})
		}
		house.rooms.id(roomid).renters.push({fullName,cidNum,dob,homeTown,startRentingDate});
		house.save((err, result)=> {
			if (err) {
                return next(err);
            }
            res.json({message: 'Renter Added Successfully'});
		});
	});
});


//get list of houses
router.get('/', (req,res,next) => {
	const listReturn = ['ownersName', 'address', 'phoneNumber', 'rentalTargets', 'totalRoom'];

	House.find({}).select(listReturn).exec((err, houses) => {
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}
		res.status(200).json({
			houses: houses,
			message: 'Get All House Successfully'
		});
	});
});

//get rooms with house id
router.get('/details/:id', (req,res,next) => {
	const {id} = req.params;
	House.findOne({_id: id}).select('rooms').exec((err,house) => {
		if(err) {
			return res.status(500).json({
				message: 'There is some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				error: {message: 'Can not find any house'}
			})
		}

		res.status(200).json({
			rooms: house.rooms,
			message: 'Get Rooms Successfully'
		})
	})
});

module.exports = router;
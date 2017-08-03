const express = require('express');
const router = express.Router();
const House = require('../models/house');
const User = require('../models/user');
const _ = require('lodash');
const cloudinary = require('cloudinary');
const multer = require('multer');
const Datauri = require('datauri');
const dUri = new Datauri();
const path = require("path");
const Promise = require("bluebird");
const jwt = require('jsonwebtoken');
const config = require('../config');
const moment = require('moment');

//Config multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).any(); 

// const storage = multer.diskStorage({
// 	destination: function (req,file,cb) {
// 		cb(null, './uploads');
// 	},
// 	filename: function(req,file,cb) {
// 		cb(null,Date.now()+file.originalname);
// 	}
// });
// const upload = multer({ storage: storage }).any(); 

//config cloudinary
cloudinary.config({ 
  cloud_name: 'n-m', 
  api_key: '142655681245557', 
  api_secret: 'occOyRMQ3ya90S5Rg9BD7OzVBXk' 
});

router.use(['add', '/edit', '/update', '/form', '/details/:houseid/:roomid'], (req,res,next) => {
		jwt.verify(req.query.token, config.secret , function (err, decoded) {
        if (err) {
            return res.status(401).json({
                message: 'You should login first!'
            });
        }
        next();
    })
})

router.post('/add', (req,res,next) => {
	const decoded = jwt.decode(req.query.token);
	
	User.findById(decoded.sub, (err,user)=> {

		if (err) {
            return res.status(500).json({
                message: 'An error occurred'
            });
        }

        const {ownersName, address, phoneNumber, rentalTargets, totalRoom} = req.body;
	
		const house = new House({ ownersName, address, phoneNumber, rentalTargets, totalRoom, creator: user});

		house.save((err) => {
			if (err) {
				return next(err);
			}
			res.json({message: 'Create House Successfully !!!'});
		})       
	})	
})

//add room with house id
router.post('/add/:houseid', (req,res,next) => {
	const {houseid} = req.params;
	const {roomName, roomPrice, elecRate, waterRate, note, area} = req.body;
	const decoded = jwt.decode(req.query.token);

	House.findOne({_id: houseid, 'rooms.roomName': roomName}, (err,house) =>{
		if(err) {
			return res.status(500).json({
				error: 'Invalid House'
			})
		}

		if(house) {
			return res.status(500).json({
				error: 'Room name "' + roomName + '" exists, please try another name'
			})
		}

		House.findById(houseid, (err, house) => {
			if(err) {
				return res.status(500).json({
					error: 'An error occurred'
				})
			}			

			if(house.creator.toString() !== decoded.sub) {
				return res.status(500).json({
					error: 'User not match!'
				})
			}

			House.findOneAndUpdate({_id:houseid}, {$push: { rooms: {roomName, roomPrice, elecRate, waterRate, note, area}}}, (err,house) => {
				if(err) {
					return res.status(500).json({
						error: 'There are some error'
					})
				}
				
				return res.status(200).json({
					message: 'Room Added Successfully'
				})
			})
		})		
	})
})

//add renter with houseId and roomId
router.post('/add/:houseid/:roomid/renter', (req,res,next) => {
	upload(req, res, (err) => {

		if (err) {
            return res.status(500).json({
            	error: { message: 'Some error occured!'}
            })
        }     

        const {fullName,cidNum,dob,homeTown,startRentingDate} = req.body;
        const {houseid, roomid} = req.params;
        const cidImages = [];
        const decoded = jwt.decode(req.query.token);

        House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		if(req.files.length !== 0) {
			Promise.map(req.files , image => {
					dUri.format(path.extname(image.originalname).toString(), image.buffer);
					return cloudinary.v2.uploader.upload(dUri.content, {width: 960, height: 640}, (err,result) =>{
					if(err) {
						res.status(500).json({
							error: err
						});
					}
					const {url, public_id} = result;
					const data = {url, _id: public_id};
					cidImages.push(data);
					})
				}).then( () => {
					house.rooms.id(roomid).renters.push({fullName,cidNum,dob,homeTown,startRentingDate, cidImages});
					house.save((err, result)=> {
						if (err) {
	                		return next(err);
	           			}
	           			house.pushTotalRenter(roomid, house.rooms.id(roomid).renters.length);
		            	res.status(200).json({message: 'Renter Added Successfully'});
						});
				});	
		} else {
			house.rooms.id(roomid).renters.push({fullName,cidNum,dob,homeTown,startRentingDate, cidImages});
			house.save((err, result)=> {
				if (err) {
	                return next(err);
	           	}
	           	house.pushTotalRenter(roomid, house.rooms.id(roomid).renters.length);
		        res.status(200).json({message: 'Renter Added Successfully'});
				});
			}
		});    
  	});
});

//add record with houseId and roomId
router.post('/add/:houseid/:roomid/record', (req,res,next) => {
	const {houseid, roomid} = req.params;
	const {paymentTime, usedElecNum, usedWaterNum, note, roomPrice, otherPayment} = req.body;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}
		
		const total = _.sum([otherPayment,roomPrice,usedElecNum*house.rooms.id(roomid).elecRate,usedWaterNum*house.rooms.id(roomid).waterRate]);
		house.rooms.id(roomid).records.push({paymentTime, usedElecNum, usedWaterNum, note, roomPrice, otherPayment, total});
		house.save((err, result)=> {
			if (err) {
	            return next(err);
	        }
		    res.status(200).json({message: 'Record Added Successfully'});
		});

	}); 
})



//get list of houses
router.get('/', (req,res,next) => {
	const listReturn = ['ownersName', 'address', 'phoneNumber', 'rentalTargets', 'totalRoom', 'creator'];

	House.find({}).populate('creator', 'displayName').select(listReturn).exec((err, houses) => {
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

//get house rooms with house id
router.get('/details/:id', (req,res,next) => {
	const {id} = req.params;
	House.findOne({_id: id}).exec((err,house) => {

		if(err) {
			return res.status(500).json({
				message: 'There is some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Can not find any house'
			})
		} 

		const temp = _.filter(house.rooms, function(data) {return data.totalRenter !== 0;});
		
		Promise.map(temp, room => {
			if (room.records.length!==0){
				const lastPayment = _.last(room.records).paymentTime;
				house.updatePaymentStatus(room._id, moment().isSame(lastPayment, "months"))
			}
		}).then(() => {
			House.findOne({_id: id}).select("-rooms.records -rooms.renters").exec((err, result) => {
				if(err) {
					return res.status(500).json({
						message: 'There is some error',
						error: err
					});
				}

				return res.status(200).json({
						rooms: result.rooms,		
						message: 'Get Rooms Successfully'
				})
			})			
		})		
	})
});

//get house form with house details
router.get('/form/house/:id', (req,res,next) => {
	const {id} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({_id:id}).select('-rooms').exec((err,house) => {
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

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		res.status(200).json({
			house: house,
			message: 'Get House Form Details Successfully'
		})
	})
})

//get room form with room details by houseid, roomid

router.get('/form/house/:houseid/room/:roomid', (req,res,next) => {
	const {houseid, roomid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id':roomid}, (err, house) => {
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		
		const {note, roomName, roomPrice, elecRate, waterRate, area} = house.rooms.id(roomid);
		const data = {note, roomName, roomPrice, elecRate, waterRate, area};

		res.status(200).json({
			room: data,
			message: 'Get Room Form Details Successfully'
		});
	});
});


//get renter form with renter details by houseid, roomid, renter id
router.get('/form/house/:houseid/room/:roomid/renter/:renterid', (req,res,next) => {
	const {houseid, renterid,roomid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid, 'rooms.renters._id': renterid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room or renter information'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		res.status(200).json({
			renter: house.rooms.id(roomid).renters.id(renterid),
			message: 'Get Renter Form details Successfully'
		})
	});
}); 

//get record form with record details by houseid, roomid, recordid
router.get('/form/house/:houseid/room/:roomid/record/:recordid', (req,res,next) => {
	const {houseid, recordid,roomid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid, 'rooms.records._id': recordid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room or record information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		res.status(200).json({
			record: house.rooms.id(roomid).records.id(recordid),
			message: 'Get Record Form details Successfully'
		})
	});
}) 

//get room details with house&room id
router.get('/details/:houseid/:roomid', (req,res,next) => {
	const {houseid, roomid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid}, (err,house) => {
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				message: 'User not match!'
			})
		}
		
		const {renters, records, note, roomName, roomPrice, elecRate, waterRate} = house.rooms.id(roomid);

		const data = { renters, records, note, roomName, roomPrice, elecRate, waterRate};

		res.status(200).json({
			room: data,
			message: 'Get Room Details Successfully'
		});

	});
});

//update house info with house id
router.patch('/update/house/:id', (req,res,next) => {
	const {id} = req.params;
	const {ownersName, address, phoneNumber, rentalTargets, totalRoom} = req.body;
	const decoded = jwt.decode(req.query.token);

	House.findById(id, (err, house) => {
		if (err) {
            return res.status(500).json({
                message: 'An error occurred',
                error: err
            });
        }
        
        if (!house) {
            return res.status(500).json({
                message: 'No House Found!'
            });
        }

        if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}
                
        house.ownersName = ownersName;
        house.address= address;
        house.phoneNumber= phoneNumber;
        house.rentalTargets= rentalTargets;
        house.totalRoom = totalRoom;

        house.save((err, result)=> {
			if (err) {
	            return next(err);
	        }
		    res.status(200).json({message: 'House Info Updated Successfully'});
		});
	})
})

//update room info with house id
router.patch('/update/house/:houseid/room/:roomid', (req,res,next) => {
	const {houseid, roomid} = req.params;
	const {roomName, roomPrice, elecRate, waterRate, note} = req.body;
	const decoded = jwt.decode(req.query.token);

	House.findOne({_id: houseid, 'rooms.roomName': roomName}, (err,house) =>{
		if(err) {
			return res.status(500).json({
				error: 'Invalid House',
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		if(house && house.rooms.id(roomid).roomName!==roomName) {
			return res.status(500).json({
				error: 'Room name "' + roomName + '" exists, please try another name'
			})
		}

		House.findById(houseid, (err, house) => {
			if(err) {
				return res.status(500).json({
					error: 'Invalid room'
				})
			}			

			if(house.creator.toString() !== decoded.sub) {
				return res.status(500).json({
					error: 'User not match!'
				})
			}

			House.findOneAndUpdate({'_id':houseid, 'rooms._id': roomid}, {$set: { 'rooms.$': {roomName, roomPrice, elecRate, waterRate, note}}}, (err,house) => {
				if(err) {
					return res.status(500).json({
						error: 'Invalid room'
					})
				}
				
				return res.status(200).json({
					message: 'Room Edited Successfully'
				})
			})
		})		
	})
})

//update renter info with house id, room id, renter id
router.patch('/update/house/:houseid/room/:roomid/renter/:renterid', (req,res,next) => {
	upload(req, res, (err) => {

		if (err) {
            return res.status(500).json({
            	error: { message: 'Some error occured!'}
            })
        }     

        const {fullName,cidNum,dob,homeTown,startRentingDate} = req.body;
        const {houseid, roomid, renterid} = req.params;
        const cidImages = [];
        const decoded = jwt.decode(req.query.token);

        House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		if(req.files.length!== 0) {
			Promise.map(req.files , image => {
					dUri.format(path.extname(image.originalname).toString(), image.buffer);
					return cloudinary.v2.uploader.upload(dUri.content, {width: 960, height: 640}, (err,result) =>{
					if(err) {
						res.status(500).json({
							error: err
						});
					}
					const {url, public_id} = result;
					const data = {url, _id: public_id};
					house.rooms.id(roomid).renters.id(renterid).cidImages.push(data);
					})
				}).then( () => {
					house.rooms.id(roomid).renters.id(renterid).set({fullName,cidNum,dob,homeTown,startRentingDate});
					house.save((err, result)=> {
						if (err) {
	                		res.status(500).json({
	                			message: 'Cannot connect to database'
	                		})
	           			}
		            	res.status(200).json({message: 'Renter Edited Successfully'});
						});
				});	
		} else {
			house.rooms.id(roomid).renters.id(renterid).set({fullName,cidNum,dob,homeTown,startRentingDate});
			house.save((err, result)=> {
				if (err) {
	                res.status(500).json({
	                	message: 'Cannot connect to database'
	                })
	           	}
		        res.status(200).json({message: 'Renter Edited Successfully'});
				});
			}
		});    
  	});
});

//update record details by houseid, roomid, recordid
router.patch('/update/house/:houseid/room/:roomid/record/:recordid', (req,res,next) => {
	const {houseid, roomid, recordid} = req.params;
	const {paymentTime, usedElecNum, usedWaterNum, note, roomPrice, otherPayment} = req.body;
 	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}


		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}
		
		const total = _.sum([otherPayment,roomPrice,usedElecNum*house.rooms.id(roomid).elecRate,usedWaterNum*house.rooms.id(roomid).waterRate]);
		house.rooms.id(roomid).records.id(recordid).set({paymentTime, usedElecNum, usedWaterNum, note, roomPrice, otherPayment, total});
		house.save((err, result)=> {
			if (err) {
	                res.status(500).json({
	                	message: 'Cannot connect to database'
	                })
	           	}
		    res.status(200).json({message: 'Record Edited Successfully'});
		});
	}); 
});

//delete Image
router.delete('/delete/house/:houseid/room/:roomid/renter/:renterid/image/:publicId', (req,res,next) => {
	const {publicId, houseid, roomid, renterid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid}, (err,house) => {
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		cloudinary.v2.uploader.destroy(publicId, {invalidate:false}, (err,result) => {
			if(err) {
				return res.status(500).json({
					error: err
				})
			}
		})

		house.rooms.id(roomid).renters.id(renterid).cidImages.id(publicId).remove();
		house.save((err, result) => {
			if(err){
				return res.status(500).json({
					err
				})
			}

			res.status(200).json({
				message: 'Delete Images Successfully!'
			})
		});
	})	
}) 


//delete record by houseid, roomid, recordid
router.delete('/delete/house/:houseid/room/:roomid/record/:recordid', (req,res,next) => {
	const {houseid, roomid, recordid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid, 'rooms.records._id': recordid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room or record information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}
		
		house.rooms.id(roomid).records.id(recordid).remove();
		house.save((err, result)=> {
			if (err) {
	                res.status(500).json({
	                	message: 'Cannot connect to database'
	                })
	           	}
		    res.status(200).json({message: 'Record Removed Successfully'});
		});
	}); 
});

//delete renter by houseid, roomid, renterd
router.delete('/delete/house/:houseid/room/:roomid/renter/:renterid', (req,res,next)=> {
	const {houseid,roomid, renterid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid, 'rooms.renters._id': renterid}, (err, house) =>{
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room or renter information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		const {cidImages} = house.rooms.id(roomid).renters.id(renterid);

		if(cidImages.length!==0) {
			Promise.map(cidImages, cidImage => {
				return cloudinary.v2.uploader.destroy(cidImage._id, {invalidate:false}, (err,result) => {
						if(err) {
							return res.status(500).json({
								message: 'cannot delete renter'
							})
						}
					})
				}).then(() => {
					house.rooms.id(roomid).renters.id(renterid).remove();
					house.save((err, result)=> {
						if (err) {
				                res.status(500).json({
				                	message: 'Cannot connect to database'
				                })
				           	}
				        house.pushTotalRenter(roomid, house.rooms.id(roomid).renters.length);
					    res.status(200).json({message: 'Renter Removed Successfully'});
					});
				})
			}		
		else {
			house.rooms.id(roomid).renters.id(renterid).remove();
			house.save((err, result)=> {
				if (err) {
		                res.status(500).json({
		                	message: 'Cannot connect to database'
		                })
		           	}
		        house.pushTotalRenter(roomid, house.rooms.id(roomid).renters.length);
			    res.status(200).json({message: 'Renter Removed Successfully'});
			});
		}
	}); 
})

//delete room by houseid, roomid
router.delete('/delete/house/:houseid/room/:roomid', (req,res,next) => {

	const {houseid,roomid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid, 'rooms._id': roomid}, (err, house) => {
 
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house or room information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		const {renters} = house.rooms.id(roomid)

		Promise.map(renters, renter => {
			const {cidImages} = renter;
			return Promise.map(cidImages, image => {				
				return cloudinary.v2.uploader.destroy(image._id, {invalidate:false}, (err, result)=> {
					if(err) {
						return res.status(500).json({
							message: 'Cannot delete room'
						})
					}
				})
			})
		}).then(()=> {
			house.rooms.id(roomid).remove();
			house.save((err, result) => {
				if(err) {
					return res.status(500).json({
						message: 'Cannot connect to database'
					})
				}
				res.status(200).json
			})
			return res.status(200).json({
				message: 'Room Deleted Successfully'
			})
		})
	})
})

//delete house by houseid
router.delete('/delete/house/:houseid', (req,res,next)=>{
	const {houseid} = req.params;
	const decoded = jwt.decode(req.query.token);

	House.findOne({'_id': houseid}, (err, house) => {
 
		if(err) {
			return res.status(500).json({
				message: 'There are some error',
				error: err
			});
		}

		if(!house) {
			return res.status(500).json({
				message: 'Wrong house information!'
			})
		}

		if(house.creator.toString() !== decoded.sub) {
			return res.status(500).json({
				error: 'User not match!'
			})
		}

		const {rooms} = house;

		Promise.map(rooms, room => {
			const {renters} = room;
			return Promise.map(renters, renter => {		
				const {cidImages} = renter;
				return Promise.map(cidImages, image=> {
					return cloudinary.v2.uploader.destroy(image._id, {invalidate:false}, (err, result)=> {
						if(err) {
							return res.status(500).json({
								message: 'Cannot delete room'
							})
						}
					})
				})				
			})
		}).then(()=> {
			house.remove();
			house.save((err, result) => {
				if(err) {
					return res.status(500).json({
						message: 'Cannot connect to database'
					})
				}
				res.status(200).json
			})

			return res.status(200).json({
				message: 'House Deleted Successfully'
			})
		})
	})
});

router.get('/check/ownerShip', (req,res,next) => {
	const {houseid,token} = req.query;

	if (!token) {
		console.log('abc');
		return res.status(200).json({ownerShip: false});
	} else {
		jwt.verify(token, config.secret , function (err, decoded) {

	        if (err) {
	            return res.status(401).json({
	                message: 'Invalid access property!'
	            });
	        }
	        
	        House.findById(houseid, (err, house) => {
	        	if(err) {
	        		return res.status(500).json({
	        			message: 'invalid house'
	        		})
	        	}

	        	if(house.creator.toString() === decoded.sub) {
					return res.status(200).json({
						ownerShip: true
					})
				}

				return res.status(200).json({
					ownerShip:false
				})
	        })
		})
	}
});

module.exports = router;
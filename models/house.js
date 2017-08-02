const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const User = require('./user');

const houseSchema = new Schema({
	__v:false,
	ownersName : {type: String, default: null, trim:true},
	address: {type: String, default: null, trim:true},
	phoneNumber: {type: String, default: null, trim:true},
	rentalTargets: {type: String, default: null, trim:true},
	totalRoom: {type: Number, default: null},
	rooms: [{
		roomName: {type: String, default: null, trim:true},
		roomPrice: {type: Number, default: null},
		elecRate: {type: Number, default: null},
		waterRate: {type: Number, default: null},
		renters: [{
			fullName: {type: String, default: null, trim:true},
			cidNum: {type: String, default: null, trim:true},
			dob: {type: Date, default: null},
			homeTown: {type: String, default: null, trim:true},
			startRentingDate: {type: Date, default: moment().format('D MMM YYYYY')},
			cidImages: [{
				url: {type: String, default: null, trim:true},
				_id: false
			}]
		}],
		records: [{
			paymentTime: {type: Date, default: moment().format('D MMM YYYY')},
			roomPrice: {type: Number, default: null },
			usedElecNum: {type: Number, default: null },
			usedWaterNum: {type: Number, default: null},
			otherPayment: {type: Number, default: null},
			total: {type: Number, default: null},
			note: {type: String, default: null, trim:true}
		}],
		totalRenter: {type: Number, default: 0},
		area: {type: Number, default: null},
		payment: {type: Boolean, default: false},
		note: {type: String, default: null, trim:true}
	}],
	creator: {type: Schema.Types.ObjectId, ref: 'User'}
});

houseSchema.methods.pushTotalRenter = function(roomid, totalRenter) {
	const house = this;

	house.rooms.id(roomid).set({totalRenter});
	house.save();
}

houseSchema.methods.updatePaymentStatus = function(roomid, paymentStatus) {
	const house = this;
	house.rooms.id(roomid).set({payment: paymentStatus});
	house.save();
}

const HouseModel = mongoose.model('House', houseSchema);

module.exports = HouseModel;
const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const User = require('./user');

const houseSchema = new Schema({
	__v:false,
	ownersName : {type: String, required:true, trim:true},
	address: {type: String, required:true, trim:true},
	phoneNumber: {type: String, required:true, trim:true},
	rentalTargets: {type: String, default: null, trim:true},
	totalRoom: {type: Number, default: null},
	paymentMethod: {type: String, trim:true},
	rooms: [{
		roomName: {type: String, required:true, trim:true},
		roomPrice: {type: Number, required:true},
		elecRate: {type: Number, required:true},
		waterRate: {type: Number, required:true},
		renters: [{
			fullName: {type: String, required:true, trim:true},
			cidNum: {type: String, default: null, trim:true},
			email: {type: String, trim:true},
			dob: {type: Date, required:true},
			homeTown: {type: String, required:true, trim:true},
			startRentingDate: {type: Date, default: moment().format('D MMM YYYYY')},
			cidImages: [{
				url: {type: String, default: null, trim:true},
				_id: false
			}]
		}],
		records: [{
			paymentTime: {type: Date, default: moment().format('D MMM YYYY')},
			roomPrice: {type: Number, required:true },
			usedElecNum: {type: Number, required:true },
			usedWaterNum: {type: Number, required:true},
			otherPayment: {type: Number, required:true},
			total: {type: Number, default: null},
			note: {type: String, required:true, trim:true},
			payment: {type: Boolean, default: false}
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
const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const houseSchema = new Schema({
	ownersName : {type: String, default: null},
	address: {type: String, default: null},
	phoneNumber: {type: String, default: null},
	rentalTargets: {type: String, default: null},
	totalRoom: {type: Number, default: null},
	rooms: [{
		roomName: {type: String, default: null, unique: true},
		roomPrice: {type: Number, default: null},
		elecRate: {type: Number, default: null},
		waterRate: {type: Number, default: null},
		// items: [{
		// 	itemName: {type: String, default: null},
		// 	itemPrice: {type: Number, default: null},
		// 	itemState: {type: Boolean, default: true}
		// }],
		renters: [{
			fullName: {type: String, default: null},
			cidNum: {type: String, default: null},
			dob: {type: Date, default: null},
			homeTown: {type: String, default: null},
			startRentingDate: {type: Date, default: moment().format('D MMM YYYYY')},
			cidImages: [{
				links: {type: String, default: null}
			}]
		}],
		records: [{
			paymentTime: {type: Date, default: moment().format('D MMM YYYY')},
			usedElecNum: {type: Number, default: null },
			usedWaterNum: {type: Number, default: null},
			elecPayment: {type: Number, default: null},
			waterPayment: {type: Number, default: null},
			otherPayment: {type: Number, default: null},
			note: {type: String, default: null}
		}],
		note: {type: String, default: null}
	}]
});

const HouseModel = mongoose.model('house', houseSchema);

module.exports = HouseModel;
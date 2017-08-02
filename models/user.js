const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
	__v: false,
	displayName: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	password: {type: String, required: true}
	// houses: [{type: Schema.Types.ObjectId, ref: 'House'}]
})

//hash password before saving
userSchema.pre('save', function(next) {
	
	const user = this;
	
	bcrypt.genSalt(10, function(err, salt) {
		if (err) { 
			return next(err); 
		}
		
		bcrypt.hash(user.password, salt, function(err,hash) {
			if (err) { 
				return next(err); 
			}
											
			user.password = hash;
			next();
		});
	});
});

//compare password
userSchema.methods.comparePassword = function(candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
		if (err) {
			return callback(err);
		}

		callback(null, isMatch);
	});
}

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
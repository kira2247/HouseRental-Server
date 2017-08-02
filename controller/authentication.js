const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../config')

function tokenForUser(user) {
	const timestamp = new Date().getTime();
	return jwt.sign({sub: user.id, iat:timestamp}, config.secret, {expiresIn:'1h'});
}

exports.signin = (req,res,next) => {
	//user has already had their email and password auth
	const token = tokenForUser(req.user);
	User.findOne({_id: req.user._id}, (err, user) => {		
		res.send({token, displayName: user.displayName, id: user._id});
	})	
}

exports.signup = (req,res,next) => {
	const {email,password,displayName} = req.body;
	
	User.findOne({email: email}, (err, existUser) => {
		if(err) {
			return next(err)
		}

		if(!email || !password) {
			return res.status(422).send({error: 'You must enter email and password'});
		}

		if(existUser) {
			return res.status(422).send({error: 'Email is in use'});
		}

		User.findOne({displayName}, (err, existDisplayName) => {
			if(err) {
				return next(err)
			}

			if(existDisplayName) {
				return res.status(422).send({error: 'Display Name is in use'});
			}

			const user = new User({
				email,
				password,
				displayName
			})

			user.save((err, result) => {
				if (err) {
					next(err)
				}

				return res.json({token: tokenForUser(user), displayName, id: result._id, message: 'Đăng Ký Thành Công!'})
			})
		})

		
	})
}
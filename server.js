// Node.js server file

// requires
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const BookingRoom = require(__dirname + '/models/booking_rooms');

// global variables
var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var rooms = JSON.parse(fs.readFileSync(__dirname + '/assets/rooms.json', 'utf8')).rooms;
if (rooms === undefined) {
	console.log("could not read rooms.json, exiting");
	process.exit(1);
}

// mongoose connection
mongoose.connect('mongodb://localhost/booking_rooms', { useNewUrlParser: true });
mongoose.connection.once('open', function(){
	BookingRoom.find(function(err, products) {
		if (err) throw err;

		for (var i = 0, c = rooms.length; i < c; i++) {
			var exists = false;
			for (var j = 0, d = products.length; j < d; j++) {
				if (rooms[i].name === products[j].name) {
					exists = true;
					break ;
				}
			}
			if (!exists) {
				var to_save = new BookingRoom({
					name: rooms[i].name,
					description: rooms[i].description,
					capacity: rooms[i].capacity,
					equipements: rooms[i].equipements,
					createdAt: rooms[i].createdAt,
					updatedAt: rooms[i].updatedAt,
				    bookings: []
				});
				to_save.save();
				console.log('saved');
			}
		}
	});
	console.log('Connection to MongoDB has been made.');
})
.on('error', function(error){
	console.log('Connection error: ', error);
	process.exit(1);
});


// app requests
app.use('/assets', express.static('assets'))
.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
})
.get('/rooms.json', function(req, res) {
	BookingRoom.find(function(err, products) {
		if (err) throw err;
		res.json({ 'rooms': products});
	});
})
.get('*', function(req, res) {
	res.status(404).sendFile(__dirname + '/404.html');
})
.post('/', urlencodedParser, function(req, res) {
	console.log(check_posted_data(req, res));
	res.redirect('/');
})
.listen(8080);


console.log('Server is up');


// checks if User sent wrong data, willingly or not
function check_posted_data(req, res) {

	console.log('Checking data...');

	var array = req.body.date.split('-');
	var year = array[0],
		month = array[1],
		day = array[2];
	array = req.body.min_hour.split(':');
	var min_hour_h = array[0],
		min_hour_m = array[1];
	array = req.body.max_hour.split(':');
	var max_hour_h = array[0],
		max_hour_m = array[1];
	var name = req.body.room_name;

	// checking if the start time is before the end time and after the current date
	var date_start = new Date(year, month, day, min_hour_h, min_hour_m, 0);
	var date_end = new Date(year, month, day, max_hour_h, max_hour_m, 0);
	var date_current = new Date();
	if (date_start >= date_end) return false;
	if (date_start <= date_current) return false;

	// checking if the minutes are a multiple of 15
	if (!(min_hour_m == 0 || min_hour_m == 15 || min_hour_m == 30 || min_hour_m == 45)) return false;
	if (!(max_hour_m == 0 || max_hour_m == 15 || max_hour_m == 30 || max_hour_m == 45)) return false;

	// checking if start and end times are between 8am and 8pm
	if (!(min_hour_h >= 8 && min_hour_h < 20)) return false;
	if (!(max_hour_h >= 8 && max_hour_h <= 20)) return false;

	// checking if the requested day is in less than a year
	date_current_plus_one_year = new Date();
	date_current_plus_one_year.setFullYear(date_current.getFullYear() + 1);
	if (date_end > date_current_plus_one_year) return false;

	// checking if the requested room has a valid name
	var flag = false;
	for (var i = 0, c = rooms.length; i < c; i++) {
		if (rooms[i].name === name) {
			flag = true;
			break ;
		}
	}
	if (!flag) return false;

	bookRoom(date_start, date_end, name);

	return true;
};

function bookRoom(date_start, date_end, name) {
	BookingRoom.findOne({name: name}, function(err, product) {
		if (err) throw err;
		var flag = true;
		for (var i = 0, c = product.bookings.length; i < c; i++) {
			var b_start = new Date(product.bookings[i].start),
				b_end = new Date(product.bookings[i].end);

			if (!((date_start < b_start && date_end <= b_start) ||
				(date_start >= b_end && date_end > b_end))) {
				flag = false;
				break ;
			}
		}
		if (flag) {
			var new_start = date_start.toISOString(),
				new_end = date_end.toISOString();

			var new_booking = {
				start: new_start,
				end: new_end
			};

			product.bookings.push(new_booking);
			product.save();
		}
	});
}
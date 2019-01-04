const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EquipSchema = new Schema({
	name: String
})

const TimeSchema = new Schema({
	start: String,
	end: String
})

const BookingRoomSchema = new Schema({
    name: String,
	description: String,
	capacity: Number,
	equipements: [EquipSchema],
	createdAt: String,
	updatedAt: String,
    bookings: [TimeSchema]
});

const BookingRoom = mongoose.model('booking_room', BookingRoomSchema);

module.exports = BookingRoom;
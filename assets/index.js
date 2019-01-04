// Vue.js file

var roomsVM = new Vue ({

	// Main VM which will display given rooms

	el: '#main_section',
	data: {
		rooms: []
	}
});

function confirmForm(button) {
	var name = button.value;
	var date = dateVM.date.split('-').reverse().join('/');
	return (confirm('Voulez-vous vraiment réserver "' + name + '" le ' + date + ' de ' + dateVM.min_hour + ' à ' + dateVM.max_hour + '?'))
}

var equipVM = new Vue({

	// Used to display rooms with specified equipements

	el: '#equipements_checkboxes',
	data: {
		equipements: []
	},
	methods: {
		handleChange: function(e) {

			var name = e.target.name;

			for (var i = 0, c = roomsVM.rooms.length; i < c; i++) {
				roomsVM.rooms[i].seen = true;
			}

			for (var i = 0, c = this.equipements.length; i < c; i++) {

				if (this.equipements[i].name === name) {
					this.equipements[i].checked = !this.equipements[i].checked;
				}

				if (this.equipements[i].checked) {				
					for (var j = 0, d = roomsVM.rooms.length; j < d; j++) {
						if (roomsVM.rooms[j].seen) {
							roomsVM.rooms[j].seen = false;
						} else continue ;

						for (var k = 0, e = roomsVM.rooms[j].equipements.length; k < e; k++) {
							if (roomsVM.rooms[j].equipements[k].name === this.equipements[i].name) {
								roomsVM.rooms[j].seen = true;
								break ;
							}
						}
					}
				}
			}

		}
	}
});

var sortVM = new Vue ({

	// Used to sort rooms

	el: '#sorting_form',
	methods : {
		handleChange: function(e) {

			var id = e.target.id;

			if (id === 'a_z') {
				roomsVM.rooms.sort(function (a, b) {
					var a_name = a.name.toLowerCase(), b_name = b.name.toLowerCase();
					if (a_name < b_name) return -1;
					else if (a_name === b_name) return 0;
					else return 1;
				})
			} else if (id === 'z_a') {
				roomsVM.rooms.sort(function (a, b) {
					var a_name = a.name.toLowerCase(), b_name = b.name.toLowerCase();
					if (a_name > b_name) return -1;
					else if (a_name === b_name) return 0;
					else return 1;
				})
			} else if (id === '0_9') {
				roomsVM.rooms.sort(function (a, b) {
					if (a.capacity < b.capacity) return -1;
					else if (a.capacity === b.capacity) return 0;
					else return 1;
				})
			} else if (id === '9_0') {
				roomsVM.rooms.sort(function (a, b) {
					if (a.capacity > b.capacity) return -1;
					else if (a.capacity === b.capacity) return 0;
					else return 1;
				})
			}
		}
	}
});

var dateVM = new Vue ({

	// Used to get current time and to adjust it to the next possible booking hour.

	el: '#date_and_time_form',
	data: {
		date: '',
		min_date: '',
		max_date: '',
		min_hour: '',
		max_hour: ''
	},
	methods: {
		handleChange: function(e) {
			if (e.target.id === 'date') this.date = e.target.value;
			else if (e.target.id === 'min_hour') this.min_hour = e.target.value;
			else if (e.target.id === 'max_hour') this.max_hour = e.target.value;
			checkIfBooked();
		}
	}
});

// Sets data values for dateVM
(function () {
	var date = new Date();
	var year = date.getFullYear(),
		month = date.getMonth(),
		day = date.getDate(),
		hours = date.getHours(),
		minutes = date.getMinutes();

	if (minutes < 15) minutes = 15;
	else if (minutes < 30) minutes = 30;
	else if (minutes < 45) minutes = 45;
	else {
		minutes = 0;
		hours++;
	}

	if (hours < 8) {
		hours = 8;
		minutes = 0;
	} else if (hours >= 20) {
		hours = 8;
		minutes = 0;
		day++;
	}

	date = new Date(year, month, day, hours, minutes);
	year = date.getFullYear(),
	month = date.getMonth() + 1,
	day = date.getDate(),
	hours = date.getHours(),
	minutes = date.getMinutes();

	dateVM.date = dateVM.min_date = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
	dateVM.max_date = (year + 1) + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
	dateVM.min_hour = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);

	if (minutes < 15) minutes = 15;
	else if (minutes < 30) minutes = 30;
	else if (minutes < 45) minutes = 45;
	else {
		minutes = 0;
		hours++;
	}
	dateVM.max_hour = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);
}());

function parseData(data) {

	// Parses data from rooms.json and fills equipVM with every given equipements.

	var obj = JSON.parse(data);
	roomsVM.rooms = obj.rooms;

	for (var i=0, c=obj.rooms.length; i < c; i++) {
		Vue.set(roomsVM.rooms[i], 'seen', true);
		Vue.set(roomsVM.rooms[i], 'booked', false);
		for (var j=0, d=obj.rooms[i].equipements.length; j < d; j++) {
			var flag = false;
			if (!equipVM.equipements.length) {
				equipVM.equipements.push(obj.rooms[i].equipements[j]);
				continue ;
			} else for (var k=0, e=equipVM.equipements.length; k < e; k++) {
				if (equipVM.equipements[k].name === obj.rooms[i].equipements[j].name) {
					flag = true;
					break ;
				}
			}

			if (!flag) {
				equipVM.equipements.push(obj.rooms[i].equipements[j]);
			}
		}
	}

	for (var i=0, c=equipVM.equipements.length; i < c; i++) {
		equipVM.equipements[i].checked = false;
	}

	checkIfBooked();
}

function requestRooms() {

	// Requests rooms.json then callback the parseData() function.

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && (xhr.status == 200)) {
			parseData(xhr.responseText);
		}
	};

	xhr.withCredentials = true;
	xhr.open("GET", "/rooms.json");
	xhr.send();
	
}

requestRooms();

function checkIfBooked() {
	var array = dateVM.date.split('-');
	var year = array[0],
		month = array[1],
		day = array[2];
	array = dateVM.min_hour.split(':');
	var min_hour_h = array[0],
		min_hour_m = array[1];
	array = dateVM.max_hour.split(':');
	var max_hour_h = array[0],
		max_hour_m = array[1];

	// checking if the start time is before the end time and after the current date
	var date_start = new Date(year, month, day, min_hour_h, min_hour_m, 0);
	var date_end = new Date(year, month, day, max_hour_h, max_hour_m, 0);
	if (date_start >= date_end) return ;

	console.log('checking bookings');
	console.log(roomsVM.rooms.length);
	for (var i = 0, c = roomsVM.rooms.length; i < c; i++) {
		var flag = false;
		for (var j = 0, d = roomsVM.rooms[i].bookings.length; j < d; j++) {
			var b_start = new Date(roomsVM.rooms[i].bookings[j].start),
				b_end = new Date(roomsVM.rooms[i].bookings[j].end);
			if (!((date_start < b_start && date_end <= b_start) ||
				(date_start >= b_end && date_end > b_end))) {
				flag = true;
				break ;
			}
		}
		roomsVM.rooms[i].booked = flag;
	}
}
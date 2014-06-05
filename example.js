var RestClient = require('./index.js');


var gitlab = new RestClient({
	api: 'https://gitlab.com/api/v3',
	beforeRequest: function(params) {
		params.data.private_token = 'e7zpqXbpAz6xkmnQgJpb';
	}
});

// gitlab.user
gitlab.register('/user', 'user');

// gitlab.users
var users = gitlab.register('/users/:id', 'users');
// gitlab.users.keys
users.register('/users/:uid/keys', 'keys');

gitlab.users.keys.read({
	uid: 1596
}, function(data, res) {
	console.log(data, res.statusCode);
});
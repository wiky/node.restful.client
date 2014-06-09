
Create a client.
Register your API.
Make requests.

var client = new Client({
	api: 'http://www.example.com/api/v3',
	token: ''
});

client.register('users');
// or 
// client.register('users/:id', 'alias');

// GET http://www.example.com/api/v3/users
client.users.get().done(funciton(){
	
});

client.$alias.xxxw

// GET http://www.example.com/api/v3/users/42
client.users.get(42);





client.foo.read();
// GET /rest/api/foo/
client.foo.read(42);
// GET /rest/api/foo/42/
client.foo.read('forty-two');
// GET /rest/api/foo/forty-two/
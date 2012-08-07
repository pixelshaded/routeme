#Routeme

Named routing with json validation, URL generation, and more. Meant to tag team with Express.

The power of routeme is that your routes get defined only once, but can be referenced elsewhere throughout your program by name. As long as the unique name doesn't change, you can make changes to the uri, method, action, or schema and those changes will be felt throughout your entire app, without having to change code elsewhere.

#Usage

###Instantiation
Create a new routeme instance. This will go through each file in the specified folder and gather information on your controllers. More on controller set up [later](#controller-setup).
<pre>
var Routeme = require('routeme');
var routeme = new Routeme('/path/to/controller/folder');
</pre>

A second parameter is optional and it should be a callback to call when the json validation middleware recieves errors. The middleware calls next() on success.
<pre>
var Routeme = require('routeme');
var routeme = new Routeme('/path/to/controller/folder', function(errors, req, res, next){
	res.json({ "errors" : errors }, 404);
});
</pre>

###Middleware Json Validation
Use this before the router so you can validate the incoming request before forwarding along the middleware chain. [Amanda](https://github.com/Baggz/Amanda) is used for validation. It has been tweaked to properly support ISO 8601 datetime validation and give back user friendly errors for email matching. If this get's fixed in the package I will add it as a dependency.
<pre>
app.use(routeme.validateSchema);
</pre>

###Bind to Express Router
This should be done after environment/middleware setup for most projects. It simply goes through all the routes it found in the controller folder, and based on their methods, calls app.VERB (this internally calls app.use in express, which is why it should be called after your middleware).
<pre>
routeme.bindToExpress(app);
</pre>

#Controller Setup
Your controllers should export 2 parameters, one is optional:
* routes: an array of route objects
* prefix: a string to prepend to all route URIs

Here is an example setup for a controller
<pre>
var schema = {};
schema['resendValidationEmail'] = schema['claimEmail'] = {
	type: 'object', properties: {
		email: { required: true, type: 'string', format: 'email' }
	}
};
schema['validateEmail'] = {
	type: 'object', properties: {
		email: { required: true, type: 'string', format: 'email' },
		validation_code: { required: true, type: 'string', length: 6 }
	}
};

exports.routes = [
{ 	
	uri: '/resend-validation-email', method: 'get',
	name: 'email.resendValidationEmail', action: resendValidationEmail,
	schema: schema.resendValidationEmail
},
{ 
	uri: '/claim-email', method: 'post', 
	name: 'email.claimEmail', action: claimEmail,
	schema: schema.claimEmail
},
{ 
	uri: '/validate-email',	method: 'post', 
	name: 'email.validateEmail', action: validateEmail,
	schema: schema.validateEmail
}
]

exports.prefix = '/email';

function resendValidationEmail(req, res, next){
	res.send('Resend Validation Email', 200);
}

function claimEmail(req, res, next){
	res.send('Claim Email', 200);
}

function validateEmail(req, res, next){
	res.send('Validate Email', 200);
}
</pre>

###Route Object
The route object has 5 properties, 1 of which is optional.
* uri: the URL to match
* method: post, get, delete, put, etc
* name: the unique name of the route. This is used to get the object from [routeme](foundRouteByName).
* action: the function to call when the URL is matched
* schema: OPTIONAL - the json schema to validate against when the URL is matched

Note that the schema is mainly used by the [validateSchema](#middleware-json-validation) middleware.

In the above example, because prefix is defined, /email/resend-validation-email would be matched but /resend-validation-email would not.

#Routeme API

###generateURL(routename, data)
<pre>
var url = routeme.generateURL('email.claimEmail', {email : 'myemail@mail.com'});
</pre>

Data is optional and used to create a querystring for get URLs. The above would return (based on example controller): 
<pre>
'/email/claim-email?email=myemail%40mail.com'
</pre>

###findRouteByName(name)
<pre>
var routeObj = routeme.findRouteByName('email.claimEmail');
</pre>

This is essentially the same as
<pre>
var routeObj = routeme.routes['email.claimEmail'];
</pre>

###findRouteByUri(uri, method)
<pre>
var routeObj = routeme.findRouteByUri('/email/claim-email', 'get');
</pre>

###bindToExpress(app)
Used after middleware setup (usually), this goes through all the routes on the instance of routeme and calls app.VERB.
<pre>
app = module.exports = express.createServer();
… middleware etc …
routeme.bindToExpress(app);
</pre>

###printRouteMap()
For debugging purposes, this will print a list of all the routes in the instance of routeme. Example:
<pre>
GET      /email/resend-validation-email     email.resendValidationEmail
POST     /email/claim-email                 email.claimEmail
POST     /email/validate-email              email.validateEmail
</pre>




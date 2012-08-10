var Routeme = require('../lib/routeme');
var colors = require('colors');

var routes = exports.routes = [
	{ uri: '/get-test', method: 'get', name: 'get-test', action: getTest},
	{ uri: '/param-test/:id/:name.html', method: 'get', name: 'param-test', action: getTest}
]

var prefix = exports.prefix = '/prefix';

function getTest(){
	return true;
}

var routeme = new Routeme();

exports.startTests = function(){
	
	routeme.scan(__dirname);

	routeme.printRouteMap();
	
	//Test Find Route By Name
	
	for(var i = 0; i < routes.length; i++){
		
		var route = routeme.findRouteByName(routes[i].name);
		
		if (routes[i] !== route){
			console.log('One of the routes found by name was not equal.'.red);
			console.dir(routes[i]);
			console.log('vs'.red);
			console.dir(route);
			process.exit(1);
		}
	}
	
	//Test Find Route By URI
	
	for(var i = 0; i < routes.length; i++){
		
		//note that the URI will have the prefix prepended since we called scan earlier
		//and routeme works off a reference to the route object rather than a new instance
		var route = routeme.findRouteByUri(routes[i].uri, routes[i].method);
		
		if (routes[i] !== route){
			console.log('One of the routes found by uri was not equal.'.red);
			console.log(routes[i]);
			console.log('vs'.red);
			console.dir(route);
			process.exit(1);
		}
	}
	
	//Test Params URL Generation
	
	var obj = {id: 1, name: 'test'};
	var url = routeme.generateURL('param-test', null, obj);
	var expected = '/prefix/param-test/1/test.html';
	
	if (expected !== url){
		console.log('Param Based URL Generation failed. Expected: %s, Got: %s'.red, expected, url);
		process.exit(1);
	}
	
	//Test Querystring URL Generation
	
	url = routeme.generateURL('get-test', obj);
	expected = '/prefix/get-test?id=1&name=test';
	
	if (expected !== url){
		console.log('Querystring Based URL Generation failed. Expected: %s, Got: %s'.red, expected, url);
		process.exit(1);
	}
	
	//Test BOTH!
	
	url = routeme.generateURL('param-test', obj, obj);
	expected = '/prefix/param-test/1/test.html?id=1&name=test';
	
	if (expected !== url){
		console.log('Querystring Based URL Generation failed. Expected: %s, Got: %s'.red, expected, url);
		process.exit(1);
	}
	
	//Test Route Matching for Validation
	
	url = routeme.findRouteByMatch('/prefix/param-test/1/test.html?id=1&name=test', 'get');
	if (!url){
		console.log('Cannot match param based URI...'.red);
		process.exit(1);
	}
	
	console.log('ALL TESTS PASSED'.green);
}
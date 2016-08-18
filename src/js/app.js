require("jquery");

require("./lib/icheck.js");

require('./lib/plugin.js');

var tether = require("tether");

require('./lib/bootstrap.js');


$(function(){

	$('.plusgin').greenify();

	console.log(tether);

})
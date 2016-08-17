var $ = require('jquery');
var tether = require('./lib/tether.js');
var icheck = require('imports?jQuery=jquery!./lib/icheck.js');

var plugin = require('imports?jQuery=jquery!./lib/plugin.js');
var bootstrap = require('imports?jQuery=jquery!./lib/bootstrap.js');


$(function(){
	$('.plusgin').greenify();

	console.log(plugin);
})
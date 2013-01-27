var http = require('http'),
	nconf = require('nconf')
	md5 = require('MD5'),
	async = require('async');

nconf.argv().env().file({
        file: 'config/config.json'
});

var secret = md5(nconf.get('secret'));
var host = nconf.get('host');
var lamps;
var context = this;

function connect(){
	http.get(
		{
			host: host,
			port: 80,
			path: '/api/' + secret + '/lights'
		},
		function(res){
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				var response = JSON.parse(chunk);
				//console.log(response);
				if(response[0] && response[0].error){
					console.log("Error: " + response[0].error.description);
					authenticate(function(){
						console.log("authenticated");
					});
				} else {
					console.log("reading list of lamps:")
					var i = 0;
					while(response[++i]){
						console.log(' ' + i + ' ' + response[i].name);
					}
					context.lamps = response;
					

					var lampstate = Object();
					lampstate.on = true;
					lampstate.hue = 12000;
					lampstate.sat = 255;
					lampstate.bt = 255;
					lampstate.transitiontime = 0;

					changeLampByState(6,lampstate,function(){
						console.log("lampstate changed");
					});

					var lampstate = Object();
					lampstate.on = true;
					lampstate.hue = 56000;
					lampstate.sat = 255;
					lampstate.bt = 255;
					lampstate.transitiontime = 0;

					changeLampByState(4,lampstate,function(){
						console.log("lampstate changed");
					});


					var lampstate = Object();
					lampstate.on = true;
					lampstate.hue = 43000;
					lampstate.sat = 255;
					lampstate.bt = 255;
					lampstate.transitiontime = 0;

					changeLampByState(5,lampstate,function(){
						console.log("lampstate changed");
					});


					//blink(6,255,null,1000);
					//blink(5,255,null,1000);
					var blinker1 = blink(6,255,null,200);
					var blinker2 = blink(4,255,null,300);
					var blinker3 = blink(5,255,null,350);

					setTimeout(function(){
						blinker1.stop();
						blinker2.stop();
						blinker3.stop();

						var lampstate = Object();
						lampstate.on = true;
						lampstate.ct = 200;
						lampstate.bt = 255;
						//lampstate.transitiontime = 0;


						setTimeout(function(){
							changeLampByState(4,lampstate,function(){
								console.log("lampstate reset");
							});

							changeLampByState(5,lampstate,function(){
								console.log("lampstate reset");
							});
							changeLampByState(6,lampstate,function(){
								console.log("lampstate reset");
							});
						},1000);
						

					},1000);
					
				}
			});
	});
}

function menu(callback){

}

function blink(numberOfLamp,brightness,colortemp,time){
	var blinker = Object();
	var lampOff;
	blinker.lampOn = setInterval(function(){
		changeLamp(numberOfLamp,brightness,colortemp,true,function(){});
	},time);
	setTimeout(function(){
		blinker.lampOff = setInterval(function(){
			changeLamp(numberOfLamp,brightness,colortemp,false,function(){});
		},time);
	},time/2); 	

	blinker.stop = function(){
		clearInterval(this.lampOff);
		clearInterval(this.lampOn);
	};
	return blinker;
}

function changeLampByState(numberOfLamp,lampstate, callback){

	if(!lampstate.transitiontime)
		lampstate.transitiontime = 0;
	var that = this;
	var req = http.request({
		host: host,
		port: 80,
		path: '/api/' + secret + '/lights/' + numberOfLamp + '/state',
		method: 'PUT'
	},function (res){
		res.setEncoding('utf8');
//		console.log("response received");
		res.on('data', function (chunk) {

			var response = JSON.parse(chunk);
			//console.log(chunk);
			if(response.error){
				console.log("Error: " + response.error.description);
				
			} else {
		//		var i = 0;
		//		while(response[++i]){
		//			console.log(' ' + i + ' ' + JSON.stringify(response[i]));
		//		}
				
				callback();
			}
		});
	});

	req.on('error',function(e){
			console.log("authentication error: " + e);
	});

	//console.log("try to authenticate")
	//req.write(JSON.stringify(post));
	var lampstate = JSON.stringify(lampstate);
	console.log("change lamp "+ numberOfLamp+": send " +lampstate);
	req.write(lampstate);
	req.end();

}

function changeLamp(numberOfLamp,brightness,colortemp,on,callback){

	var lampstate = Object();
	if(brightness)
		lampstate.bri = brightness;
	if(colortemp)
		lampstate.ct = colortemp;
	lampstate.on = on;
	//lampstate.transitiontime = 0;

	changeLampByState(numberOfLamp,lampstate, callback);
}

function authenticate(callback){
	var that = this;
	var post = Object();
	post.username = secret;
	post.devicetype = "node";

	var req = http.request({
		host: host,
		port: 80,
		path: '/api',
		method: 'POST'
	},function (res){
		res.setEncoding('utf8');
		console.log("response received");
		res.on('data', function (chunk) {

			var response = JSON.parse(chunk)[0];
			console.log(chunk);
			if(response.error){
				console.log("Error: " + response.error.description);
				authenticate(callback);
			} else{
				callback();
			}
		});
	});

	req.on('error',function(e){
			console.log("authentication error: " + e);
	});

	console.log("try to authenticate")
	req.write(JSON.stringify(post));
	req.end();
}


connect();

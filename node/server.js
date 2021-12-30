var options = require('./config.js').options,
WebSocketServer = require('ws').Server;
var log = function() {};
if (options.displayLogs == true) {
	log = function() {
		console.log.apply(console, arguments);
	}
}
log('设置:');
log(options);

var ws = new WebSocketServer({
	port: options.port || 3309,
	verifyClient: socketverify
});
log("在端口" + (options.port || 3309) + "创建了服务器");

var videolist = [];

ws.on('connection',
function(socket) {
	log("一个新连接请求");
	socket.vid = null;
	socket.onmessage = action;
	socket.onclose = socolse;
	socket.broadcast = broadcast_in_videolist;
});
function action(data) {
	try{
		var msg = JSON.parse(data.data);
	}catch(e){
		log(e,data.data);
		return;
	}
	if (msg) {
		switch (msg.type) {
		case "vid":
			{
				if (typeof msg.data == "number") {
					this.vid = msg.data;
					if (!videolist[this.vid]) videolist[this.vid] = [];
					videolist[this.vid].push(this);
					log("VIDEO:" + this.vid + "	online:" + videolist[this.vid].length);
					this.broadcast("ol", videolist[this.vid].length, true);
				}
				break;
			}
		case "dm":
			{
				if(typeof this.vid!= "number"){
					this.close();
					log("一个连接由于未指定视频id就发送弹幕而被断开连接");
					return;
				}
				if(typeof this.timeout=="number")return;
				if (typeof msg.data == "object"&& msg.data.c) {
					if (videolist[this.vid] && msg.data.c.length <= 1000) {
						log("DANMU:" + this.vid + "	" + msg.data.c);
						this.broadcast("dm", msg.data);
						this.timeout=setTimeout(function(){
							delete this.timeout;
						},3000);
					}
				}
				break;
			}
		}
	}

}
function socolse() {
	//log("连接断开");
	if (typeof this.vid == "number" && videolist[this.vid]) {
		var i = videolist[this.vid].indexOf(this);
		if (typeof i == "number") {
			videolist[this.vid].splice(i, 1);
			log("VIDEO:" + this.vid + "	online:" + videolist[this.vid].length);
			this.broadcast("ol", videolist[this.vid].length, true);
			if (videolist[this.vid].length === 0) {
				delete videolist[this.vid];
				log("销毁列表:" + this.vid);
			}
		}
	}
}
function broadcast_in_videolist(type, msg, includeself) {
	if (typeof this.vid == "number" && videolist[this.vid]) {
		var ind, msg = _(type, msg),l=videolist[this.vid],
		si = l.indexOf(this);
		for (ind=l.length;ind--;) {
			if (includeself || ind != si){
				l[ind].send(msg,ignoreerr);
			}
		}
	}
}
function socketverify(info) { //提取origin里的域名或ip和设置的来源对比
	if (options.origin && info.origin.replace(/^(.+\:\/\/)?(.+?)(\:\d+)?$/, "$2") == options.origin) {
		return true;
	}
	return true;
}

function ignoreerr(e){
	if(e!=undefined)
	log(e);
}
function _(type, data) {
	return JSON.stringify({
		type: type,
		data: data
	});
}
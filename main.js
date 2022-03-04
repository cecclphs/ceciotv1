#! /usr/bin/node
//required
var fs = require("fs");
let freevar = {};
let noInternet = true;
var statecontent = JSON.parse(fs.readFileSync("/home/pi/ceciot/last_state.json") || "{}");
var isReadingNewCard = false;
var credentialjson;
var valeurMirroir=0;
fs.readFile('/home/pi/ceciot/credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  credentialjson = JSON.parse(content);
});


//============== MomentJS
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Kuala_Lumpur");
console.log('Starting CEC IoT system on '+moment().format('MMMM Do YYYY, h:mm:ss a'));
//============== On Offf
const Gpio = require('onoff').Gpio,
  relay   = new Gpio(4, 'out'),
  shift_clock   = new Gpio(19, 'out'),
  shift_data    = new Gpio(13, 'out'),
  shift_latch   = new Gpio(6, 'out'),
  shift_output  = new Gpio(26, 'out'),
  but1  = new Gpio(27, 'in', 'rising', {debounceTimeout: 10}),
  but2  = new Gpio(17, 'in', 'rising', {debounceTimeout: 10}),
  but3  = new Gpio(22, 'in', 'rising', {debounceTimeout: 10}),
  but4  = new Gpio(23, 'in', 'rising', {debounceTimeout: 10}),
  but5  = new Gpio(24, 'in', 'rising', {debounceTimeout: 10}),
  but6  = new Gpio(25, 'in', 'rising', {debounceTimeout: 10}),
  but7  = new Gpio(5 , 'in', 'rising', {debounceTimeout: 10}),
  but8  = new Gpio(12, 'in', 'rising', {debounceTimeout: 10}),
  but9  = new Gpio(16, 'in', 'rising', {debounceTimeout: 10}),
  but10  = new Gpio(20, 'in', 'rising', {debounceTimeout: 10}),
  doorUnlock= new Gpio(11, 'in', 'rising', {debounceTimeout: 10}),
  buzzer  = new Gpio(21, 'out')

var switchState = statecontent.switchState;
shift_output.writeSync(1);
for(i = 0;i < 8;i++){
  getValueForLights(i,switchState[i]);
}

relay.writeSync(1);

doorUnlock.watch((err,value)=>{
  if (err) throw err;
  unlockDoor('ExitButton');
  createAccessRecord('#','Exit Button',moment().valueOf());
});

but1.watch((err, value) => {
  if (err) throw err;
  hwChangeRelay(0,false);
  hwChangeRelay(1,false);
  hwChangeRelay(2,false);
  hwChangeRelay(3,false);
  hwChangeRelay(4,false);
  hwChangeRelay(5,false);
  hwChangeRelay(6,false);
  hwChangeRelay(7,false);
});

but2.watch((err, value) => {
  if (err) throw err;
  hwChangeRelay(0,true);
  hwChangeRelay(1,true);
  hwChangeRelay(2,true);
  hwChangeRelay(3,true);
  hwChangeRelay(4,true);
  hwChangeRelay(5,true);
  hwChangeRelay(6,true);
  hwChangeRelay(7,true);
});
but4.watch((err, value) => {
  if (err) throw err;
  flipRelay(5);
});
but3.watch((err, value) => {
  if (err) throw err;
  flipRelay(6);
});
but5.watch((err, value) => {
  if (err) throw err;
  flipRelay(7);
});
but6.watch((err, value) =>   {
  if (err) throw err;
  flipRelay(0);
});
but7.watch((err, value) => {
  if (err) throw err;
  flipRelay(1);
});
but8.watch((err, value) => {
  if (err) throw err;
  flipRelay(2);
});
but9.watch((err, value) => {
  if (err) throw err;
  flipRelay(3);
});
but10.watch((err, value) => {
  if (err) throw err;
  flipRelay(4);
});
//0 -

function hwChangeRelay(relay,state){
  if(!noInternet)freevar.sinricChange(relay,state);
  else setRelay(relay,state);
}

firebasefilterbecauseitannoysme = false;

function unlockDoor(style){
  if((style != 'FIREBASE')){
    clearTimeout(currentTimeout);
    relay.writeSync(0);
    buzzer.writeSync(1);
    currentTimeout = setTimeout(function(){
      relay.writeSync(1);
      oledDefault();
      buzzer.writeSync(0);
    },3000);
  } else if((currentClearanceLevel == -10) && (style == 'FIREBASE') && firebasefilterbecauseitannoysme){
    createAccessRecord('#','Firebase (Open)',moment().valueOf());
    relay.writeSync(0);
  } else if((currentClearanceLevel != -10) && (style == 'FIREBASE') && firebasefilterbecauseitannoysme){
    createAccessRecord('#','Firebase (Close)',moment().valueOf());
    relay.writeSync(1);
  } else if((style == 'FIREBASE')&& !firebasefilterbecauseitannoysme){
    firebasefilterbecauseitannoysme = true;
  }
}

function flipRelay(num){
  switchState[num] = !switchState[num];
  hwChangeRelay(num,switchState[num]);
}

function norelaysetBit(bitIndex) {
  valeurMirroir = valeurMirroir | (1 << bitIndex);
}

function norelayclrBit(bitIndex) {
  valeurMirroir = valeurMirroir & ~(1 << bitIndex);
}
function getValueForLights(num,state){
  if(!state) norelayclrBit(num);
  else norelaysetBit(num);
}
function setRelay(num,state){
  switchState[num] = state;
  if(!state) clrBit(num);
  else setBit(num);
}
var grassEater;
function setOutput(value) {
  valeurMirroir=value;
  clearTimeout(grassEater);
  grassEater = setTimeout(function(){
    for( var i = 0 ; i < 8 ; i++) {
      // Set shift_data bit
      if((value & 0x80) == 0x80)
          shift_data.writeSync(1);
      else
          shift_data.writeSync(0);
      // shift_clock data
      shift_clock.writeSync(0);
      shift_clock.writeSync(1);
      value = value << 1;
      shift_output.writeSync(1);
    }
    // shift_latch data
    shift_latch.writeSync(1);
    shift_latch.writeSync(0);
    statecontent.switchState = switchState;
    fs.writeFileSync("/home/pi/ceciot/last_state.json",JSON.stringify(statecontent));
    clearTimeout(grassEater);
  },10);
}

function setBit(bitIndex) {
  setOutput(valeurMirroir | (1 << bitIndex));
}

function clrBit(bitIndex) {
  setOutput(valeurMirroir & ~(1 << bitIndex));
}
//============== oledDefault
var font = require('oled-font-5x7');
var i2c = require('i2c-bus'),
  i2cBus = i2c.openSync(1),
  oled = require('oled-i2c-bus');

var opts = {
  width: 128,
  height: 64,
  address: 0x3C
};
var oled = new oled(i2cBus, opts);
oled.turnOnDisplay();
oled.clearDisplay();
oled.setCursor(0, 0);
oled.writeString(font, 1, 'Creative Electronics Club Room IoT System. By Chew Tzi Hwee 2019', 1, true);
setTimeout(oledDefault,60000);

var oledTimeout;
function oledDefault(){
  oledOnDisplay();
  oled.clearDisplay();
  oled.setCursor(0, 0);
  oled.writeString(font, 1, 'Creative Electronics Club',1,true);
  oled.setCursor(0, 20);
  oled.writeString(font, 2, 'IDLE',1,true);
  oled.setCursor(0, 40);
  if(noInternet)oled.writeString(font, 1, 'no internet.',1,true)
}
function oledOnDisplay(){
  oled.turnOnDisplay();
  clearTimeout(oledTimeout);
  oledTimeout = setTimeout(function(){
    oled.turnOffDisplay();
  },300000);
}
//============= csv
var lastname = '';
var lastnamecleartimeout;

function createAccessRecord(id,name,date){
  if(name != lastname){
    let wrstream = fs.createWriteStream('/home/pi/ceciot/access.csv', {flags: 'a'})
    wrstream.write(id +','+name+','+date+'\r\n')
    wrstream.end()
    wss.broadcast(JSON.stringify({action:'accessUpdate',id:id,name:name,date:date}));
	if(freevar.uploadAccessRecord) freevar.uploadAccessRecord({id:id,name:name,date:date});
  }
  lastname = name;
  clearTimeout(lastnamecleartimeout);
  lastnamecleartimeout = setTimeout(function(){lastname = ''},3000);
}


//============== Serial Port
var content = fs.readFileSync("/home/pi/ceciot/firebase-backup.json");
var newCardOwner, newCardClearance;
let studentCards = JSON.parse(content);
let card_amount = Object.keys(studentCards).length;;
let doorState = false;
console.log('Firebase data retrieved with '+ card_amount + ' cards locally');

const SerialPort = require('serialport')
const port = new SerialPort('/dev/serial0',{
  baudRate:9600
})
var currentTimeout;
var currentClearanceLevel = 9;
var checkcalender = setTimeout(function(){},1);
var readdata = [];


port.on('readable', function () {
  let data = port.read();
  for(i = 0;i < data.length; i++){
    readdata[0] = readdata[1];
    readdata[1] = readdata[2];
    readdata[2] = readdata[3];
    readdata[3] = readdata[4];
    readdata[4] = readdata[5];
    readdata[5] = readdata[6];
    readdata[6] = readdata[7];
    readdata[7] = readdata[8];
    readdata[8] = readdata[9];
    readdata[9] = readdata[10];
    readdata[10] = readdata[11];
    readdata[11] = readdata[12];
    readdata[12] = readdata[13];
    readdata[13] = data[i];
  }
  if((readdata[0] == 2)&& (readdata[13] == 3)){
    var suckla = 0;
    for(x= 0;x< 12;x++){
      if(readdata[x] == 48){
        suckla++;
      }
    }
    if(suckla < 8){
      readdata.splice(0,1);
      readdata.splice(12,1);
      var cardString = String.fromCharCode(readdata[2],readdata[3],readdata[4],readdata[5],readdata[6],readdata[7],readdata[8],readdata[9])
      readCardNo = parseInt(cardString,16);
      if(isReadingNewCard){
        newCard = {
          readCardNo:{
            displayName:newCardOwner,
            active:true
          }
        }
        freevar.uploadNewCard(newCard);
        isReadingNewCard = false;
        return;
      }
      var successauth = false;
      if(((studentCards[readCardNo]||{}).active)){
        var card = studentCards[readCardNo]
        successauth = true;
        oledOnDisplay();
        if(card.displayName != null){
          console.log('CARD BELONGS TO ' + card.displayName);
          oled.clearDisplay();
          oled.setCursor(1, 1);
          oled.writeString(font, 1, 'Card Owner: ',1,false);
          oled.setCursor(1,15);
          oled.writeString(font, 1, card.displayName,1,false);
        }
        else {
          oled.clearDisplay();
          oled.setCursor(1, 1);
          oled.writeString(font, 2, 'PLS ADD NAME',1,true);
          console.log('CARD BELONGS TO #' + a);
          console.log('Please immediately change your cardOwner name and clearance.');
        }
        console.log('DOOR OPENED.')
        oled.setCursor(1, 49);
        oled.writeString(font, 1, 'ACCESS GRANTED',1,true);
        unlockDoor('ACCESS');
        createAccessRecord(readCardNo,card.displayName,moment().valueOf())
      }
      if(!successauth) {
        oledOnDisplay();
        console.log('UNRECOGNISED CARD')
        oled.clearDisplay();
        oled.setCursor(1, 1);
        oled.writeString(font, 2, 'NI DATABASE ',1,false);
        setTimeout(oledDefault,3000);
      }
    }
  }
})

//ble
// const Noble = require("noble");
// const BeaconScanner = require("node-beacon-scanner");
//
// var scanner = new BeaconScanner();
//
// scanner.onadvertisement = (advertisement) => {
//     var beacon = advertisement["iBeacon"];
//     beacon.rssi = advertisement["rssi"];
//     console.log(JSON.stringify(beacon, null, "    "))
// };
//
// scanner.startScan().then(() => {
//     console.log("Scanning for BLE devices...")  ;
// }).catch((error) => {
//     console.error(error);
// });


//============== systeminformation
const si = require('systeminformation');
//============== Express
var express = require('express')
var app = express()
const path = require('path');

app.get('/ping', function(req, res){
  res.send('pong '+moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'))
  console.log('pong '+moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'))
});



app.get('/myIP',function(req,res){
  let ip = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '') || req.connection.remoteAddress;
  res.send(ip);
});

// app.get('/', function(req, res){
//   res.sendFile(path.join(__dirname+'/dashboard/index.html'))
//   let ip = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '') || req.connection.remoteAddress
//   console.log("Opening web console for "+ip);
// });

// app.use(express.static(__dirname + '/dashboard'));

app.get('/',(req,res)=>{res.sendFile(__dirname+'/public/index.html')})
app.get('/home',(req,res)=>{res.sendFile(__dirname+'/public/index.html')})
app.get('/controls',(req,res)=>{res.sendFile(__dirname+'/public/index.html')})
app.use(express.static(__dirname+'/public'));


app.get('/pingSinric', function(req, res){
  ws.ping(function(){});
  ws.on('pong', function(){
    res.send('recieved pong from server')
  });
});

app.get('/pingGoogle', function(req, res){
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       res.send('No connection on ' + moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
       console.log('No connection on ' + moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
    } else {
      res.send('Ping Google Success on '+moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
      console.log('Ping Google Success on '+moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
    }
  });
});

app.get('/turnOnDisplay',function(req,res){
  res.send('OK')
  oled.turnOnDisplay();
  oledDefault();
});

app.get('/crash',function(req,res){
  res.send('UNAUTHOURISED ACCESS')
  process.exit()
})
var bodyParser = require('body-parser')
app.use(express.json());

app.post('/acceptnewcard',function(req,res){
  isReadingNewCard = true;
  newCardOwner = req.body.cardOwner;
  newCardClearance = req.body.clearance;
  res.send({"sucess":true});
})

app.post('/unlockDoor', function(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.send({"sucess":true});
  unlockDoor('FINGERPRINT');
  let ip = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '') || req.connection.remoteAddress
  console.log('/unlockDoor ==> Opened Door '+ip)
  createAccessRecord('#',`${ip}`,moment().valueOf());
});

app.get('/unlockDoorUsingGET', function(req, res){
  res.send({"sucess":true});
  unlockDoor('MOBILEHIGHSPEED');
  let ip = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '') || req.connection.remoteAddress
  console.log('/unlockDoorUsingGET ==> Opened Door '+ip)
  createAccessRecord('#',`${ip}`,moment().valueOf());
});

app.post('/changeSwitchState', function(req, res){
  flipRelay(req.body.relay);
  let ip = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '') || req.connection.remoteAddress
  console.log('web trigger => relay '+req.body.relay+ 'flipRelay ' + ip);
  res.send({"sucess":true});
});

app.post('/allSwitch', function(req, res){
  currentLights = switchState[0] || switchState[1] || switchState[2] || switchState[4] || switchState[5]
  currentFans = switchState[3] || switchState[7] || switchState[6]
  currentAll = currentLights || currentFans
  switch(req.body.mode){
    case 0:
      hwChangeRelay(0,!currentLights)
      hwChangeRelay(1,!currentLights)
      hwChangeRelay(2,!currentLights)
      hwChangeRelay(4,!currentLights)
      hwChangeRelay(5,!currentLights)
    break;
    case 1:
      hwChangeRelay(3,!currentFans)
      hwChangeRelay(6,!currentFans)
      hwChangeRelay(7,!currentFans)
    break;
    case 2:
      hwChangeRelay(0,!currentAll)
      hwChangeRelay(1,!currentAll)
      hwChangeRelay(2,!currentAll)
      hwChangeRelay(3,!currentAll)
      hwChangeRelay(4,!currentAll)
      hwChangeRelay(5,!currentAll)
      hwChangeRelay(6,!currentAll)
      hwChangeRelay(7,!currentAll)
    break;
  }
  let ip = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '') || req.connection.remoteAddress
  console.log('web trigger => allswitch '+req.body.mode+ 'hwChangeRelay ' + ip);
  res.send({"sucess":true});
});


app.get('/log',function(req,res){
  res.send(fs.readFileSync("/home/pi/ceciot/NodeJSLog.log"))
})

app.get('/accesslog',function(req,res){
  res.send(fs.readFileSync("/home/pi/ceciot/access.csv"))
})

app.get('/getusers',function(req,res){
  res.send(fs.readFileSync("/home/pi/ceciot/firebase-backup.json"))
})
let cistate = false
app.get('/toggleCI',function(req,res){
  cistate = !cistate
  wss.broadcast(JSON.stringify({action:"setDevice_CI",state:cistate}));
  res.send("OK")
})

app.get('/cpu', function(req, res){
  var cpu,cpuFlags,cpuCache,cpuCurrentSpeed,cpuTemperature;
  si.cpu(function(data) {cpu = data;})
  si.cpuFlags(function(data) {cpuFlags = data;})
  si.cpuCache(function(data) {cpuCache = data;})
  si.cpuCurrentspeed(function(data) {cpuCurrentSpeed = data;})
  si.cpuTemperature(function(data) {
    cpuTemperature = data;
    var dadada = {
      "cpu":cpu,
      "cpuFlags":cpuFlags,
      "cpuCache":cpuCache,
      "cpuCurrentSpeed":cpuCurrentSpeed,
      "cpuTemperature":cpuTemperature
    }
    res.send(dadada);
  })
});
app.get('/mem', function(req, res){
  var mem,memLayout;
  si.mem(function(data) {mem = data;})
  si.memLayout(function(data) {
    memLayout = data;
    let dadada = {
      "mem": mem,
      "memLayout":memLayout
    }
    res.send(dadada);
  })
});
app.get('/currentLoad', function(req, res){
  var currentLoad,fullLoad,processes;
  si.currentLoad(function(data) {currentLoad = data;})
  si.fullLoad(function(data) {fullLoad = data;})
  si.processes(function(data) {
    processes = data;
    let dadada = {
      "currentLoad":currentLoad,
      "fullLoad":fullLoad,
      "processes":processes
    }
    res.send(dadada);
  })
});
app.get('/all', function(req, res){
  var currentLoad,fullLoad,processes,mem,memLayout,cpu,cpuFlags,cpuCache,cpuCurrentSpeed,cpuTemperature;
  si.cpu(function(data) {cpu = data;})
  si.cpuFlags(function(data) {cpuFlags = data;})
  si.cpuCache(function(data) {cpuCache = data;})
  si.cpuCurrentspeed(function(data) {cpuCurrentSpeed = data;})
  si.cpuTemperature(function(data) {cpuTemperature = data;})
  si.mem(function(data) {mem = data;})
  si.memLayout(function(data) {memLayout = data;})
  si.currentLoad(function(data) {currentLoad = data;})
  si.fullLoad(function(data) {fullLoad = data;})
  si.processes(function(data) {
    processes = data;
    let dadada = {
      "cpu":cpu,
      "cpuFlags":cpuFlags,
      "cpuCache":cpuCache,
      "cpuCurrentSpeed":cpuCurrentSpeed,
      "cpuTemperature":cpuTemperature,
      "mem": mem,
      "memLayout":memLayout,
      "currentLoad":currentLoad,
      "fullLoad":fullLoad,
      "processes":processes
    }
    res.send(dadada);
  })
});

const https = require('https')
const http = require('http')


http.createServer(app).listen(3000);
const httpsserver = https.createServer({
  key: fs.readFileSync(__dirname+'/server.key'),
  cert: fs.readFileSync(__dirname+'/server.cert')
}, app).listen(8000);

var internetResolverTimer = setInterval(checkConnection,1000);
function checkConnection(){
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       console.log('No connection on ' + moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
       noInternet = true;
    } else {
      console.log('Ping Google Success on '+moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
      clearInterval(internetResolverTimer);
      InternetDependentServices();
    }
  });
}
const WebSocket = require('ws')
const wss = new WebSocket.Server({port:8080 });

wss.on('connection', function connection(ws, req) {
  const ip = req.connection.remoteAddress;
  console.log(ip + ' connected to WebSocket');
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    message = JSON.parse(message)
    switch(message.action){
      case 'openDoor':
        if(message.value == '5_SEC_OPEN')unlockDoor('FINGERPRINT');
        createAccessRecord('#',`${ip}`,moment().valueOf());
      break;
      case 'addCard':
        newCardOwner = message.value.cardOwner;
        newCardClearance = message.value.clearance;
        isReadingNewCard = true;
      break;
      case 'toggleSwitch':
        flipRelay(message.value)
        wss.broadcast(JSON.stringify({content:"switchState",value:switchState}));
      break;
      case 'requestState':
        wss.broadcast(JSON.stringify({content:"switchState",value:switchState}));
      break;
      case 'toggleMultiSwitches':
        currentLights = switchState[0] || switchState[1] || switchState[2] || switchState[4] || switchState[5]
        currentFans = switchState[3] || switchState[7] || switchState[6]
        currentAll = currentLights || currentFans
        switch(message.value){
          case 0:
            hwChangeRelay(0,!currentLights)
            hwChangeRelay(1,!currentLights)
            hwChangeRelay(2,!currentLights)
            hwChangeRelay(4,!currentLights)
            hwChangeRelay(5,!currentLights)
          break;
          case 1:
            hwChangeRelay(3,!currentFans)
            hwChangeRelay(6,!currentFans)
            hwChangeRelay(7,!currentFans)
          break;
          case 2:
            hwChangeRelay(0,!currentAll)
            hwChangeRelay(1,!currentAll)
            hwChangeRelay(2,!currentAll)
            hwChangeRelay(3,!currentAll)
            hwChangeRelay(4,!currentAll)
            hwChangeRelay(5,!currentAll)
            hwChangeRelay(6,!currentAll)
            hwChangeRelay(7,!currentAll)
          break;
        }
        wss.broadcast(JSON.stringify({content:"switchState",value:switchState}));
      break;
    }
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

function InternetDependentServices(){
console.log('Starting Internet Dependent Services');
//============== Websocket
const deviceIds = [
  "5c570793ee922126155bc0b4",
  "5c57071eee922126155bc0a4",
  "5c57075dee922126155bc0aa",
  "5c57076fee922126155bc0ac",
  "5c570749ee922126155bc0a8",
  "5c570741ee922126155bc0a6",
  "5c570789ee922126155bc0b0",
  "5c57077bee922126155bc0ae"
]
const token = '88db6c83-ab09-4af4-a1ec-b98148df0555'

function WebSocketClient(){
	this.number = 0;	// Message number
	this.autoReconnectInterval = 5000;	// ms
}

WebSocketClient.prototype.open = function(url){
	this.url = url;
	this.instance = new WebSocket(this.url,{headers: {'Authorization': Buffer.from('apikey:88db6c83-ab09-4af4-a1ec-b98148df0555').toString('base64')}});
	this.instance.on('open',()=>{
		this.onopen();
	});
	this.instance.on('message',(data,flags)=>{
		this.number ++;
		this.onmessage(data,flags,this.number);
	});
	this.instance.on('close',(e)=>{
		switch (e.code){
		case 1000:	// CLOSE_NORMAL
			console.log("WebSocket: closed");
			break;
		default:	// Abnormal closure
			this.reconnect(e);
			break;
		}
		this.onclose(e);
	});
	this.instance.on('error',(e)=>{
		switch (e.code){
		case 'ECONNREFUSED':
			this.reconnect(e);
			break;
		default:
			this.onerror(e);
			break;
		}
	});
}
WebSocketClient.prototype.send = function(data,option){
	try{
		this.instance.send(data,option);
	}catch (e){
		this.instance.emit('error',e);
	}
}
WebSocketClient.prototype.reconnect = function(e){
	console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
        this.instance.removeAllListeners();
	var that = this;
	setTimeout(function(){
		console.log("WebSocketClient: reconnecting...");
		that.open(that.url);
	},this.autoReconnectInterval);
}
WebSocketClient.prototype.onopen = function(e){	console.log("WebSocketClient: open",arguments);	}
WebSocketClient.prototype.onmessage = function(data,flags,number){	console.log("WebSocketClient: message",arguments);	}
WebSocketClient.prototype.onerror = function(e){	console.log("WebSocketClient: error",arguments);	}
WebSocketClient.prototype.onclose = function(e){	console.log("WebSocketClient: closed",arguments);	}



var wsc = new WebSocketClient();
wsc.open('ws://iot.sinric.com');
wsc.onopen = function(e){
  console.log('Connected. IoT System is Armed')
}
wsc.onmessage = function(data,flags,number){
  var jsonData = JSON.parse(data)
  if(jsonData.action == "action.devices.commands.OnOff"){
   let switchno = 88;
   for(i = 0;i < 8;i++){
     if(jsonData.deviceId == deviceIds[i]){
       switchno = i;
     }
   }
   if(switchno != 88){
     console.log(switchno + JSON.stringify(jsonData.value.on));
     setRelay(switchno,jsonData.value.on);
   }
  }
  else if(jsonData.action == "setPowerState"){
   let switchno = 88;
   for(i = 0;i < 8;i++){
     if(jsonData.deviceId == deviceIds[i]){
       switchno = i;
     }
   }
   if(switchno != 88){
     console.log(switchno + JSON.stringify(jsonData.value));
     setRelay(switchno,ONtoBool(jsonData.value));
   }
  }
}

wsc.onerror = function(e){
  console.log('Error Found '+e);
}

wsc.onclose = function(e){
	console.log('Disconnected from IoT System because '+e);
}

freevar.sinricChange = function(devID,state){
  setRelay(devID,state);
  let chao = JSON.stringify({deviceId:deviceIds[devID],action:'action.devices.commands.OnOff',value:{on:state}});
  wsc.send(chao);
}

//============== Request
const request = require('request');

var disconnectedTimer = 0;

let internetCheckingInterval = setInterval(function(){
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
       console.log("No connection on " + moment().tz("Asia/Kuala_Lumpur").format('MMMM Do YYYY, h:mm:ss a'));
       disconnectedTimer++;
       if(disconnectedTimer > 2){
         noInternet = true;
       }
    } else {
      disconnectedTimer=0;
      noInternet = false;
    }
  });
},60000);
// //============== Firebase


// var admin = require("firebase-admin");
//
// var serviceAccount = require("/home/pi/ceciot/cecdbfirebase-credentials.json");
//
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://cecdbfirebase.firebaseio.com"
// });
//
// var database = admin.database;
var firebase = require("firebase")
var firebaseConfig = {
    apiKey: "AIzaSyCpWeoGzDrwoJjnsjBnDu-vVUt6LfGHyxk",
    authDomain: "cecdbfirebase.firebaseapp.com",
    databaseURL: "https://cecdbfirebase.firebaseio.com",
    projectId: "cecdbfirebase",
    storageBucket: "cecdbfirebase.appspot.com",
    messagingSenderId: "497574235952",
    appId: "1:497574235952:web:6e65e1133d987e21e802f5"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
firebase.auth().signInWithEmailAndPassword("dooraccess@gmail.com", "12345678")
  .catch(function(error) {
    console.log(error)
  });
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    database.ref('/cards').on('value',snapshot=> {
      let tempStudentCards = snapshot.val();
      let currentCardAmount = Object.keys(tempStudentCards).length;
      console.log('Firebase data retrieved with '+ currentCardAmount + ' cards online');
      if((currentCardAmount !=null) && (currentCardAmount > 0)){
        card_amount = currentCardAmount;
        studentCards = tempStudentCards;
        unlockDoor('FIREBASE');
        fs.writeFileSync("/home/pi/ceciot/firebase-backup.json",JSON.stringify(studentCards));
      }else{
        console.log('CARDS NOT ACCEPTED.');
      }
    }).catch(e=>{
		console.error(e)
	});
    freevar.uploadNewCard = function (parsedArray){
      console.log('uploading card of '+ parsedArray.displayName);
      database.ref('/cards/'+Object.keys(tempStudentCards)[0]).set(parsedArray).then().catch(e=>console.log(e));;
    }

    freevar.changeDoorState = function (newstate){
      database.ref('/userReadable/studentCards/doorState').set(newstate).then().catch(e=>console.log(e));;
    }
	freevar.uploadAccessRecord = function (record){
      database.ref('/makerspace/doorAccessHistory').push(record).then().catch(e=>console.log(e));
    }
  }
});
}


//============== Additional Functions

function ONtoBool(str){
  if(str == "ON"){
    return true;
  } else return false;
}


//============== Exit Handler
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

process.on('exit', () => {
  oled.turnOffDisplay();
  but1.unexport()
  but2.unexport()
  but3.unexport()
  but4.unexport()
  but5.unexport()
  but6.unexport()
  but7.unexport()
  but8.unexport()
  but9.unexport()
  but10.unexport()
  process.exit();
});

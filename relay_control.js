var fs = require("fs");
var content = JSON.parse(fs.readFileSync("/home/pi/ceciot/last_state.json"));

const Gpio = require('onoff').Gpio,
  relay   = new Gpio(4, 'out'),
  shift_clock   = new Gpio(19, 'out'),
  shift_data    = new Gpio(13, 'out'),
  shift_latch   = new Gpio(6, 'out'),
  shift_output  = new Gpio(26, 'out'),
  extra1  = new Gpio(27, 'in', 'rising', {debounceTimeout: 20}),
  extra2  = new Gpio(17, 'in', 'rising', {debounceTimeout: 20}),
  fan1    = new Gpio(22, 'in', 'rising', {debounceTimeout: 20}),
  fan2    = new Gpio(23, 'in', 'rising', {debounceTimeout: 20}),
  fan3    = new Gpio(24, 'in', 'rising', {debounceTimeout: 20}),
  light1  = new Gpio(25, 'in', 'rising', {debounceTimeout: 20}),
  light2  = new Gpio(5 , 'in', 'rising', {debounceTimeout: 20}),
  light3  = new Gpio(12, 'in', 'rising', {debounceTimeout: 20}),
  light4  = new Gpio(16, 'in', 'rising', {debounceTimeout: 20}),
  light5  = new Gpio(20, 'in', 'rising', {debounceTimeout: 20}),
  buzzer  = new Gpio(21, 'out')

var switchState = content.switchState;

extra1.watch((err, value) => {
  if (err) throw err;
  if(!noInternet){
    hwChangeRelay(0,false);
    hwChangeRelay(1,false);
    hwChangeRelay(2,false);
    hwChangeRelay(3,false);
    hwChangeRelay(4,false);
    hwChangeRelay(5,false);
    hwChangeRelay(6,false);
    hwChangeRelay(7,false);
  }else{

  }
});

extra2.watch((err, value) => {
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
fan1.watch((err, value) => {
  if (err) throw err;
  flipRelay(5);
});
fan2.watch((err, value) => {
  if (err) throw err;
  flipRelay(6);
});
fan3.watch((err, value) => {
  if (err) throw err;
  flipRelay(7);
});
light1.watch((err, value) => {
  if (err) throw err;
  flipRelay(0);
});
light2.watch((err, value) => {
  if (err) throw err;
  flipRelay(1);
});
light3.watch((err, value) => {
  if (err) throw err;
  flipRelay(2);
});
light4.watch((err, value) => {
  if (err) throw err;
  flipRelay(3);
});
light5.watch((err, value) => {
  if (err) throw err;
  flipRelay(4);
});

function hwChangeRelay(relay,state){
  if(!noInternet)freevar.sinricChange(relay,state);
  else setRelay(relay+1,state);
}

function flipRelay(num){
  switchState[num] = !switchState[num];
  hwChangeRelay(num,switchState[num]);
}

function setRelay(num,state){
  if(!state) setBit(num-1);
  else clrBit(num-1);
}
var valeurMirroir=255;

function setOutput(value) {
  valeurMirroir=value;
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
  content.switchState = switchState;
  fs.writeFileSync("/home/pi/ceciot/last_state-backup.json",JSON.stringify(content));
}

function setBit(bitIndex) {
  setOutput(valeurMirroir | (1 << bitIndex));
}

function clrBit(bitIndex) {
  setOutput(valeurMirroir & ~(1 << bitIndex));
}

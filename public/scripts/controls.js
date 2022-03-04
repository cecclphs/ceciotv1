console.log("[CONTROLS]Loaded")

wsInitialize = function(){
  $('#loadconnection').hide();
  $('.hideWhenConnect').each(function(){
    $(this).show();
  })
  ws.send(JSON.stringify({
    action: "requestState"
  }));
  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    if(msg.content == "switchState"){
      updateSwitchState(msg.value);
    }

  };
}

if(wsState){
  wsInitialize();
}

$('#doorUnlocker').click(function(){
  $('#doorUnlocker').css("background","#c0ffd1")
  setTimeout(function(){
    $('#doorUnlocker').css("background","#FFF")
  },3000)
  ws.send(JSON.stringify({action:"openDoor",value:"5_SEC_OPEN"}))
})

function updateSwitchState(sws) {
  var config = [1, 5, 4, 2, 0, 3, 7, 6]
  $('#switches .speaker_item__29CSE').each(function(index) {
    $(this).css("background", sws[config[index]]?"#f9fcd2":"#FFF")
  });
}

function toggleSwitch(relay) {
  if (wsState) {
    ws.send(JSON.stringify({
      action: "toggleSwitch",
      value: relay
    }))
  }
}

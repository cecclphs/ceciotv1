console.log("[HOME] Loaded")

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
    console.log(msg)
    if (msg.content == "currentLightsFansAll") {
      $('#allfans').css("background", msg.value.currentFans?"#FFF":"#f9fcd2")
      $('#alllights').css("background", msg.value.currentLights?"#FFF":"#f9fcd2")
      $('#everything').css("background", msg.value.currentAll?"#FFF":"#f9fcd2")
    }
    if(msg.content == "switchState"){
      switchState = msg.value;
      currentLights = switchState[0] || switchState[1] || switchState[2] || switchState[4] || switchState[5]
      currentFans = switchState[3] || switchState[7] || switchState[6]
      currentAll = currentLights || currentFans
      $('#allfans').css("background", currentFans?"#f9fcd2":"#FFF")
      $('#alllights').css("background", currentLights?"#f9fcd2":"#FFF")
      $('#everything').css("background", currentAll?"#f9fcd2":"#FFF")
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

function toggleMultiSwitches(mode) {
  if (wsState) {
    ws.send(JSON.stringify({
      action: "toggleMultiSwitches",
      value: mode
    }))
  }
}

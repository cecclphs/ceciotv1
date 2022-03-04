var config = {
    apiKey: "AIzaSyCpWeoGzDrwoJjnsjBnDu-vVUt6LfGHyxk",
    authDomain: "cecdbfirebase.firebaseapp.com",
    databaseURL: "https://cecdbfirebase.firebaseio.com",
    projectId: "cecdbfirebase",
    storageBucket: "cecdbfirebase.appspot.com",
    messagingSenderId: "497574235952"
  };

  var userArray;
  var accessArray;

$( document ).ready(function() {
    console.log( "ready!" );
    ws = new WebSocket("ws://192.168.1.160:8080");
    ws.onmessage = function(e){
        console.log(e)
        message = JSON.parse(e.data);
        switch(message.action){
          case 'accessUpdate':
            accessArray.push([message.id,message.name,message.date.toString()])
            setAccessData(accessArray);
          break;
        }
    }
    firebase.initializeApp(config);
    $( "#lets_go" ).click(function() {
      firebase.auth().signInWithEmailAndPassword($("#email").val(), $("#password").val()).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        toastText(errorMessage,5000);
      });
    });
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        toastText("Welcome!",3000);
        var userId = firebase.auth().currentUser.uid;
        firebase.database().ref('/userReadable/privileges/' + userId).once('value').then(function(snapshot) {
          var permissions = snapshot.val();
          if(permissions.isCardControl || permissions.isAdmin){
            $("#CardControl").removeClass("hidden");
          } else $("#CardControl").addClass("hidden");
          if(permissions.isDoorControl || permissions.isAdmin){
            $("#DoorControl").removeClass("hidden");
          } else $("#DoorControl").addClass("hidden");
          if(permissions.isIoTControl || permissions.isAdmin){
            $("#LightControl").removeClass("hidden");
            $("#FanControl").removeClass("hidden");
            $("#MasterControl").removeClass("hidden");
          } else {
            $("#LightControl").addClass("hidden");
            $("#FanControl").addClass("hidden");
            $("#MasterControl").addClass("hidden");
          }
          $("#CardOwnerControl").addClass("hidden");
          if(permissions.isCrashControl || permissions.isAdmin){
            $("#CrashControl").removeClass("hidden");
          } else $("#CrashControl").addClass("hidden");
          $("#login-field").addClass("hidden");
          $(".description-grid").removeClass("hidden");
        });
      } else {
        $("#login-field").removeClass("hidden");
        $(".description-grid").addClass("hidden");
      }
      firebase.database().ref('/userReadable/studentCards').on('value',function(snapshot) {
        userArray = snapshot.val();
        $("#CardOwnerControl").removeClass("hidden");
        console.log(userArray)
        $('#list2').remove();
        for(i = 0;i < userArray.CARDS_NO;i++){
          user = userArray[i];
          var eachrow = "<tr id=\"list2\" onClick=\"userControlClicked("+ i.toString()+")\">"
                      + "<td>" + i.toString() + "</td>"
                      + "<td>" + user.cardOwner + "</td>"
                      + "<td>" + (user.active?"True":"False") + "</td>"
                      + "</tr>";
          $('#list2table').append(eachrow);
        }
      });
    });
    $( "#unlock_door" ).click(function() {
      if(ws.readyState != 3)ws.send(JSON.stringify({action:'openDoor',value:'5_SEC_OPEN'}));
      else {
        $.ajax({
            success: function(data){
            },
            error: function(){
                console.log('Error');
            },
            type: 'POST',
            url: 'http://192.168.1.160:3000/unlockDoor'
        });
      }
    });
    $( "#logout" ).click(function() {
      firebase.auth().signOut().then(function() {
        toastText('Happy Signing Out!',3000);
      }).catch(function(error) {
        toastText('Lol. No logging out for you.',3000);
      });
    });

    $( "#addcard" ).click(function() {
      ws.send(JSON.stringify({action:'addCard',value:{
        cardOwner:$('#card_owner').val(),
        clearance:$('#clearance').val()
      }}));
      console.log('Success');
      toastText('Waiting to scan new card....',4000);
    });

    $( "#crash_system" ).click(function() {
      console.log('hi');
      $.ajax({
          success: function(data){
              console.log('Successfully Crashed System!');
              toastText('YOU CRASHED THE SYSTEM! OH NO!',3000);
          },
          error: function(){
              console.log('Error');
          },
          type: 'GET',
          url: 'http://192.168.1.160:3000/crash'
      });
    });

    refreshAccessData();
});

function refreshAccessData(){
  $.ajax({
      type: "GET",
      url: "http://192.168.1.160:3000/accesslog",
      dataType: "text",
      success: function(data) {
        accessArray = $.csv.toArrays(data);
        setAccessData(accessArray)
      },
      error: function(err){console.log(err)}
   });
}

function setAccessData(data){
  $('#list1table tbody > tr').remove();
  for(i = data.length;i > data.length-10;i--){
    var item = data[i-1];
    var eachrow = "<tr id=\"list1\">"
                + "<td>" + item[0] + "</td>"
                + "<td>" + item[1] + "</td>"
                + "<td>" + moment(parseInt(item[2], 10)) .format('Do MMMM YYYY, h:mm:ss a') + "</td>"
                + "</tr>";
    $('#list1table').append(eachrow);
  }
}

function userControlClicked(place){
  user = userArray[place];
  var userHTML = "<div class=\"menu-h3\">Editing User "+ user.cardOwner +"<div>"
  $(".menu-box").html(userHTML);
  $(".menu-overlay").addClass("show");
  setTimeout(function(){
    $(".menu-box").addClass("show");
  },10);
}

function openBlankOverlay(){
  $(".menu-overlay").addClass("show");
  setTimeout(function(){
    $(".menu-box").addClass("show");
  },10);
}

function closeOverlay(){
  $(".menu-box").removeClass("show");
  setTimeout(function(){
    $(".menu-overlay").removeClass("show");
  },100);

}

function changeSwitchState(relaynum){
  $.ajax({
      contentType: 'application/json',
      data: JSON.stringify({relay:relaynum}),
      dataType: 'json',
      success: function(data){
          console.log('Success');
      },
      error: function(){
          console.log('Error');
      },
      type: 'POST',
      url: 'http://192.168.1.160:3000/changeSwitchState'
  });
}

function allSwitch(num){
  $.ajax({
      contentType: 'application/json',
      data: JSON.stringify({mode:num}),
      dataType: 'json',
      success: function(data){
          console.log('Success');
      },
      error: function(){
          console.log('Error');
      },
      type: 'POST',
      url: 'http://192.168.1.160:3000/allSwitch'
  });
}

function toastText(toastMsg,timeout){
    var cssfade = (timeout/1000)-0.5;
    $("#snackbar").text(toastMsg);
    $("#snackbar").css("visibility","visible");
    $("#snackbar").css("-webkit-animation","fadein 0.5s, fadeout 0.5s "+cssfade.toString()+"s");
    $("#snackbar").css("animation","fadeout 0.5s "+cssfade.toString()+"s");
    setTimeout(function(){
      $("#snackbar").css("visibility","");
      $("#snackbar").css("-webkit-animation","");
      $("#snackbar").css("animation","");
    }, timeout);
}

function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyz0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

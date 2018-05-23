var timer = null
var pEngine = null

function PresenceData(extensions) {
  this.extensions = extensions
}
PresenceData.prototype = {
  addItemToRow: function(tr, item) {
    var extNum = document.createElement('div')
    if (item.extension.extensionNumber != undefined){
      extNum.innerText = "Ext. " + item.extension.extensionNumber
    }else{
      extNum.innerText = "Unassigned"
    }
    var td1 = document.createElement("td");
    td1.append(extNum)
    tr.append(td1)

    var userStatus = document.createElement("img")
    if (item.userStatus != undefined){
      userStatus.setAttribute('class', 'statusIcon');
      if (item.userStatus == 'Offline')
        userStatus.setAttribute('src', './img/user_offline.png')
      else if (item.userStatus == 'Available')
        userStatus.setAttribute('src', './img/user_available.png')
      else if (item.userStatus == 'Busy')
        userStatus.setAttribute('src', './img/user_busy.png')
      userStatus.setAttribute('title', item.userStatus)
    }
    var td2 = document.createElement("td");
    td2.append(userStatus)
    tr.append(td2)

    var presenceStatus = document.createElement("img")
    if (item.presenceStatus != undefined){
      presenceStatus.setAttribute('class', 'statusIcon');
      if (item.presenceStatus == 'Offline'){
        presenceStatus.setAttribute('src', './img/offline.png')
      }else if (item.presenceStatus == 'Available'){
        presenceStatus.setAttribute('src', './img/available.png')
      }else if (item.presenceStatus == 'Busy'){
        presenceStatus.setAttribute('src', './img/busy.png')
      }
      presenceStatus.setAttribute('title', item.presenceStatus)
    }
    var td3 = document.createElement("td");
    td3.append(presenceStatus)
    tr.append(td3)

    var telephonyStatus = document.createElement("img")
    if (item.telephonyStatus != undefined){
      telephonyStatus.setAttribute('class', 'statusIcon');
      if (item.telephonyStatus == 'NoCall')
        telephonyStatus.setAttribute('src', './img/nocall.png')
      else if (item.telephonyStatus == 'CallConnected')
        telephonyStatus.setAttribute('src', './img/callconnected.png')
      else if (item.telephonyStatus == 'Ringing')
        telephonyStatus.setAttribute('src', './img/ringing.png')
      else if (item.telephonyStatus == 'OnHold')
        telephonyStatus.setAttribute('src', './img/onhold.png')
      else if (item.telephonyStatus == 'ParkedCall')
        img3.setAttribute('src', './img/parked.png')
      telephonyStatus.setAttribute('title', item.telephonyStatus)
    }
    var td4 = document.createElement("td");
    td4.append(telephonyStatus)
    tr.append(td4)

    var dndStatus = document.createElement("img")
    if (item.dndStatus != undefined){
      dndStatus.setAttribute('class', 'statusIcon');
      if (item.dndStatus == 'TakeAllCalls')
        dndStatus.setAttribute('src', './img/takeallcalls.png')
      else if (item.dndStatus == 'DoNotAcceptAnyCalls')
        dndStatus.setAttribute('src', './img/donotdisturb.png')
      else if (item.dndStatus == 'DoNotAcceptDepartmentCalls')
        dndStatus.setAttribute('src', './img/donotacceptdepartmentcalls.png')
      else if (item.dndStatus == 'TakeDepartmentCallsOnly')
        dndStatus.setAttribute('src', './img/takedepartmentcallsonly.png')
      dndStatus.setAttribute('title', item.dndStatus)
    }
    var td5 = document.createElement("td");
    td5.append(dndStatus)
    tr.append(td5)

    var message = document.createElement('div')
    if (item.message != undefined){
      message.innerHTML = item.message
    }
    var td6 = document.createElement("td");
    td6.append(message)
    tr.append(td6)

    var activeCalls = document.createElement('div')
    if (item.activeCalls != undefined && item.telephonyStatus != "NoCall") {
      for (var n=0; n < item.activeCalls.length; n++) {
        var html = '<div>From: ' + item.activeCalls[n].from + '</div>'
        html += '<div>To: ' + item.activeCalls[n].toName  + '</div>'
        html += '<div>Direction: ' + item.activeCalls[n].direction  + '</div>'
        html += '<div>Status: ' + item.activeCalls[n].telephonyStatus + '</div>'
        html += '<div>Time: ' + item.activeCalls[n].startTime + '</div>'
        activeCalls.innerHTML = html
      }
    }
    var td7 = document.createElement("td");
    td7.setAttribute('width', "50%")
    td7.append(activeCalls)
    tr.append(td7)
  },
  displayPresence: function(){
    for (var item of this.extensions){
      var tr = document.createElement("tr");
      tr.setAttribute("id", item.extension.id);
      this.addItemToRow(tr, item)
      $("#results").append(tr)
    }
  },
  updatePresence(extensions){
    for (var ext of extensions){
      for (var item of this.extensions){
        if (ext.extensionId == item.extension.id){
          var row = document.getElementById(item.extension.id)
          $("#"+item.extension.id).empty()
          item.telephonyStatus = ext.telephonyStatus
          item.userStatus = ext.userStatus
          item.dndStatus = ext.dndStatus
          item.allowSeeMyPresence = ext.allowSeeMyPresence
          item.ringOnMonitoredCall = ext.ringOnMonitoredCall
          item.pickUpCallsOnHold = ext.pickUpCallsOnHold
          this.addItemToRow(row, item)
        }
      }
    }
  }
}

function readPresence(){
  var url = "readpresence?accessLevel=" + $('#accessLevel').val()
  var data = {}
  data['detailedTelephonyState'] = $('#detailedTelephonyState').is(':checked')
  data['sipData'] = $('#sipData').is(':checked')

  var posting = $.post(url, data)
  posting.done(function(response) {
    var extensions = JSON.parse(response)
    $("#results").empty()
    pEngine = new PresenceData(extensions)
    pEngine.displayPresence()
  });
  posting.fail(function(response){
    alert(response.statusText);
  });
}

function setUpdateTimer(){
  if (timer == null){
    $("#setTimer").text("Stop Auto Update")
    timer = setInterval(function () {
      updateData()
    }, $("#timeInterval").val() * 1000);
  }else{
    $("#setTimer").text("Start Auto Update")
    clearInterval(timer)
    timer = null
  }
}
function updateData(){
  var posting = $.get("getupdate")
  posting.done(function(response) {
    var extensions = JSON.parse(response)
    if (extensions.length > 0){
      $("#results").empty()
      pEngine = new PresenceData(extensions)
      pEngine.displayPresence()
    }
  });
  posting.fail(function(response){
    alert(response.statusText);
  });
}

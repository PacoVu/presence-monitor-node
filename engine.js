var RC = require('ringcentral')
require('dotenv').load()

var rcsdk = null
if (process.env.PROD == "production"){
  rcsdk = new RC({
    server:RC.server.production,
    appKey: process.env.CLIENT_ID_PROD,
    appSecret:process.env.CLIENT_SECRET_PROD
  })
}else{
  rcsdk = new RC({
      server:RC.server.sandbox,
      appKey: process.env.CLIENT_ID_SB,
      appSecret:process.env.CLIENT_SECRET_SB
    })
}
var platform = rcsdk.platform()

var hasUpdate = false
var extensions = []

var engine = module.exports = {
    login: function(req, res){
      var un = ""
      var pwd = ""
      if (process.env.PROD == "production"){
        un= process.env.USERNAME_PROD,
        pwd= process.env.PASSWORD_PROD
      }else{
        un= process.env.USERNAME_SB,
        pwd= process.env.PASSWORD_SB
      }
      platform.login({
        username:un,
        password:pwd
      })
      .then(function(resp){
        removeRegisteredSubscription()
        res.render('index')
      })
      .catch(function(e){
        throw e
      })
    },
    readPresence: function(req, res){
      var endpoint = ""
      if (req.query.accessLevel == "account")
        endpoint = '/account/~/presence'
      else
        endpoint = '/account/~/extension/~/presence'
      var params = req.body
      platform.get(endpoint, params)
      .then(function(resp){
        var json = resp.json()
        if (json.records != undefined){
          if (process.env.PRINT_LOG == "yes")
            for (var record of json.records)
              console.log("RESULT: " + JSON.stringify(record))
          extensions = json.records
        }else{
          extensions = []
          extensions.push(json)
        }
        res.send(JSON.stringify(extensions))
      })
      .catch(function(e){
        var json = {
          status: "FAILED"
        }
        res.send(json)
        console.log("catch exception")
        throw e
      })
    },
    getUpdate: function(req, res){
      if (hasUpdate){
        hasUpdate = false
        res.send(JSON.stringify(extensions))
      }else {
        res.send('[]')
      }
    }
}

var subcription = rcsdk.createSubscription()
function subscribeForNotification(){
  var eventFilter = []
  eventFilter.push('/restapi/v1.0/account/~/presence?detailedTelephonyState=true')
  subcription.setEventFilters(eventFilter)
  .register()
  .then(function(resp){
      console.log('ready to get account presense')
  })
  .catch(function(e){
    throw e
  })
}
subcription.on(subcription.events.notification, function(msg){
  for (var i=0; i<extensions.length; i++){
    var ext = extensions[i]
    if (process.env.PRINT_LOG == "yes")
      console.log("NOTIFICATION: " + JSON.stringify(msg.body))

    if (ext.extension.id == msg.body.extensionId){
      extensions[i].telephonyStatus = msg.body.telephonyStatus
      extensions[i].presenceStatus = msg.body.presenceStatus
      extensions[i].userStatus = msg.body.userStatus
      extensions[i].dndStatus = msg.body.dndStatus
      extensions[i].activeCalls = msg.body.activeCalls
      extensions[i].message = msg.body.message
      hasUpdate = true
      break
    }
  }
})

function removeRegisteredSubscription() {
    platform.get('/subscription')
      .then(function (response) {
        var data = response.json();
        subscribeForNotification()
        if (data.records.length > 0){
          for(var record of data.records) {
            // delete old subscription before creating a new one
            platform.delete('/subscription/' + record.id)
              .then(function (response) {
                console.log("deleted: " + record.id)
              })
              .catch(function(e) {
                console.error(e);
                throw e;
              });
          }
        }
      })
      .catch(function(e) {
          console.error(e);
          throw e;
      });
}

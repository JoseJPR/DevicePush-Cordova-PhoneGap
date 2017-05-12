var evtDR = document.createEvent("Event");
evtDR.initEvent("deviceRegistered",true,true);
var evtNR = document.createEvent("Event");
evtNR.initEvent("notificationReceived",true,true);
var evtDU = document.createEvent("Event");
evtDU.initEvent("deviceUnregistered",true,true);
var _DP_currentPosition;
var _DP_Notifications = new Array();
var _DP_urlApi = "http://api.devicepush.com/mobile/";
module.exports = {
    register: function(obj){
		window.localStorage.setItem("_DP_idUser", obj.idUser);
		window.localStorage.setItem("_DP_idApplication", obj.idApplication);
        console.log('_DP_obj -> ' + obj);
        if(typeof obj.position === 'undefined' || obj.position === null || obj.position === false){
            window.localStorage.setItem("_DP_position", 0);
        }else{ 
            window.localStorage.setItem("_DP_position", 1);
        }

        if( device.platform == 'android' || device.platform == 'Android' ) var platformDP = 'Android';
        else if( device.platform == 'iOS' ) var platformDP = 'iOS';
		else var platformDP = 'Windows';
        
        devicePush.createStyle(platformDP);

        var xmlhttpSinc = new XMLHttpRequest();
        xmlhttpSinc.open("GET", _DP_urlApi + window.localStorage.getItem("_DP_idApplication") + "/senderid/", true);
        xmlhttpSinc.setRequestHeader("token", window.localStorage.getItem("_DP_idUser"));
        xmlhttpSinc.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttpSinc.onreadystatechange = function(){
            if (xmlhttpSinc.readyState == 4 && xmlhttpSinc.status == 200){

                console.log('_DP_readyStateGET');
                var dataXmlhttpSinc = JSON.parse(xmlhttpSinc.responseText);
                window.localStorage.setItem("_DP_senderId", dataXmlhttpSinc.senderid);

                var push = PushNotification.init({ 
                    "android": {"senderID": dataXmlhttpSinc.senderid},
                    "ios": {}, 
                    "windows": {} 
                });
                                
                if(typeof window.localStorage.getItem("_DP_devicePushToken") === 'undefined' || window.localStorage.getItem("_DP_devicePushToken") === null){
                    push.on('registration', function(data) {
                        console.log('_DP_registration');
                        window.localStorage.setItem("_DP_devicePushToken", data.registrationId);

                        var xmlhttpReg = new XMLHttpRequest();
                        xmlhttpReg.open("POST", _DP_urlApi + window.localStorage.getItem("_DP_idApplication") + '/', true);
                        xmlhttpReg.setRequestHeader("token", window.localStorage.getItem("_DP_idUser"));
                        xmlhttpReg.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                        xmlhttpReg.onreadystatechange = function(){
                            if (xmlhttpReg.readyState == 4 && xmlhttpReg.status == 200){

                                console.log('readyStatePOST');
                                window.localStorage.setItem("_DP_devicePushId", JSON.parse(xmlhttpReg.responseText)._id);
                                
                                evtDR.devicePushId = window.localStorage.getItem("_DP_devicePushId");
                                evtDR.devicePushToken = window.localStorage.getItem("_DP_devicePushToken");
                                document.dispatchEvent(evtDR);
                                
                                if(window.localStorage.getItem("_DP_position") == 1) devicePush.getPosition();
                                
                            }
                        }
                        xmlhttpReg.send(JSON.stringify({
                            token: data.registrationId,
                            device: platformDP,
                            additionaldata: obj.additionalData
                        }));

                    });
                }else{
                    if(window.localStorage.getItem("_DP_position") == 1) devicePush.getPosition();
                }   

                push.on('notification', function(data) {
                    // data.message,
                    // data.title,
                    // data.count,
                    // data.sound,
                    // data.additionalData
                    console.log(data);
                    if(typeof data === 'undefined' || data === null){
                        console.log('_DP_data_error -> ' + data); 
                    }else{ 
                        evtNR.data = data;
                        document.dispatchEvent(evtNR);
                    }
                });

                push.on('error', function(e) {
                    console.log('_DP_error -> ' + e.message);
                });

            }
        }
        xmlhttpSinc.send();
    },
    unregister: function(){
        var xmlhttpUnReg = new XMLHttpRequest();
        xmlhttpUnReg.open("DELETE", _DP_urlApi + "remove/device/", true);
        xmlhttpUnReg.setRequestHeader("token", window.localStorage.getItem("_DP_idUser"));
        xmlhttpUnReg.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttpUnReg.onreadystatechange = function(){
            if (xmlhttpUnReg.readyState == 4 && xmlhttpUnReg.status == 200){
                console.log('_DP_readyStateDELETE');
                document.dispatchEvent(evtDU);
            }
        }
        xmlhttpUnReg.send(JSON.stringify({
            idApplication: window.localStorage.getItem("_DP_idApplication"),
            idDevice: window.localStorage.getItem("_DP_devicePushId")
        }));
    },
    getDeviceId: function(){ return window.localStorage.getItem("_DP_devicePushId"); },
    getDeviceToken: function(){ return window.localStorage.getItem("_DP_devicePushToken"); },
    setPosition: function(val){
        console.log('_DP_setPosition -> ' + val);
        if(typeof val === 'undefined' || val === null || val === false){
            window.localStorage.setItem("_DP_position", 0);
            navigator.geolocation.clearWatch(_DP_currentPosition);
        }else{ 
            window.localStorage.setItem("_DP_position", 1);
            devicePush.getPosition();
        }
    },  
	getPosition: function(){
        console.log('_DP_getPosition');
		_DP_currentPosition = navigator.geolocation.watchPosition(devicePush.putPosition, devicePush.errorPosition, { maximumAge: 3000, timeout: 30000, enableHighAccuracy: true });
	},
	putPosition: function(position){
        console.log('_DP_putPosition -> _DP_longitude' + position.coords.longitude + '_DP_latitude' + position.coords.latitude);
        var xmlhttpPutPosition = new XMLHttpRequest();
        xmlhttpPutPosition.open("POST", _DP_urlApi + 'position/updateposition', true);
        xmlhttpPutPosition.setRequestHeader("token", window.localStorage.getItem("_DP_idUser"));
		xmlhttpPutPosition.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xmlhttpPutPosition.onreadystatechange = function(){
			if (xmlhttpPutPosition.readyState == 4 && xmlhttpPutPosition.status == 200){}
		}
		xmlhttpPutPosition.send(JSON.stringify({
			idDevice: window.localStorage.getItem("_DP_devicePushId"),
			lon: position.coords.longitude,
			lat: position.coords.latitude
		}));
	},
	errorPosition: function(error){
        console.log('_DP_errorPosition' + error);
    },
	putAdditionalData: function(obj){
        console.log('_DP_putAdditionalData');
        console.log(obj);
        var xmlhttpPutPosition = new XMLHttpRequest();
        xmlhttpPutPosition.open("POST", _DP_urlApi + 'additionaldata/update', true);
        xmlhttpPutPosition.setRequestHeader("token", window.localStorage.getItem("_DP_idUser"));
		xmlhttpPutPosition.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xmlhttpPutPosition.onreadystatechange = function(){
			if (xmlhttpPutPosition.readyState == 4 && xmlhttpPutPosition.status == 200){}
		}
		xmlhttpPutPosition.send(JSON.stringify({
			idDevice: window.localStorage.getItem("_DP_devicePushId"),
			additionaldata: obj
		}));
	},
    createStyle: function(platformDP){
        var custom = '';
        var style = document.createElement('style');
        style.type = 'text/css';
        if(platformDP == 'iOS'){ custom = 'padding-top:15px'; }
        style.innerHTML += '._DP_notification{position: absolute;top: 0px;background-color: #333;color: #fff;width: 100%;height: auto;font-size: 11px;min-height: 30px;line-height: 30px;text-align: center;z-index: 99; ' + custom + '}._DP_containerCenter{-webkit-transform: translate3d(0, 0, 0);transform: translate3d(0, 0, 0)}._DP_containerTop{-webkit-transform: translate3d(0, -100%, 0);transform: translate3d(0, -100%, 0)}._DP_containerTransition {-webkit-transition-duration: .25s;transition-duration: .25s}';  
        document.getElementsByTagName('head')[0].appendChild(style);
    },
    showNotification: function(t){
        var modalId = Date.now();
        document.body.innerHTML += '<div id="_DP_notification' + modalId + '" class="_DP_notification _DP_containerTop _DP_containerTransition">' + t + '</div>';
        _DP_Notifications[modalId] = setTimeout(function(){
            document.getElementById('_DP_notification' + modalId).classList.add('_DP_containerCenter');
            document.getElementById('_DP_notification' + modalId).classList.remove('_DP_containerTop');
            setTimeout(function(){
                document.getElementById('_DP_notification' + modalId).classList.add('_DP_containerTop');
                document.getElementById('_DP_notification' + modalId).classList.remove('_DP_containerCenter');
                setTimeout(function(){
                    document.getElementById('_DP_notification' + modalId).remove();
                    clearInterval(_DP_Notifications[modalId]);
                    delete _DP_Notifications[modalId];
                },250);
            },2000);
        },100);
    }
}
const mqtt = require('mqtt');

const client = mqtt.connect("mqtt://finland.aspectron.com:7350",{clientId:"mqttjs01"});


client.on("connect",function() {
    console.log("connected");

    client.subscribe("dag/selected-tip",{qos:1});
})

client.on('message',function(topic, message, packet){
	console.log("message is "+ message);
	console.log("topic is "+ topic);
});


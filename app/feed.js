const mqtt = require('mqtt');

const client = mqtt.connect("ws://finland.aspectron.com:7351",{clientId:"mqttjs01"});

client.subscribe("dag/selected-tip",{qos:1});
client.on("connect",function() {
    console.log("connected");
})

client.on('message',function(topic, message, packet){
	console.log("message is "+ message);
	console.log("topic is "+ topic);
});


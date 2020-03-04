const mqtt = require('mqtt');

const client = mqtt.connect("mqtt://kasparov-dev-auxiliary-open-devnet.daglabs.com:1883",{
	clientId:"mqtt_"+(Date.now()*Math.random()).toString(16),
	username:'user',
	password:'pass'
});

client.subscribe("dag/selected-tip",{qos:1});
client.subscribe("dag/selected-parent-chain",{qos:1});
client.on("connect",function() {
    console.log("connected");
})

client.on('message',function(topic, message, packet){
	console.log("message is "+ message);
	console.log("topic is "+ topic);
});


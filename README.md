# BlockDAG Vizualization library

### Running DAGVIZ
```
git clone git@github.com:kaspanet/dagviz
cd dagviz
npm install
node dagviz
```
then open http://127.0.0.1:8080 in your browser (tested with Chrome only)


### Options

There are few basic options that can be currently passed to DAGVIZ via the browser URL:

For example `?simulate` will run a 100 block dataset simulation.  The command should be passed as follows: http://127.0.0.1:8686?simulate

Following options are available:

- `?simulate` - run simulation (do not stop live MQTT feed)
- `?simulate-only` - run simulation and stop MQTT feed (no interference)
- `?connect` - interconnect blocks incoming via MQTT with dag/selected-tip notifications
- `?address=ws://<mqtt over websocket address>` - use this option to supply an alternate MQTT over websocket address. 

DAGViz will currently connect to ws://finland.aspectron.com:7351 by default. Hence the url for an address like this would be as follows:  http://127.0.0.1:8686?address=ws://finland.aspectron.com:7351 Use this to connect to MQTT of your choosing.

At the top of the UI you will find following options:
- TRACKING - will cause DAGViz to track the viewport always focusing on the last added block
- LINK SEQUENTIAL - (FAKE, Temporary) - Links blocks in the order received.


### Test Instance

There is currently a temporary instance of DAGViz running at:
http://finland.aspectron.com:8686/

You can run this with simulation enabled:
http://finland.aspectron.com:8686/?simulate

Or you can point it to your MQTT feed as described above, using the address query parameter:
```http://finland.aspectron.com:8686/?address=<websocket mqtt server>```

### Building Docker Image

Using emanator:
```
emanate --docker
```

Native docker:
```
sudo docker build -t dagviz 
sudo docker run -p 8686:8686 dagviz
```

HTTP user interface is exposed on port `8686`
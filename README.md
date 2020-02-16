# BlockDAG Vizualization library

### Running DAGVIZ

(please note, the project currntly relies on polymer-cli which is very heavy, it will be removed shortly)
```
git clone git@github.com:kaspanet/dagviz
cd dagviz
npm install
node dagviz
```
then open http://127.0.0.1:8686/components/dagviz/ in your browser (tested with Chrome only)


### Options

There are few basic options that can be currently passed to DAGVIZ via the browser URL:

For example `?simulate` will run a 100 block dataset simulation.  The command should be passed as follows: http://127.0.0.1:8686/components/dagviz/?simulate

Following options are available:

- `?simulate` - run simulation
- `?connect` - interconnect blocks incoming via MQTT with dag/selected-tip notifications
- `?address=ws://<mqtt over websocket address>` - use this option to supply an alternate MQTT over websocket address. 

DAGViz will currently connect to ws://finland.aspectron.com:7351 by default. Hence the url for an address like this would be as follows:  http://127.0.0.1:8686/components/dagviz/?address=ws://finland.aspectron.com:7351 Use this to connect to MQTT of your choosing.

At the top of the UI you will find following options:
- TRACKING - will cause DAGViz to track the viewport always focusing on the last added block
- LINK SEQUENTIAL - (FAKE, Temporary) - Links blocks in the order received.

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
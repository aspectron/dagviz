# BlockDAG Vizualization library

### Running DAGVIZ


```
git clone git@github.com:kaspanet/dagviz
cd dagviz
npm install
npm install -g polymer-cli

...

polymer serve
```
then open http://127.0.0.1:8081/components/dagviz/ in your browser (tested with Chrome only)


### Options

There are few basic options that can be currently passed to DAGVIZ via the browser URL:

For example `?simulate` will run a 100 block dataset simulation.  The command should be passed as follows: http://127.0.0.1:8081/components/dagviz/?simulate

Following options are available:

- `?simulate` - run simulation
- `?connect` - interconnect blocks incoming via MQTT with dag/selected-tip notifications
- `?address=ws://<mqtt over websocket address>` - use this option to supply an alternate MQTT over websocket address. DAGViz will currently connect to ws://finland.aspectron.com:7351 by default.

At the top of the UI you will find following options:
- TRACKING - will cause DAGViz to track the viewport always focusing on the last added block
- LINK SEQUENTIAL - (FAKE, Temporary) - Links blocks in the order received.

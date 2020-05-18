# BlockDAG Vizualization library

## Running DAGViz

### Prerequisites

DAGViz requires NodeJS v12+ and a local MySQL database instance to operate.

- Linux: `sudo apt-get install mysql-server` or `apk install mariadb mariadb-client`
- Darwin: TODO (tested - functional - runs from `/usr/local/mysql/bin`)
- Windows: DAGViz provides a script for local mysql deployment

If you are running Windows, you must install local mysql binaries in the following way:
```
npm install -g emanator@latest
cd dagviz
emanate --mysql
```
This will download and unarchive Oracle MySQL for Windows.

Before running DAGViz, you must initialize the database as follows: `node dagviz.js --init-mysql`.

NOTE:  MySQL database name used for local blockchain cache storage is derived from the Kasparov API endpoint.  You can safely connect the same instance of DAGViz to different instances of Kasparov.

### Running the application

DAGViz connects to and feeds off Kasparov API server.  Kasparov URL can be specified via the `--kasparov` command line argument.

### Local Deployment
```
git clone git@github.com:kaspanet/dagviz
cd dagviz
npm install
node dagviz --kasparov=<kasparov-api-server-url:port>
```
Following this, open http://localhost:8686 in your browser.

### Docker

- build: `sudo docker build -t dagviz`
- run: `sudo docker run -p 8686:8686 dagviz --kasparov=<kasparov-api-server-url:port>
- build using emanator: `emanate --docker`

## v2 NOTES:

This is a complete refactoring of the initial v1 prototype.

- blueScore is used as a general height (x axis)
- a child block is always located after the parent

## DAGViz Structure

### Internal API

Current implementation of DAGViz connects to kasparov and fetches the entire blockchain dataset. Once fetched, the system keeps up (currently via polling, until MQTT is stabilized and proper notifications are available).

DAGViz downloads the data into the local MySQL database instance which is then used to serve the data to the webapp.

DAGViz currently resides on top of a single internal API method `/data-slice`:

*/data-slice* arguments:

- `unit` - Units used to query the API, available: 'blueScore', 'timestamp', 'lseq' (*lseq* is a linear sequence derived from the database id)
- `from` - Starting point of the range (inclusive)
- `to` - Ending point of the range (exclusive)

Returns a JSON object with the following fields:

- `blocks : [ ]' - array of blocks (can contain a partial response)
- `total : <integer>` - total number of blocks resulting from this query
- `last : <unit>` - last item position in this response - can be used as `to` field in subsequent queries to continue fetching the range
- `max : <unix>` - currently maximum value of unit type available (highest blueScore or largest timestamp currently available)

### API Block Data Structure:

As of v2 the the block data structure used by DAGViz differs from Kasparov: in addition to `parentBlockHashes` field, DAGViz blocks contain `childBlockHashes` which allow for reverse mapping of parents to children.

Constant re-partitioning that occurs in the DAGViz user interface makes it very difficult to traverse and perform chain analysis. Having `childBlockHashes` available as a part of the API response allows us to instantly notify already-existing children that they should link up to parents (otherwise we have to traverse the entire snapshot each time a new node is created).

## DAGViz under KDX

You can run DAGViz under KDX using the following configuration entry:
```json

	"app:dagviz": {
		"disable": true,
		"folder": "c:/dev/daglabs/dagviz",
		"location": "http://localhost:8689",
		"args": [
			"node",
			"dagviz",
            "--no-auth",
			"--port=8689",
			"--kasparov=http://localhost:11224",
			"--mqtt-address=mqtt://localhost:18792"
		]
	}
```
- `folder` - location of dagviz project
- `location` - url for KDX to access dagviz UI (must match port number provided via `--port`)
- `args` - command line arguments to pass to DAGViz


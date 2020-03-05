const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const mkdirp = require('mkdirp');
const { execFile, execFileSync } = require('child_process');

const { utils } = require("micro-fabric");
const mysql = require('mysql');

const isDocker = require('is-docker');
const isDocker_ = isDocker();

const MYSQL_STARTUP_DELAY = 1250; // msec
const MYSQL_TEST_DELAY = 2500; // msec

class mySQL {
	constructor(options) {
		this.options = options;
		this.flags = utils.args();
	}

	start() {
		this.log("mysql::start()");
		return new Promise(async (resolve,reject) => {

			//const core = this.manager.core;
			//const env = core.env;
			this.BIN = path.join(__dirname,'..','bin',utils.platform);
			this.PLATFORM_BINARY_EXTENSION = process.platform == 'win32' ? '.exe' : '';



			// let defaults = {
			// 	datadir : path.join(os.homedir(),'.dagviz','mysql')
			// }

			this.folder = path.join(os.homedir(),'.dagviz');

			// let args = { };

			// // (this.task.args || []).forEach((p) => {
			// // 	let [k,v] = p.split('=');
			// // 	args[k] = v;
			// // })

			// args = Object.entries(Object.assign(defaults, args)).map((o) => {
			// 	const [k,v] = o;
			// 	return {k,v};
			// });


			try {
				if(fs.existsSync('/etc/my.cnf.d/mariadb-server.cnf'))
					fs.unlinkSync('/etc/my.cnf.d/mariadb-server.cnf');
			} catch(ex) {
				console.log('WARNING - MariaDB - Critical Condition while trying to erase /etc/my.cnf.d/mariadb-server.cnf: please ensure you have correct access rights');
				console.log('Error unlinking default mariadb config in /etc/my.cnf.d - ',ex.toString());
			}

			
			if(os.platform() == 'darwin'){
				this.mysqlBinFolder = '/usr/local/mysql/bin';
			}else if(isDocker_ || os.platform() == 'linux') {
				this.mysqlBinFolder = '/usr/bin';
			} else {
				const mysqlFolder = fs.readdirSync(this.BIN).filter(f => f.match(/^mysql/i)).shift();
				if(!mysqlFolder) {
					this.log(`MYSQL - Unable to find 'mysql' folder in 'bin'`);
					return;
				}
				this.mysqlBinFolder = path.join(this.BIN,mysqlFolder,'bin');
			}
			
			this.binary = { };
			this.binary.mysqld = path.join(this.mysqlBinFolder,'mysqld')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.mysqld_safe = path.join(this.mysqlBinFolder,'mysqld_safe')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.mysql = path.join(this.mysqlBinFolder,'mysql')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.mysqladmin = path.join(this.mysqlBinFolder,'mysqladmin')+this.PLATFORM_BINARY_EXTENSION;
			this.binary.mysql_install_db = path.join(this.mysqlBinFolder,'mysql_install_db')+this.PLATFORM_BINARY_EXTENSION;

			this.dataFolder = path.join(this.folder,'data');
			// mkdirp.sync(this.dataFolder);
			this.logsFolder = path.join(this.folder,'logs');
			mkdirp.sync(this.logsFolder);

			this.logFile = path.join(this.logsFolder,`mysql-dagviz.log`);

			// const binary_mysqld = path.join(this.manager.core.getBinaryFolder(),this.mysqlBinFolder,'mysqld')+this.PLATFORM_BINARY_EXTENSION;
			// const binary_mysql = path.join(this.manager.core.getBinaryFolder(),this.mysqlBinFolder,'mysql')+this.PLATFORM_BINARY_EXTENSION;
			//const binary = path.join(core.appFolder,'bin','mysql-8.0.18-winx64','bin','mysqld')+this.PLATFORM_BINARY_EXTENSION;
			//		const rpcCertFile = path.join(core.appFolder,'bin','rpc.cert');
			//console.log('running',binary.cyan.bold);
			const maria = os.platform() != 'win32' || fs.existsSync(this.binary.mysql_install_db);

			const port = this.options.port;

			const args = [
				`--basedir=${this.folder}`,
				`--datadir=${this.dataFolder}`,
				`--port=${port}`,
				`--log-error=${this.logFile}`,
				`--user=root`
				//`--console`
			];

			if(os.platform() != 'win32') {
				this.uid = Date.now().toString(16);
				args.push(`--pid-file=/var/run/mysqld/dagviz.pid`);
				args.push(`--socket=/var/run/mysqld/dagviz.sock`);
			}

			if(os.platform() == 'darwin'){
				args.push(`--ledir=${this.mysqlBinFolder}`)
			}

			const run = (...custom_args) => {
				return new Promise((resolve,reject) => {
					dpc(async ()=>{
						this.proc = new utils.Process({
							verbose : true,
							cwd : os.platform() == 'win32' ? this.folder : '/usr',
							// detached : true,
							args : () => {
								return [
									maria ? this.binary.mysqld_safe : this.binary.mysqld,
									// this.binary.mysqld,
									...custom_args,
									...args
								];
							}
						})
						this.proc.run().then(resolve,reject);
					})
				})
			}

			if(this.flags['reset-mysql'] || this.flags['init-mysql'] ) {
				this.log("Emptying MySQL data folder".brightBlue);
				fs.emptyDirSync(this.dataFolder);
			}

			if(!fs.existsSync(path.join(this.dataFolder,'mysql'))) {
				this.log("MYSQL: initializing data folder".brightYellow,this.dataFolder.brightWhite);


				const init = new Promise((resolve,reject) => {
					try {
						if(maria) {
							execFile(this.binary.mysql_install_db,[
								//`--basedir=${this.folder}`,
								`--basedir=/usr`,
								`--datadir=${this.dataFolder}`,
								// `--verbose`,
								`--user=root`
								//`--user=ubuntu`
							], { 
								//cwd : this.folder
								cwd : '/usr'
							}, async (error, stdout, stderr)=>{
								this.log((stdout.toString()+stderr.toString()).blue);
								if(error) {
									this.log(error);
									this.log('FATAL - ABORTING MYSQL STARTUP SEQUENCE! [1]'.brightRed);
									return reject();
								}
								resolve();
							});		
						} else {
							execFile(this.binary.mysqld,[
								`--basedir=${this.folder}`,
								`--datadir=${this.dataFolder}`,
								`--log-error=${this.logFile}`,
								'--initialize-insecure',
								'-u',
								'root'
							], { cwd : this.folder}, async (error, stdout, stderr)=>{
								this.log((stdout.toString()+stderr.toString()).blue);
								if(error) {
									this.log(error);
									this.log('FATAL - ABORTING MYSQL STARTUP SEQUENCE! [1]'.brightRed);
									return reject();
								}
								resolve();
							});		
						}
					} catch(ex) {
						console.log(ex);
						this.log('FATAL - ABORTING MYSQL STARTUP SEQUENCE! [2]'.brightRed);
						return;
					}
						
				});
				
				try {
					await init;
				} catch(ex) {
					console.log(ex);
					this.log('FATAL - ABORTING MYSQL STARTUP SEQUENCE! [3]'.brightRed);
					return;
				}

				await run();
				//await run('--skip-grant-tables');
				this.log("MySQL PID:",this.proc.process.pid);

				// console.log("Sleeping while MySQL is starting up...".color(48));
				// await this.sleep(3000);
				// console.log("Sleep done...  MySQL should be running by now...".color(48));

				//console.log("waiting for 2 seconds")
				dpc(MYSQL_STARTUP_DELAY, () => {
					this.log("Initializing instantiated MySQL Db".brightYellow);

					const mysqlInitArgs = [ ];
					// if(os.platform() != 'win32')
					mysqlInitArgs.push(`--socket=/var/run/mysqld/dagviz.sock`);
					if(maria) {
						mysqlInitArgs.push(
							'-h','localhost','-u','root', '-P',port,`--connect-timeout=15`,'-e',
							`ALTER USER root@localhost IDENTIFIED BY 'dagviz'; GRANT ALL PRIVILEGES ON *.* TO root@localhost; FLUSH PRIVILEGES;`
							//`"UPDATE mysql.user SET authentication_string=PASSWORD('dagviz')  WHERE  User='root'; GRANT ALL PRIVILEGES ON *.* TO root@localhost; FLUSH PRIVILEGES;"`
						);
					} else {
						mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',
							`ALTER USER root@localhost IDENTIFIED WITH mysql_native_password BY 'dagviz'; GRANT ALL PRIVILEGES ON *.* TO root@localhost; FLUSH PRIVILEGES;`);
					}
					// `CREATE DATABASE dagviz; ALTER USER root@localhost IDENTIFIED BY 'dagviz'; GRANT ALL PRIVILEGES ON *.* TO root@localhost; FLUSH PRIVILEGES;`);

					//UPDATE mysql.user SET authentication_string=PASSWORD('dagviz')  WHERE  User='root';


					// `ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; UPDATE mysql.user SET Host='%' WHERE Host='localhost' AND User='root'; FLUSH PRIVILEGES;`);
					// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; FLUSH PRIVILEGES;`);
					// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password AS 'khost'; FLUSH PRIVILEGES;`);
					execFile(this.binary.mysql, mysqlInitArgs,{
						cwd : this.folder
					},async (error, stdout, stderr)=>{
						if(error) {
							this.log("Error configuring mysql".brightRed);
							this.log(error);
						}
						if(stdout.toString() || stderr.toString())
							this.log((stdout+stderr).blue);
						this.log("MySQL configuration successful!".brightGreen);

						//if(this.flags['test-mysql']) {
							dpc(MYSQL_TEST_DELAY, () => {
								this.log(`Connecting to instantiated MySQL Db - port: ${port}`.brightYellow);
								const db = mysql.createConnection({
									host : 'localhost', port,
									user : 'root',
									password: 'dagviz',
									// database: 'mysql',
									// insecureAuth : true
								});
								
								db.connect(async (err) => {

									if(err) {
										this.log(err);
										this.log("FATAL - MYSQL STARTUP SEQUENCE! [2]".brightRed);
										return reject(err);
									}

									this.log("MySQL connection SUCCESSFUL!".brightGreen);

									if(this.options.database) {
										console.log(`Creating database ${this.options.database}...`)
										db.query(`CREATE DATABASE IF NOT EXISTS ${this.options.database} DEFAULT CHARACTER SET utf8;`, (err) => {
											if(err)
												return reject(err);
											console.log('db creation ok...');
											resolve();
										});        

									}
									else {
										resolve();
									}



									db.end(()=>{
										this.log("MySQL client disconnecting.".brightGreen);
									});
								});
							});
						// }
						// else {
						// 	resolve();
						// }
					});
				});
			}
			else {
				await run();
				console.log('waiting for mysql...');
				dpc(2500, () => {
					resolve();
				})
			}
		})
	}

	stop() {
		if(!this.proc)
			return null;

		return new Promise((resolve,reject)=>{

			const user = 'root';
			const pass = 'dagviz';
			const host = 'localhost';
			const port = this.globals.mysql.ports.client+this.task.seq;

			this.proc.relaunch = false;
			this.proc.no_warnings = true;
			let fail = false;
			const timeout = setTimeout(()=>{
				fail = true;
				this.log("MySQL daemon shutdown has timed-out".brightRed);
				resolve();
			}, 15_000);	// ...should be more than plenty...
			this.proc.once('halt', () => {
				if(!fail) {
					this.log("MySQL daemon has gracefully halted".brightCyan);
					clearTimeout(timeout);
					resolve();
				}
			});

			//const mysqladmin = path.join(this.manager.core.getBinaryFolder(),this.mysqlBinFolder,'mysqladmin')+this.PLATFORM_BINARY_EXTENSION;
			

			this.log('MySQL is being shutdown');
			
			const args = [];
			if(os.platform() != 'win32')
			 	args.push(`--socket=/var/run/mysqld/dagviz.sock`);
			else
				args.push('--protocol=tcp');
			
			args.push(`--user=${user}`,
			`--password=${pass}`,
			`--host=${host}`,
			`--port=${port}`,
			`-e`,`SHUTDOWN;`);

			this.log(this.binary.mysql, args);

			// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',
			// `ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; UPDATE mysql.user SET Host='%' WHERE Host='localhost' AND User='root'; FLUSH PRIVILEGES;`);
			// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED BY 'khost'; FLUSH PRIVILEGES;`);
			// mysqlInitArgs.push('-h','localhost','-u','root','-P',port,`--connect-timeout=15`,'-e',`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password AS 'khost'; FLUSH PRIVILEGES;`);
			// execFile(this.binary.mysql,mysqlInitArgs,{
			// 	cwd : this.folder
			// },async (error, stdout, stderr)=>{
			// 	if(error) {
			// 		this.log("Error configuring mysql".brightRed);
			// 		this.log(error);
			// 	}
		///////////////////////////////////

			execFile(this.binary.mysql, args, {
				cwd : this.folder
			}, (error,stdout,stderr) => {
				if(error) {
					this.log("Error configuring mysql".brightRed);
					this.log(error);
				}			
				
				this.log('MySQL shutdown posted...');
				// this.proc.terminate();
			})
		})
	}

	log(...args) {
		console.log(...args);
	}
}

// const inst = new mySQL();
// inst.start();

module.exports = mySQL;
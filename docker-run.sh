# sudo docker run --net host dagviz "$@"
if [ $1 == 'mainnet' ]
then
    echo Not there yet...
    #sudo docker run --net host dagviz --port=18686 
elif [ $1 == 'testnet' ]
then
    sudo docker run --net host dagviz --dbport=18786 --port=18787 --kasparov=https://testnet-kasparovd.kas.pa/ --disable-mqtt
    #sudo docker run --net host dagviz --port=18787 -- 
elif [ $1 == 'devnet' ]
then
    sudo docker run --net host dagviz --dbport=18887 --port=18888 --kasparov=http://kasparov-dev-auxiliary-open-devnet.daglabs.com:8080 --mqtt-address=mqtt://kasparov-dev-auxiliary-open-devnet.daglabs.com:1883 --mqtt-user=user --mqtt-pass=pass
elif [ $1 == 'aux' ]
then
    # devnet dag with 5 sec propagation
    sudo docker run --net host dagviz  --dbport=18988 --port=18989 --kasparov=http://kasparov-dev-auxiliary-default.daglabs.com:8080/ --disable-mqtt
else
    echo Please specify: mainnet, testnet, devnet, aux
fi

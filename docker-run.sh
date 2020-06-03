# sudo docker run --net host dagviz "$@"
if [[ $1 == 'mainnet' ]]
then
    echo Not there yet...
    exit 0
    #sudo docker run --net host dagviz --port=18686 
elif [[ $1 == 'testnet' ]]
then
    sudo docker run $2 --net host dagviz --dbport=18786 --port=18787 --kasparov=https://testnet-kasparovd.kas.pa/ --disable-mqtt
    exit 0
    #sudo docker run --net host dagviz --port=18787 -- 
elif [[ $1 == 'open.devnet' ]]
then
    port := 18888
    dbport := 18887
    address := "kasparov-dev-auxiliary-open-devnet.daglabs.com"
elif [[ $1 == 'big.devnet' ]]
then
    port := 18989
    dbport := 18988
    address := "kasparov-dev-auxiliary-big.daglabs.com"
elif [[ $1 == 'default.devnet' ]]
then
    port := 19090
    dbport := 19089
    address := "kasparov-dev-auxiliary-classic.daglabs.com"
else
    echo Please specify: mainnet, testnet, devnet, aux
    exit 0
fi

sudo docker run $2 --net host dagviz --dbport=$dbport --port=$port --kasparov=http://$address:8080 --mqtt-address=mqtt://$address:1883 --mqtt-user=user --mqtt-pass=pass

/*Para iniciar um servidor, é preciso uma porta à qual ouvir.
Esta porta será passada para o programa como variável de ambiente PORT
na hora de executar o programa.*/

require('dotenv').config()

if (!process.env.PORT)
    throw Error("Variável de ambiente PORT não informada");
const port = process.env.PORT;
const id = port

const sha = require('sha256');
const timestamp = Date.now();
const randoNumber = Math.floor((Math.random() + 10000) + 1000);
const myKey = sha(port + "" + timestamp + "" + randoNumber);

//Instanciando peer: De volta em index.js, iremos requerir a classe Peer e a instanciar, passando port no construtor.
const Peer = require("./Peer");
const peer = new Peer(port);

process.argv.slice(2).forEach(otherPeerAdress =>
    peer.connectTo(otherPeerAdress)
);

//ABRINDO PORTA
peer.onConnection = socket => {
    const message = "CONEXAO REALIZADA COM SUCESSO " + port;
    const signature = sha(message + myKey + Date.now());
    receivedMessagesSignatures.push(signature);

    const firstPayLoad = {
        signature, message
    }
    console.log(message)
};

//MANDNADO INFROMAÇÃO
process.stdin.on('data', data => {

    const message = data.toString().replace(/\n/g, "");
    const signature = sha(message + myKey + Date.now());

    receivedMessagesSignatures.push(signature);
    peer.broadcast(JSON.stringify({ id, signature, message }));

    console.log("TENTATIVA DE ENVIAR ARQUIVO")
    
    peer.sendFile();
    //console.log("-----------------------------")
});

const receivedMessagesSignatures = [myKey];

peer.onData = (socket) => {
    console.log("TENTATIVA DE RECEBER ARQUIVO")
    peer.receivedFile(socket);
};


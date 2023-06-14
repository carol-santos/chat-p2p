const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');

const directoryPath = './arquivos'


fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(files);
});

const net = require("net");

module.exports = class Peer {
    constructor(port) {
        this.port = port;
        this.connections = [];

        const server = net.createServer((socket) => {
            this.onSocketConnected(socket)
        });

        server.listen(port, () => console.log("Abrindo porta " + port))
    }

    connectTo(address) {
        if (address.split(":").length !== 2) {
            throw Error("O endereco do outro peer deve ser composto por host:port");
        }

        const [host, port] = address.split(":");
        const socket = net.createConnection({ port, host }, () =>
            this.onSocketConnected(socket));
    }

    onSocketConnected(socket) {
        this.connections.push(socket);
        this.onConnection(socket);
        socket.on('data', (data) => {
            this.onData(socket, data)
        });

        // Evento 'close' para detectar quando uma conexão é encerrada
        socket.on('close', () => {
            console.log('Conexão fechada com a porta:');
            // Lógica para lidar com a queda do peer
            this.connections = this.connections.filter(conn => {
                return conn !== socket;
            })
        });

        // Evento 'error' para detectar erros na conexão
        socket.on('error', (error) => {
            //console.log('Erro na conexão:', error);
        });
    };

    onConnection(socket) {

    }

    onData(socket, data, dataFile) {
        //console.log("recebido: ", data.toString())

    }

    broadcast(data) {
        this.connections.forEach(socket => socket.write(data))
    }

    sendFile() {
        console.log("ENVIANDO ARQUIVO")

        // Dados do arquivo a ser enviado
        //const arquivo = './arquivos/arquivoteste.pdf';
        const arquivo = './arquivos/arquivoteste.txt';

        // Ler o arquivo
        fs.readFile(arquivo, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('dados enviados:', data.length, 'bytes');

            // Loop assíncrono para enviar o arquivo para cada conexão
            const sendToConnections = async () => {
                for (const socket of this.connections) {
                    await this.sendData(socket, data);
                }
            };

            sendToConnections()
                .then(() => {
                    console.log('Arquivo enviado para todas as conexões');
                })
                .catch((err) => {
                    console.error('Erro ao enviar arquivo:', err);
                });
        });
    }

    receivedFile(socket) {
        console.log("RECEBENDO ARQUIVO")

        // Criar um fluxo de gravação para salvar o arquivo recebido
        //const arquivoRecebido = fs.createWriteStream('./arquivos/recebido/arquivo_recebido.pdf');
        const arquivoRecebido = fs.createWriteStream('./arquivos/recebido/arquivo_recebido.txt');
        const filePath = './arquivos/recebido/arquivo_recebido.txt';

        // Receber os dados do arquivo
        socket.on('data', (data) => {
            console.log('dados recebidos:', data.length, 'bytes');

            // Escrever os dados recebidos no fluxo de gravação

            fs.writeFile(filePath, data, (err) => {
                if (err) {
                    console.error('Erro ao escrever o arquivo:', err);
                    return;
                }

                console.log('Arquivo escrito com sucesso:', filePath);
            });


            arquivoRecebido.on('finish', () => {
                console.log('Arquivo salvo com sucesso:', filePath);
                arquivoRecebido.end();
            });

            arquivoRecebido.on('error', (err) => {
                console.error('Erro ao gravar o arquivo:', err);
                arquivoRecebido.end();
            });
        });
        arquivoRecebido.end();

        // Lidar com eventos de fechamento da conexão
        socket.on('error', () => {
            //console.error(err);
            socket.end();
            arquivoRecebido.end();
            console.log('Arquivo recebido com sucesso no END');

            // Verificar se o arquivo foi gravado corretamente
            fs.stat('./arquivos/recebido/arquivo_recebido.txt', (err, stats) => {
                if (err) {
                    console.error('Erro ao verificar o arquivo recebido:', err);
                    return;
                }
                console.log('Tamanho do arquivo recebido:', stats.size, 'bytes');
            });
        });

        /*socket.on('error', (err) => {
            console.error(err);
            socket.end();
        });*/
    }

    sendData(socket, data) {
        return new Promise((resolve, reject) => {
            socket.write(data, 'binary', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

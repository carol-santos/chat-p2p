const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');

//Ler o conteúdo de um diretório especificado.
const directoryPath = './arquivos'
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(files);
});

//O módulo net fornece uma API para criar servidores TCP/IP e estabelecer conexões de socket.
const net = require("net");

/*usaremos module.exports para expor nossa classe Peer, com um método construtor
que recebe a nossa porta.*/
module.exports = class Peer {
    constructor(port) {
        this.port = port;

        /*Também devemos iniciar aqui nosso array connections,
        que guardará todas as conexões do nosso peer.*/
        this.connections = [];

        /*Ainda dentro do construtor, utilizaremos net.createServer,
        uma função fábrica que instancia um objeto net.Server.*/
        const server = net.createServer((socket) => {
            this.onSocketConnected(socket)
        });

        //Em seguida, faremos nosso objeto server escutar à nossa porta, com o método listen.
        server.listen(port, () => console.log("Abrindo porta " + port))
    }

    /*o método connectTo recebe o endereço ao qual se conectar.
    Em primeiro momento, testaremos se o endereço passado está no formato correto host:porta.*/
    connectTo(address) {
        if (address.split(":").length !== 2) {
            throw Error("O endereco do outro peer deve ser composto por host:port");
        }

        //Em seguida, obteremos host e porta por meio de um split.
        const [host, port] = address.split(":");
        /*E criaremos uma conexão utilizando a função net.createConnection.
        Esta é outra função fábrica do módulo net. */
        const socket = net.createConnection({ port, host }, () =>
            this.onSocketConnected(socket));
    }

    /*método onSocketConnected, o qual lidará com estes sockets da mesma forma,
    ignorando suas origens. */
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

    // enviar dados para os peers
    broadcast(data) {
        this.connections.forEach(socket => socket.write(data))
    }

    //metodo para enviar os dados
    sendFile() {
        console.log("ENVIANDO ARQUIVO")

        // Dados do arquivo a ser enviado
        //const arquivo = './arquivos/arquivoteste.jpeg';
        //const arquivo = './arquivos/arquivoteste.pdf';
        //const arquivo = './arquivos/arquivoteste.txt';
        const arquivo = './arquivos/arquivoteste.mp3';

        // Ler o arquivo
        fs.readFile(arquivo, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            //console.log('dados enviados:', data.length, 'bytes');

            // Loop assíncrono para enviar o arquivo para cada conexão
            const sendToConnections = async () => {
                for (const socket of this.connections) {
                    await this.sendData(socket, data, data.length);
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

    //metodo para receber os dados
    receivedFile(socket) {
        console.log("RECEBENDO ARQUIVO");
        socket.setMaxListeners(15);

        //const filePath = './arquivos/recebido/arquivo_recebido.pdf';
        //const filePath = './arquivos/recebido/arquivo_recebido.jpeg';
        //const filePath = './arquivos/recebido/arquivo_recebido.txt';
        const filePath = './arquivos/recebido/arquivo_recebido.mp3';

        //saber se o arquivo existe ou não
        fs.stat(filePath, (err, stats) => {
            if (err) {
                // O arquivo não existe, pode ser criado.
                const arquivoRecebido = fs.createWriteStream(filePath);

                socket.on('data', (data) => {
                    //console.log('dados recebidos:', data.length, 'bytes');

                    // Escrever os dados recebidos no fluxo de gravação
                    fs.writeFile(filePath, data, { flag: 'a' }, (err) => {
                        if (err) {
                            console.error('Erro ao editar o arquivo:', err);
                            return;
                        }

                        //console.log('Arquivo EDITADO com sucesso:', filePath, ' com tamanho: ', data.length);
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

                /*socket.on('error', (err) => {
                    console.error("Conexao encerrada");
                    socket.end();
                });*/

                socket.on('end', () => {
                    // Verificar se o arquivo foi gravado corretamente
                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            console.error('Erro ao verificar o arquivo recebido:', err);
                            return;
                        }
                        //console.log('Tamanho do arquivo recebido:', stats.size, 'bytes');
                    });
                });
            } else {
                // O arquivo já existe, pode ser editado
                const arquivoRecebido = fs.createWriteStream(filePath, { flags: 'a' });

                socket.on('data', (data) => {
                    //console.log('dados recebidos:', data.length, 'bytes');

                    // Escrever os dados recebidos no fluxo de gravação
                    fs.writeFile(filePath, data, { flag: 'a' }, (err) => {
                        if (err) {
                            console.error('Erro ao editar o arquivo:', err);
                            return;
                        }

                        //console.log('Arquivo EDITADO com sucesso:', filePath, ' com tamanho: ', data.length);
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

                /*socket.on('error', (err) => {
                    console.error("Conexao encerrada");
                    socket.end();
                });*/

                socket.on('end', () => {
                    console.log('Arquivo recebido com sucesso no END');

                    // Verificar se o arquivo foi gravado corretamente
                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            console.error('Erro ao verificar o arquivo recebido:', err);
                            return;
                        }
                        //console.log('Tamanho do arquivo recebido:', stats.size, 'bytes');
                    });
                });
            }
        });
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







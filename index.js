// Charger les variables d'environnement
require('dotenv').config();

// Vérifier que RPC_URL est défini
const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
    console.error('Please set RPC_URL in the .env file');
    process.exit(1);
}

// Importer ethers pour interagir avec Ethereum
const { ethers } = require('ethers');

const websocketUrl = "wss://arb-sepolia.g.alchemy.com/v2/gukLza792XY7s8INNeEvbGZf14YXNTzy";  // URL WebSocket Infura pour Holesky

// Configurer le fournisseur Ethereum
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Adresse et ABI du contrat EntryPoint
const entryPointAddress = "0x0000000071727de22e5e9d8baf0edac6f37da032"; // Remplacez par l'adresse réelle
const userOperationEventTopic = "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f"; // Topic de l'événement
const entryPointAbi = [
    "event UserOperationEvent(bytes32 userOpHash, address sender, address paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)"
];

// Interface pour structurer les données d'événements
class UserOperationEvent {
    constructor(userOpHash, sender, paymaster, nonce, success, actualGasCost, actualGasUsed) {
        this.userOpHash = userOpHash;
        this.sender = sender;
        this.paymaster = paymaster;
        this.nonce = BigInt(nonce);
        this.success = success;
        this.actualGasCost = BigInt(actualGasCost);
        this.actualGasUsed = BigInt(actualGasUsed);
    }
}

// Fonction pour écouter l'événement
async function listenToEvents() {
    // Créer une connexion WebSocket à Ethereum
    const provider = new ethers.WebSocketProvider(websocketUrl);

    // Vérifier que le contrat existe sur Holesky
    const code = await provider.getCode(entryPointAddress);
    if (code === "0x") {
        console.error("Aucun contrat trouvé à cette adresse sur Holesky !");
        return;
    }

    console.log("Connexion WebSocket établie, écoute des événements...");

    // Créer un filtre pour écouter les événements UserOperationEvent
    provider.on(
        {
            address: entryPointAddress,  // Adresse du contrat
            topics: [userOperationEventTopic],  // Topic spécifique de l'événement
        },
        (log) => {
            console.log("Événement UserOperationEvent détecté :", log);
            // Ici, vous pouvez traiter le log, par exemple extraire les informations de l'événement
        }
    );
}

// Fonction pour récupérer les événements historiques
async function fetchHistoricalEvents(startBlock) {
    const provider = new ethers.JsonRpcProvider(RPC_URL); // Utiliser JsonRpcProvider pour récupérer les logs
    const filter = {
        address: entryPointAddress,
        topics: [userOperationEventTopic],
    };

    const latestBlock = await provider.getBlockNumber();
    const blockRange = 2000; // Limite de 2000 blocs
    let fromBlock = startBlock;

    while (fromBlock <= latestBlock) {
        const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock); // Calculer le bloc de fin

        const currentFilter = {
            ...filter,
            fromBlock: fromBlock,
            toBlock: toBlock,
        };

        try {
            const logs = await provider.getLogs(currentFilter);
            for (const log of logs) {
                console.log("Événement historique détecté :", log);
                // await saveEventToDatabase(log); // Sauvegarder l'événement
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des événements historiques :", error);
        }

        fromBlock += blockRange; // Passer au prochain bloc de départ
    }
}

// Appel de la fonction avec un bloc de départ (par exemple, 0 pour commencer depuis le début)
fetchHistoricalEvents(106430000);

// listenToEvents()
const mongoose = require('mongoose');

// Vérifier que MONGODB_URI est défini
if (!process.env.MONGODB_URI) {
    console.error("Erreur : MONGODB_URI n'est pas défini dans les variables d'environnement.");
    process.exit(1);
}

// Connexion à la base de données MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connexion à la base de données réussie"))
    .catch(err => console.error("Erreur de connexion à la base de données :", err));

// Définir un modèle pour les événements
const eventSchema = new mongoose.Schema({
    userOpHash: String,
    sender: String,
    paymaster: String,
    nonce: mongoose.Schema.Types.BigInt,
    success: Boolean,
    actualGasCost: mongoose.Schema.Types.BigInt,
    actualGasUsed: mongoose.Schema.Types.BigInt,
    timestamp: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Fonction pour sauvegarder les événements dans la base de données
async function saveEventToDatabase(event) {
    const userOperationEvent = new Event({
        userOpHash: event.transactionHash,
        sender: event.topics[1],
        paymaster: event.topics[2],
        nonce: BigInt(event.data.slice(0, 66)),
        success: true,
        actualGasCost: BigInt("0x" + event.data.slice(66, 130)),
        actualGasUsed: BigInt("0x" + event.data.slice(130, 194)),
    });

    try {
        await userOperationEvent.save();
        console.log("Événement sauvegardé dans la base de données :", userOperationEvent);
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'événement :", error);
    }
}

// Fonction pour requêter les événements par userOpHash
async function getEventsByUserOpHash(userOpHash) {
    return await Event.find({ userOpHash });
}

// Fonction pour requêter les événements par sender
async function getEventsBySender(sender) {
    return await Event.find({ sender });
}

// Fonction pour requêter les événements par paymaster
async function getEventsByPaymaster(paymaster) {
    return await Event.find({ paymaster });
}

// Fonction pour requêter les événements par plage de blocs
async function getEventsByBlockRange(fromBlock, toBlock) {
    return await Event.find({
        blockNumber: { $gte: fromBlock, $lte: toBlock }
    });
}

// Fonction pour requêter les événements par statut (success)
async function getEventsBySuccess(success) {
    return await Event.find({ success });
}

// Exporter les fonctions
module.exports = {
    saveEventToDatabase,
    getEventsByUserOpHash,
    getEventsBySender,
    getEventsByPaymaster,
    getEventsByBlockRange,
    getEventsBySuccess
}; 
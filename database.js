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
    // Extracting the necessary properties from the event log
    const userOperationEvent = new Event({
        userOpHash: event.transactionHash, // Use transactionHash as userOpHash
        sender: event.topics[1], // Assuming the sender is in the second topic
        paymaster: event.topics[2], // Assuming the paymaster is in the third topic
        nonce: BigInt(event.data.slice(0, 66)), // Extract nonce from data (adjust as necessary)
        success: true, // Set success based on your logic
        actualGasCost: BigInt("0x" + event.data.slice(66, 130)), // Convert to BigInt with 0x prefix
        actualGasUsed: BigInt("0x" + event.data.slice(130, 194)), // Convert to BigInt with 0x prefix
    });

    try {
        await userOperationEvent.save();
        console.log("Événement sauvegardé dans la base de données :", userOperationEvent);
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'événement :", error);
    }
}

module.exports = { saveEventToDatabase }; 
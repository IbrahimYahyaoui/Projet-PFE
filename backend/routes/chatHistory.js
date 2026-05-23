const express     = require("express");
const router      = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const ChatHistory = require("../schemas/chatHistory");

// GET — toutes les conversations de l'utilisateur (titres seulement)
router.get("/", verifyToken, async (req, res) => {
  try {
    const histories = await ChatHistory.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select("title updatedAt createdAt");
    res.json(histories);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement historique" });
  }
});

// GET — une conversation précise avec tous ses messages
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!history) return res.status(404).json({ error: "Conversation non trouvée" });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement conversation" });
  }
});

// POST — créer une nouvelle conversation
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const history = await ChatHistory.create({
      userId:   req.user.id,
      title:    title || "Nouvelle conversation",
      messages: messages || [],
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Erreur création conversation" });
  }
});

// PUT — mettre à jour une conversation existante
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { messages, title } = req.body;
    const history = await ChatHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { messages, ...(title && { title }) },
      { new: true }
    );
    if (!history) return res.status(404).json({ error: "Conversation non trouvée" });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Erreur mise à jour" });
  }
});

// DELETE — supprimer une conversation
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Conversation supprimée" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression" });
  }
});

module.exports = router;
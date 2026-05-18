// src/backend/server.ts
// Backend Express + MongoDB conforme au TP Slide 49
// Utilise les types stricts, async/await et les bonnes pratiques Node/Express

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

// 🔌 Connexion MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/book-tracker";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté avec succès"))
  .catch(err => console.error("❌ Erreur connexion MongoDB:", err));

// 📐 Schéma Mongoose (mapping de la classe Book vers la DB)
const bookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  totalPages: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["Read", "Re-read", "DNF", "Currently reading", "Returned Unread", "Want to read"], required: true },
  price: { type: Number, required: true, min: 0 },
  pagesRead: { type: Number, required: true, min: 0 },
  format: { type: String, enum: ["Print", "PDF", "Ebook", "AudioBook"], required: true },
  suggestedBy: { type: String, required: true },
  // Slide 49: finished vaut 0 par défaut, passe à 1 automatiquement si pagesRead == totalPages
  finished: { type: Number, default: 0, min: 0, max: 1 }
}, { timestamps: true });

// Middleware Mongoose pour maintenir la cohérence finished/pagesRead avant chaque sauvegarde
bookSchema.pre("save", async function () {
  this.finished = this.pagesRead === this.totalPages ? 1 : 0;
})

const BookModel = mongoose.model("Book", bookSchema);

// ⚙️ Configuration Express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Autorise les requêtes frontend
app.use(express.json()); // Parse le body des requêtes POST/PUT
app.use(express.static(path.join(__dirname, "../../public"))); // Sert le frontend

// 📦 GET: Récupérer tous les livres
app.get("/api/books", async (_req: Request, res: Response): Promise<void> => {
  try {
    const books = await BookModel.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des livres" });
  }
});

// ➕ POST: Ajouter un livre
app.post("/api/books", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, author, totalPages, status, price, pagesRead, format, suggestedBy } = req.body;
    
    // Génération d'un ID unique simple
    const newBook = new BookModel({
      id: `book_${Date.now()}`,
      title, author, totalPages, status, price,
      pagesRead: pagesRead || 0,
      format, suggestedBy,
      finished: 0 // Sera recalculé par le middleware pre-save
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ error: "Données invalides ou livre non conforme" });
  }
});

// 📝 PUT: Mettre à jour la progression de lecture
app.put("/api/books/:id/progress", async (req: Request, res: Response): Promise<void> => {
  const { pagesRead } = req.body;
  try {
    const book = await BookModel.findOne({ id: req.params.id });
    if (!book) {
      res.status(404).json({ error: "Livre introuvable" });
      return;
    }

    // Validation stricte
    if (typeof pagesRead !== "number" || pagesRead < 0 || pagesRead > book.totalPages) {
      res.status(400).json({ error: "Le nombre de pages lues doit être compris entre 0 et totalPages" });
      return;
    }

    book.pagesRead = pagesRead;
    await book.save(); // Le middleware pre-save mettra à jour finished automatiquement
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// 🗑️ DELETE: Supprimer un livre
app.delete("/api/books/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await BookModel.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Livre introuvable" });
      return;
    }
    res.json({ message: "Livre supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});
app.use("/js", express.static(path.join(__dirname, "../frontend")));
// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`🌍 Serveur lancé sur http://localhost:${PORT}`);
});

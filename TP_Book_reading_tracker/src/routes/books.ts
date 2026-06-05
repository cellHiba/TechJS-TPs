import { Router, Request, Response } from "express";
import { BookModel, BookStatus, BookFormat } from "../models/book";

const router = Router();

// ─── GET /api/books ───────────────────────────────────────────────────────────
// Récupère tous les livres
router.get("/", async (_req: Request, res: Response) => {
  try {
    const books = await BookModel.find().sort({ createdAt: -1 });

    // Calcul des statistiques globales
    const totalBooks = books.length;
    const totalPagesRead = books.reduce((acc, b) => acc + b.pagesRead, 0);
    const finishedBooks = books.filter((b) => b.finished).length;

    res.json({
      books,
      stats: {
        totalBooks,
        totalPagesRead,
        finishedBooks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ─── POST /api/books ──────────────────────────────────────────────────────────
// Crée un nouveau livre
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      pages,
      status,
      price,
      pagesRead,
      format,
      suggestedBy,
    } = req.body;

    // Validation de base
    if (!title || !author || !pages || !status || !format || !suggestedBy) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    if (!Object.values(BookStatus).includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    if (!Object.values(BookFormat).includes(format)) {
      return res.status(400).json({ message: "Format invalide" });
    }

    const parsedPagesRead = pagesRead ?? 0;
    if (parsedPagesRead > pages) {
      return res.status(400).json({
        message: "Les pages lues ne peuvent pas dépasser le total de pages",
      });
    }

    const book = new BookModel({
      title,
      author,
      pages: Number(pages),
      status,
      price: Number(price),
      pagesRead: Number(parsedPagesRead),
      format,
      suggestedBy,
      finished: Number(parsedPagesRead) >= Number(pages),
    });

    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ─── PATCH /api/books/:id ─────────────────────────────────────────────────────
// Met à jour un livre (ex: avancer les pages lues)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const book = await BookModel.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Vérification pages lues
    const newPagesRead = updates.pagesRead ?? book.pagesRead;
    const totalPages = updates.pages ?? book.pages;
    if (newPagesRead > totalPages) {
      return res.status(400).json({
        message: "Les pages lues ne peuvent pas dépasser le total",
      });
    }

    // Mise à jour + recalcul de finished
    Object.assign(book, updates);
    book.finished = book.pagesRead >= book.pages;
    await book.save();

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ─── DELETE /api/books/:id ────────────────────────────────────────────────────
// Supprime un livre en utilisant la méthode deleteBook() de la classe
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const book = await BookModel.findById(id);

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Utilisation de la méthode de classe deleteBook()
    await book.deleteBook();

    res.json({ message: "Livre supprimé avec succès", id });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

export default router;

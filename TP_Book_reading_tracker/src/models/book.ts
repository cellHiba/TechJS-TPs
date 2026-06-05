import { Schema, model, Document } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum BookStatus {
  Read = "Read",
  Reread = "Re-read",
  DNF = "DNF",
  CurrentlyReading = "Currently reading",
  ReturnedUnread = "Returned Unread",
  WantToRead = "Want to read",
}

export enum BookFormat {
  Print = "Print",
  PDF = "PDF",
  Ebook = "Ebook",
  AudioBook = "AudioBook",
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IBook extends Document {
  title: string;
  author: string;
  pages: number;
  status: BookStatus;
  price: number;
  pagesRead: number;
  format: BookFormat;
  suggestedBy: string;
  finished: boolean;
  currentlyAt(): number;
  deleteBook(): Promise<void>;
}

// ─── Classe Book ──────────────────────────────────────────────────────────────

export class Book {
  title: string;
  author: string;
  pages: number;
  status: BookStatus;
  price: number;
  pagesRead: number;
  format: BookFormat;
  suggestedBy: string;
  finished: boolean;

  constructor(
    title: string,
    author: string,
    pages: number,
    status: BookStatus,
    price: number,
    pagesRead: number,
    format: BookFormat,
    suggestedBy: string
  ) {
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.status = status;
    this.price = price;
    this.pagesRead = pagesRead;
    this.format = format;
    this.suggestedBy = suggestedBy;
    // finished est automatiquement true si pagesRead === pages
    this.finished = pagesRead >= pages;
  }

  /**
   * Retourne le pourcentage de lecture (0 à 100)
   */
  currentlyAt(): number {
    if (this.pages === 0) return 0;
    return Math.min(Math.round((this.pagesRead / this.pages) * 100), 100);
  }

  /**
   * Supprime le livre de la base de données via son id Mongoose
   */
  async deleteBook(id: string): Promise<void> {
    await BookModel.findByIdAndDelete(id);
  }
}

// ─── Mongoose Schema ──────────────────────────────────────────────────────────

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    pages: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(BookStatus),
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    pagesRead: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    format: {
      type: String,
      enum: Object.values(BookFormat),
      required: true,
    },
    suggestedBy: { type: String, required: true, trim: true },
    finished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Middleware pre-save : met à jour finished automatiquement
bookSchema.pre("save", function (next) {
  this.finished = this.pagesRead >= this.pages;
  next();
});

// Middleware pre-findOneAndUpdate : met à jour finished automatiquement
bookSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as Partial<IBook>;
  if (update.pagesRead !== undefined && update.pages !== undefined) {
    update.finished = update.pagesRead >= update.pages;
  }
  next();
});

// Méthode d'instance : currentlyAt()
bookSchema.methods.currentlyAt = function (): number {
  if (this.pages === 0) return 0;
  return Math.min(Math.round((this.pagesRead / this.pages) * 100), 100);
};

// Méthode d'instance : deleteBook()
bookSchema.methods.deleteBook = async function (): Promise<void> {
  await this.deleteOne();
};

export const BookModel = model<IBook>("Book", bookSchema);

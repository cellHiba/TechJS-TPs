"use strict";
// src/models/Book.ts
// Module autonome regroupant la logique métier du livre
// Conforme au TP Slide 49 & aux concepts du cours (Slides 17, 41, 44)
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = exports.BookFormat = exports.BookStatus = void 0;
/**
 * Enum de type String (Slide 17)
 * Remplace les "magic strings" et garantit que seules les valeurs autorisées sont utilisées.
 */
var BookStatus;
(function (BookStatus) {
    BookStatus["Read"] = "Read";
    BookStatus["ReRead"] = "Re-read";
    BookStatus["DNF"] = "DNF";
    BookStatus["CurrentlyReading"] = "Currently reading";
    BookStatus["ReturnedUnread"] = "Returned Unread";
    BookStatus["WantToRead"] = "Want to read";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
var BookFormat;
(function (BookFormat) {
    BookFormat["Print"] = "Print";
    BookFormat["PDF"] = "PDF";
    BookFormat["Ebook"] = "Ebook";
    BookFormat["AudioBook"] = "AudioBook";
})(BookFormat || (exports.BookFormat = BookFormat = {}));
/**
 * Classe Book (Slide 41)
 * Utilisation des "Parameter Properties" pour déclarer et initialiser
 * automatiquement les attributs via le constructeur.
 */
class Book {
    // Typage strict : finished est un état 0/1 comme demandé, 
    // mais on utilise le type union 0 | 1 pour la sécurité TypeScript.
    constructor(id, title, author, totalPages, status, price, pagesRead, format, suggestedBy, finished = 0) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.totalPages = totalPages;
        this.status = status;
        this.price = price;
        this.pagesRead = pagesRead;
        this.format = format;
        this.suggestedBy = suggestedBy;
        this.finished = finished;
        this.validateInitialization();
    }
    /** Validation à l'instanciation et application de la règle finished */
    validateInitialization() {
        if (this.totalPages <= 0) {
            throw new Error("totalPages must be greater than 0");
        }
        if (this.pagesRead < 0 || this.pagesRead > this.totalPages) {
            throw new Error("pagesRead must be between 0 and totalPages");
        }
        // Slide 49: "finished value will change to 1 automatically when pages read == pages total"
        if (this.pagesRead === this.totalPages) {
            this.finished = 1;
        }
    }
    /**
     * Méthode exigée : Met à jour la progression de lecture
     * Recalcule automatiquement l'attribut finished.
     */
    currentlyAt(newPagesRead) {
        if (newPagesRead < 0 || newPagesRead > this.totalPages) {
            throw new Error("Invalid progress: cannot exceed totalPages or be negative");
        }
        this.pagesRead = newPagesRead;
        this.finished = this.pagesRead === this.totalPages ? 1 : 0;
    }
    /**
     * Méthode exigée : Prépare la suppression du livre
     * Retourne l'identifiant pour que la couche API/DB puisse exécuter la suppression.
     */
    deleteBook() {
        console.log(`🗑️ Book "${this.title}" (ID: ${this.id}) marked for deletion.`);
        return this.id;
    }
    /** Méthode utilitaire pour l'affichage frontend */
    getProgressPercentage() {
        return this.totalPages > 0 ? Math.round((this.pagesRead / this.totalPages) * 100) : 0;
    }
}
exports.Book = Book;

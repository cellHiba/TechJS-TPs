// src/models/Book.ts
// Module autonome regroupant la logique métier du livre
// Conforme au TP Slide 49 & aux concepts du cours (Slides 17, 41, 44)

/**
 * Enum de type String (Slide 17)
 * Remplace les "magic strings" et garantit que seules les valeurs autorisées sont utilisées.
 */
export enum BookStatus {
  Read = "Read",
  ReRead = "Re-read",
  DNF = "DNF",
  CurrentlyReading = "Currently reading",
  ReturnedUnread = "Returned Unread",
  WantToRead = "Want to read"
}

export enum BookFormat {
  Print = "Print",
  PDF = "PDF",
  Ebook = "Ebook",
  AudioBook = "AudioBook"
}

/**
 * Classe Book (Slide 41)
 * Utilisation des "Parameter Properties" pour déclarer et initialiser
 * automatiquement les attributs via le constructeur.
 */
export class Book {
  // Typage strict : finished est un état 0/1 comme demandé, 
  // mais on utilise le type union 0 | 1 pour la sécurité TypeScript.
  constructor(
    public readonly id: string,
    public title: string,
    public author: string,
    public totalPages: number,
    public status: BookStatus,
    public price: number,
    public pagesRead: number,
    public format: BookFormat,
    public suggestedBy: string,
    public finished: 0 | 1 = 0
  ) {
    this.validateInitialization();
  }

  /** Validation à l'instanciation et application de la règle finished */
  private validateInitialization(): void {
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
  public currentlyAt(newPagesRead: number): void {
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
  public deleteBook(): string {
    console.log(`🗑️ Book "${this.title}" (ID: ${this.id}) marked for deletion.`);
    return this.id;
  }

  /** Méthode utilitaire pour l'affichage frontend */
  public getProgressPercentage(): number {
    return this.totalPages > 0 ? Math.round((this.pagesRead / this.totalPages) * 100) : 0;
  }
}
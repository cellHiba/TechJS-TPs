"use strict";
// src/frontend/app.ts
// Frontend TypeScript : DOM manipulation + Fetch API + Typage strict
// Conforme au TP Slide 49
// ✅ Optimisé pour la modification manuelle des pages lues
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const API_URL = "http://localhost:3000/api/books";
// 🔍 Références DOM typées
const bookForm = document.getElementById("bookForm");
const booksList = document.getElementById("booksList");
const totalReadEl = document.getElementById("totalRead");
const totalPagesReadEl = document.getElementById("totalPagesRead");
// ---------------------------------------------------------
// 📦 1. CHARGEMENT & AFFICHAGE
// ---------------------------------------------------------
function loadBooks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(API_URL);
            const books = yield res.json();
            renderBooks(books);
            updateGlobalStats(books);
        }
        catch (err) {
            console.error("❌ Erreur chargement:", err);
            booksList.innerHTML = '<p class="text-red-500 col-span-2 text-center">Serveur inaccessible.</p>';
        }
    });
}
function updateGlobalStats(books) {
    const finishedCount = books.filter(b => b.finished === 1).length;
    const totalPages = books.reduce((sum, b) => sum + b.pagesRead, 0);
    totalReadEl.textContent = String(finishedCount);
    totalPagesReadEl.textContent = String(totalPages);
}
function renderBooks(books) {
    booksList.innerHTML = "";
    if (books.length === 0) {
        booksList.innerHTML = '<p class="text-gray-500 col-span-2 text-center py-8">Aucun livre. Ajoutez-en un ! 📚</p>';
        return;
    }
    books.forEach(book => {
        const pct = book.totalPages > 0 ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;
        const done = book.finished === 1;
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-lg shadow flex flex-col gap-3 border border-gray-100";
        // ️ L'input est EDITABLE par défaut. Pas de readonly/disabled.
        // L'attribut 'max' empêche visuellement de dépasser le total, mais reste modifiable.
        card.innerHTML = `
      <div class="flex justify-between items-start">
        <h3 class="font-bold text-lg text-gray-800">${escapeHtml(book.title)}</h3>
        <span class="text-xs font-bold px-2 py-1 rounded-full ${done ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}">
          ${done ? "✅ Terminé" : "📖 En cours"}
        </span>
      </div>
      <p class="text-sm text-gray-600">Auteur: ${escapeHtml(book.author)} • Format: ${book.format}</p>
      
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div class="bg-blue-600 h-2.5 rounded-full transition-all" style="width: ${pct}%"></div>
      </div>
      <p class="text-xs text-gray-500 text-right">${pct}% lu • ${book.pagesRead} / ${book.totalPages} pages</p>

      <!-- Zone de modification MANUELLE -->
      <div class="flex items-center gap-2 mt-2 pt-3 border-t border-gray-100">
        <input 
          type="number" 
          id="progress-${book.id}" 
          min="0" 
          max="${book.totalPages}" 
          value="${book.pagesRead}"
          class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          placeholder="Pages lues"
        />
        <button data-id="${book.id}" class="update-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium shadow">
          Update
        </button>
        <button data-id="${book.id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium shadow">
          Delete
        </button>
      </div>
    `;
        booksList.appendChild(card);
    });
}
// ---------------------------------------------------------
// 🎣 2. DÉLÉGATION D'ÉVÉNEMENTS (Gestion Update/Delete)
// ---------------------------------------------------------
function setupEventDelegation() {
    // L'écouteur est attaché UNE FOIS sur le conteneur parent
    booksList.addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
        const target = e.target;
        // ✅ ACTION UPDATE : Lit la valeur MANUELLE saisie dans l'input
        if (target.classList.contains("update-btn")) {
            const id = target.dataset.id;
            if (!id)
                return;
            // Récupération EXACTE de ce que l'utilisateur a tapé
            const input = document.getElementById(`progress-${id}`);
            let newPages = Number(input.value);
            // Validation basique
            if (isNaN(newPages) || newPages < 0) {
                alert("⚠️ Entrez un nombre de pages valide (≥ 0).");
                input.focus();
                return;
            }
            // Optionnel : Confirmation avant envoi
            if (!confirm(`Mettre à jour la progression à ${newPages} pages ?`)) {
                return; // Annulation → rien ne se passe, vous pouvez retaper
            }
            // Envoi au backend
            try {
                const res = yield fetch(`${API_URL}/${id}/progress`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pagesRead: newPages })
                });
                if (!res.ok)
                    throw new Error(`Erreur ${res.status}`);
                console.log("✅ Mise à jour appliquée");
                yield loadBooks(); // Rafraîchit l'interface avec la nouvelle valeur
            }
            catch (err) {
                console.error("❌ Échec update:", err);
                alert("Erreur lors de la mise à jour.");
            }
        }
        // ✅ ACTION DELETE
        if (target.classList.contains("delete-btn")) {
            const id = target.dataset.id;
            if (!id)
                return;
            if (confirm("🗑️ Supprimer ce livre ?")) {
                try {
                    yield fetch(`${API_URL}/${id}`, { method: "DELETE" });
                    yield loadBooks();
                }
                catch (err) {
                    console.error("❌ Échec suppression:", err);
                }
            }
        }
    }));
}
// ---------------------------------------------------------
// 📝 3. FORMULAIRE D'AJOUT
// ---------------------------------------------------------
bookForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
    e.preventDefault();
    const fd = new FormData(bookForm);
    const payload = {
        title: fd.get("title"),
        author: fd.get("author"),
        totalPages: Number(fd.get("totalPages")),
        status: fd.get("status"),
        price: Number(fd.get("price")),
        pagesRead: Number(fd.get("pagesRead")) || 0,
        format: fd.get("format"),
        suggestedBy: fd.get("suggestedBy")
    };
    try {
        yield fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        bookForm.reset();
        yield loadBooks();
    }
    catch (err) {
        console.error("❌ Erreur ajout:", err);
        alert("Impossible d'ajouter le livre.");
    }
}));
// ---------------------------------------------------------
// 🛡️ UTILITAIRES & INITIALISATION
// ---------------------------------------------------------
function escapeHtml(text) {
    if (!text)
        return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
// Démarrage
document.addEventListener("DOMContentLoaded", () => {
    setupEventDelegation(); // Attache les écouteurs une seule fois
    loadBooks(); // Charge les données
});

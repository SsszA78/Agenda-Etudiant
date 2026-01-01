// ==========================================
// 1. VARIABLES GLOBALES & SÉLECTEURS
// ==========================================
let dateReference = new Date();
let anneeActuelle = dateReference.getFullYear();
let semaineActuelle = getWeekNumber(dateReference);

const btnMenu = document.getElementById("btn-taches");
const menu = document.getElementById("menu-taches");
const liste = document.getElementById("liste-taches");
const input = document.getElementById("nouvelle-tache");
const titreSemaine = document.getElementById("titre-semaine");


// ==========================================
// 2. INITIALISATION (Au lancement)
// ==========================================
miseAJourAffichageDate();
chargerTaches();

// Gestion de l'ouverture/fermeture du menu déroulant
btnMenu.addEventListener("click", () => {
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
});


// ==========================================
// 3. GESTION DU TEMPS & NAVIGATION
// ==========================================

// Change de semaine et gère le passage d'une année à l'autre
function changerSemaine(decalage) {
    semaineActuelle += decalage;

    if (semaineActuelle > 52) {
        semaineActuelle = 1;
        anneeActuelle++;
    } else if (semaineActuelle < 1) {
        semaineActuelle = 52;
        anneeActuelle--;
    }

    miseAJourAffichageDate();
    liste.innerHTML = ""; // On vide la liste visuelle
    chargerTaches();      // On recharge les tâches de la nouvelle semaine
}

// Calcule et affiche les dates (Lundi - Dimanche) dans les titres
function miseAJourAffichageDate() {
    // 1. Trouver le Lundi de la semaine
    const lundi = new Date(anneeActuelle, 0, (semaineActuelle - 1) * 7 + 1);
    while (lundi.getDay() !== 1) {
        lundi.setDate(lundi.getDate() + 1);
    }

    // 2. Trouver le Dimanche (Lundi + 6 jours)
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);

    // 3. Formatage joli (ex: "12 janv.")
    const options = { day: 'numeric', month: 'short' };
    const dateDebut = lundi.toLocaleDateString('fr-FR', options);
    const dateFin = dimanche.toLocaleDateString('fr-FR', options);

    // 4. Mise à jour du DOM
    titreSemaine.innerText = `${dateDebut} - ${dateFin} ${anneeActuelle}`;
    const sousTitre = document.getElementById("sous-titre-date");
    if (sousTitre) {
        sousTitre.innerText = `${dateDebut} - ${dateFin} ${anneeActuelle}`;
    }
}

// Fonction mathématique pour obtenir le numéro de semaine ISO
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}


// ==========================================
// 4. GESTION DES TÂCHES (Ajout/Suppr/Coche)
// ==========================================

// Écouteur global sur la liste (Délégation d'événement)
liste.addEventListener("click", function(e) {
    // Bouton Supprimer (Croix)
    if (e.target.classList.contains("btn-supprimer")) {
        e.target.closest("li").remove();
        sauvegarderTaches();
        return;
    }
    // Clic sur la tâche (Cocher/Décocher)
    const li = e.target.closest("li");
    if (li) {
        li.classList.toggle("terminee");
        sauvegarderTaches();
    }
});

function ajouterTache() {
    const texte = input.value;
    const matiere = document.getElementById("choix-matiere").value;
    const date = document.getElementById("date-tache").value;
    const heure = document.getElementById("heure-tache").value;

    if (texte === '') return;

    creerElementHTML(texte, false, matiere, date, heure);
    input.value = ""; // On vide le champ texte
    sauvegarderTaches();
}

// Crée le HTML d'une ligne <li> et l'ajoute à la liste
function creerElementHTML(texte, estTerminee, matiere, date, heure) {
    const li = document.createElement("li");
    if (!matiere) matiere = "autre";
    if (estTerminee) li.classList.add("terminee");

    // Stockage des données dans le HTML (dataset)
    li.dataset.matiere = matiere;
    li.dataset.date = date || "";
    li.dataset.heure = heure || "";

    // Affichage formaté de la date/heure
    let infoTemps = "";
    if (date) {
        const d = new Date(date);
        infoTemps = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        if (heure) infoTemps += ` à ${heure}`;
    }

    li.innerHTML = `
        <div class="tache-contenu">
            <span class="checkbox"></span>
            <span class="badge bg-${matiere}">${matiere}</span>
            ${date ? `<span class="date-butoir">📅 ${infoTemps}</span>` : ''}
            <span class="tache-texte">${texte}</span>
        </div>
        <span class="btn-supprimer">×</span>
    `;
    liste.prepend(li);
}


// ==========================================
// 5. SAUVEGARDE & CHARGEMENT (LocalStorage)
// ==========================================

function sauvegarderTaches() {
    const tableauTaches = [];
    liste.querySelectorAll("li").forEach(li => {
        tableauTaches.push({
            texte: li.querySelector(".tache-texte").innerText,
            etat: li.classList.contains("terminee"),
            matiere: li.dataset.matiere,
            date: li.dataset.date,
            heure: li.dataset.heure
        });
    });

    // Clé de sauvegarde unique par Année + Semaine
    const nomSauvegarde = "taches_" + anneeActuelle + "_semaine_" + semaineActuelle;
    localStorage.setItem(nomSauvegarde, JSON.stringify(tableauTaches));

    mettreAJourProgression();
    afficherTachesSurEDT(); // Mise à jour du calendrier
}

function chargerTaches() {
    const nomSauvegarde = "taches_" + anneeActuelle + "_semaine_" + semaineActuelle;
    const data = localStorage.getItem(nomSauvegarde);

    liste.innerHTML = "";

    if (data) {
        const tableauTaches = JSON.parse(data);
        // On inverse pour rétablir l'ordre car on utilise prepend
        tableauTaches.reverse().forEach(t => {
            creerElementHTML(t.texte, t.etat, t.matiere, t.date, t.heure);
        });
    }

    mettreAJourProgression();
    afficherTachesSurEDT();
}


// ==========================================
// 6. FONCTIONNALITÉS AVANCÉES
// ==========================================

// Barre de progression (Calcul du pourcentage)
function mettreAJourProgression() {
    const total = liste.querySelectorAll("li").length;
    const fait = liste.querySelectorAll("li.terminee").length;
    const p = total > 0 ? Math.round((fait / total) * 100) : 0;

    const barre = document.getElementById("barre-remplissage");
    const texte = document.getElementById("texte-progression");
    if (barre && texte) {
        barre.style.width = p + "%";
        texte.innerText = p + "% effectué";
    }
}

// Affichage dynamique des blocs sur l'Emploi du Temps
function afficherTachesSurEDT() {
    const grid = document.querySelector(".planning-grid");
    // 1. Nettoyage des anciennes tâches dynamiques
    const anciennesTaches = grid.querySelectorAll(".cours-dynamique");
    anciennesTaches.forEach(el => el.remove());

    const toutesLesTaches = liste.querySelectorAll("li");

    toutesLesTaches.forEach(li => {
        const dateStr = li.dataset.date;
        const heureStr = li.dataset.heure;
        const matiere = li.dataset.matiere;
        const texte = li.querySelector(".tache-texte").innerText;

        if (!dateStr || !heureStr) return;

        // 2. Calcul de la Colonne (Jour)
        const dateObj = new Date(dateStr);
        const jourSemaine = dateObj.getDay(); // 0=Dimanche, 1=Lundi...

        let gridCol;
        if (jourSemaine === 0) {
            gridCol = 8; // Dimanche est en colonne 8
        } else {
            gridCol = jourSemaine + 1; // Lundi(1) -> col 2
        }

        // 3. Calcul de la Ligne (Heure)
        const heureChiffre = parseInt(heureStr.split(":")[0]);
        // On affiche seulement entre 8h et 18h
        if (heureChiffre < 8 || heureChiffre > 18) return;

        const gridRowStart = heureChiffre - 6; // Formule : Heure - 6
        const gridRowEnd = gridRowStart + 1;

        // 4. Création du bloc
        const div = document.createElement("div");
        div.classList.add("cours", `cours-${matiere}`, "cours-dynamique");
        div.style.gridColumn = gridCol;
        div.style.gridRow = `${gridRowStart} / ${gridRowEnd}`;

        div.innerHTML = `<strong>${matiere}</strong><br>${texte}`;
        grid.appendChild(div);
    });
}
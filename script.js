// --- VARIABLES GLOBALES ---
let dateReference = new Date();
let anneeActuelle = dateReference.getFullYear();
let semaineActuelle = getWeekNumber(dateReference);

const btnMenu = document.getElementById("btn-taches");
const menu = document.getElementById("menu-taches");
const liste = document.getElementById("liste-taches");
const input = document.getElementById("nouvelle-tache");
const titreSemaine = document.getElementById("titre-semaine");

// --- 1. INITIALISATION ---
miseAJourAffichageDate();
chargerTaches();

// Gestion ouverture/fermeture menu
btnMenu.addEventListener("click", () => {
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
});

// --- 2. GESTION DU TEMPS ---
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
    liste.innerHTML = "";
    chargerTaches();
}

function miseAJourAffichageDate() {
    // 1. Calcul du Lundi
    const lundi = new Date(anneeActuelle, 0, (semaineActuelle - 1) * 7 + 1);
    while (lundi.getDay() !== 1) {
        lundi.setDate(lundi.getDate() + 1);
    }

    // 2. Calcul du DIMANCHE (Lundi + 6 jours)
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6); // <-- Changement ici (+6 au lieu de +4)

    // 3. Formatage
    const options = { day: 'numeric', month: 'short' };
    const dateDebut = lundi.toLocaleDateString('fr-FR', options);
    const dateFin = dimanche.toLocaleDateString('fr-FR', options);

    // 4. Mises à jour des titres
    titreSemaine.innerText = `${dateDebut} - ${dateFin} ${anneeActuelle}`;
    const sousTitre = document.getElementById("sous-titre-date");
    if (sousTitre) {
        sousTitre.innerText = `${dateDebut} - ${dateFin} ${anneeActuelle}`;
    }
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// --- 3. GESTION DES CLICS ---
liste.addEventListener("click", function(e) {
    if (e.target.classList.contains("btn-supprimer")) {
        e.target.closest("li").remove();
        sauvegarderTaches();
        return;
    }
    const li = e.target.closest("li");
    if (li) {
        li.classList.toggle("terminee");
        sauvegarderTaches();
    }
});

// --- 4. AJOUT ---
function ajouterTache() {
    const texte = input.value;
    const matiere = document.getElementById("choix-matiere").value;
    const date = document.getElementById("date-tache").value;
    const heure = document.getElementById("heure-tache").value;

    if (texte === '') return;

    creerElementHTML(texte, false, matiere, date, heure);
    input.value = "";
    sauvegarderTaches();
}

// --- 5. CRÉATION HTML ---
function creerElementHTML(texte, estTerminee, matiere, date, heure) {
    const li = document.createElement("li");
    if (!matiere) matiere = "autre";
    if (estTerminee) li.classList.add("terminee");

    li.dataset.matiere = matiere;
    li.dataset.date = date || "";
    li.dataset.heure = heure || "";

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

// --- 6. SAUVEGARDE ---
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

    const nomSauvegarde = "taches_" + anneeActuelle + "_semaine_" + semaineActuelle;
    localStorage.setItem(nomSauvegarde, JSON.stringify(tableauTaches));

    mettreAJourProgression();
    afficherTachesSurEDT();
}

// --- 7. CHARGEMENT ---
function chargerTaches() {
    const nomSauvegarde = "taches_" + anneeActuelle + "_semaine_" + semaineActuelle;
    const data = localStorage.getItem(nomSauvegarde);

    liste.innerHTML = "";

    if (data) {
        const tableauTaches = JSON.parse(data);
        tableauTaches.reverse().forEach(t => {
            creerElementHTML(t.texte, t.etat, t.matiere, t.date, t.heure);
        });
    }

    mettreAJourProgression();
    afficherTachesSurEDT();
}

// --- 8. PROGRESSION ---
function mettreAJourProgression() {
    const total = liste.querySelectorAll("li").length;
    const fait = liste.querySelectorAll("li.terminee").length;
    const p = total > 0 ? Math.round((fait / total) * 100) : 0;

    const barre = document.getElementById("barre-remplissage");
    const texte = document.getElementById("texte-progression");
    if(barre && texte) {
        barre.style.width = p + "%";
        texte.innerText = p + "% effectué";
    }
}

// --- 9. AFFICHAGE SUR L'EDT (Mis à jour pour 7 jours) ---
function afficherTachesSurEDT() {
    const grid = document.querySelector(".planning-grid");
    const anciennesTaches = grid.querySelectorAll(".cours-dynamique");
    anciennesTaches.forEach(el => el.remove());

    const toutesLesTaches = liste.querySelectorAll("li");

    toutesLesTaches.forEach(li => {
        const dateStr = li.dataset.date;
        const heureStr = li.dataset.heure;
        const matiere = li.dataset.matiere;
        const texte = li.querySelector(".tache-texte").innerText;

        if (!dateStr || !heureStr) return;

        // Calcul de la colonne (Jour)
        const dateObj = new Date(dateStr);
        const jourSemaine = dateObj.getDay(); // 0=Dimanche, 1=Lundi...

        // --- LOGIQUE MISE À JOUR POUR LE WEEK-END ---
        let gridCol;

        if (jourSemaine === 0) {
            // Cas spécial : Dimanche
            // C'est la 8ème colonne (1 heure + 6 jours + Dimanche)
            gridCol = 8;
        } else {
            // Cas normal : Lundi(1) -> col 2, Samedi(6) -> col 7
            gridCol = jourSemaine + 1;
        }

        // Calcul de la ligne (Heure)
        const heureChiffre = parseInt(heureStr.split(":")[0]);
        if (heureChiffre < 8 || heureChiffre > 18) return;

        const gridRowStart = heureChiffre - 6;
        const gridRowEnd = gridRowStart + 1;

        const div = document.createElement("div");
        div.classList.add("cours", `cours-${matiere}`, "cours-dynamique");
        div.style.gridColumn = gridCol;
        div.style.gridRow = `${gridRowStart} / ${gridRowEnd}`;

        div.innerHTML = `<strong>${matiere}</strong><br>${texte}`;
        grid.appendChild(div);
    });
}
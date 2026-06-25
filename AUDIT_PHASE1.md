# AUDIT PHASE 1 — TuskFlow (rapport PFE vs code)

Audit en lecture seule. Aucun fichier de code n'a été modifié. Les findings critiques ont été
relus et vérifiés directement (lecture de fichier) avant inclusion dans ce rapport ; les autres
s'appuient sur l'exploration assistée et sont signalés comme tels si non re-vérifiés ligne à ligne.

## Tableau des 40 user stories

| US-ID | Backend conforme ? | Frontend conforme ? | Verdict | Fichier(s) concerné(s) |
|---|---|---|---|---|
| US-1.1 | Oui — login + bcrypt + compte actif | Oui — form + token | ✅ Conforme | backend/controllers/authController.js, frontend/src/pages/login.tsx |
| US-1.2 | Oui — verifyAdmin, email envoyé | Oui — dialog admin only | ✅ Conforme | backend/routes/user.js, backend/controllers/userController.js, frontend/src/pages/Users.tsx |
| US-1.3 | Oui — verifyAdmin, protège dernier admin actif | Oui — boutons + confirmation | ✅ Conforme | backend/controllers/userController.js, frontend/src/pages/Users.tsx |
| US-1.4 | Oui — données filtrées par rôle | Oui — 4 composants dashboard distincts | ✅ Conforme | frontend/src/pages/Dashboard.tsx |
| US-1.5 | N/A (frontend only) | Oui — filtrage par permission/hideForRoles | ✅ Conforme | frontend/src/components/Navbar.tsx |
| US-1.6 | Oui — middleware verifySelfOrAdmin (self ou admin) | Oui, mais fallback JWT peut produire un `_id` vide si `/api/users/me` échoue | ✅ Conforme (écart mineur robustesse) | backend/middleware (verifySelfOrAdmin), frontend/src/pages/Profile.tsx |
| US-1.7 | Oui — verifySelfOrAdmin, structure settings cohérente | Oui — sections séparées avec sauvegarde | ✅ Conforme | backend/controllers/profileController.js, frontend/src/pages/Settings.tsx |
| US-2.1 | Oui — tech explicitement rejeté (403) | Oui — route bloquée pour tech | ✅ Conforme | backend/controllers/ticketController.js (createTicket) |
| US-2.2 | Oui — getAllTickets (admin+leader), assignToTeam (admin only) | Oui | ✅ Conforme | backend/controllers/ticketController.js |
| US-2.3 | Oui — middleware `verifyTeamLeaderOfTicket` + check membership dans `assignTicket` (déjà corrigé) | Oui — UI reflète le scope backend | ✅ Conforme | backend/routes/ticket.js, backend/controllers/ticketController.js |
| US-2.4 | Oui — whitelist transitions + scope assignedTo===userId | Oui | ✅ Conforme | backend/controllers/ticketController.js (updateTicket, branche tech) |
| US-2.5 | Oui — accès scope par rôle dans addComment (déjà corrigé) | Oui | ✅ Conforme | backend/controllers/ticketController.js (addComment) |
| US-2.6 | Oui — SLA_HOURS exact (4/24/72/168), pause/reprise gérée | Oui — affichage SLA | ✅ Conforme | backend/controllers/ticketController.js |
| US-2.7 | Oui — job cron 30 min, niveaux 1/2 cohérents avec le rapport | Oui (alertes affichées) | ✅ Conforme | backend/jobs/escalationJob.js, backend/index.js |
| US-2.8 | **Non** — aucun contrôle d'accès sur l'historique d'un ticket | Frontend fait confiance au backend | 🔴 Incohérence de scope | backend/controllers/historyController.js |
| US-2.9 | Oui — filtres status/priority/category + pagination | Oui — UI de filtre complète | ✅ Conforme | backend/controllers/ticketController.js, frontend (TicketTable) |
| US-2.10 | Pas d'endpoint backend dédié — export généré côté client | Bouton visible uniquement sur page admin-only (route protégée) | 🟠 Écart mineur (architecture, pas un trou de sécurité avéré) | frontend/src/pages/AllTickets.tsx |
| Transverse 2 (workflow) | Partiel — transitions tech/leader/admin majoritairement respectées, MAIS rien n'empêche un leader de repasser un ticket `closed`→`resolved` (rapport : admin uniquement) | Cohérent avec ce que le backend autorise | 🟠 Écart mineur | backend/controllers/ticketController.js (updateTicket, bloc `status === 'closed'`) |
| US-3.1 | Oui — admin only, vérifie que `leaderId` a bien le rôle leader | Oui | ✅ Conforme | backend/controllers/teamController.js (createTeam) |
| US-3.2 | Oui — `addMember`/`removeMember` vérifient `team.leaderId === req.user.id` pour CETTE équipe précise (confirmé par lecture directe — le scope est correctement appliqué, contrairement à une première lecture trop rapide) | Le frontend ne pré-vérifie pas le scope avant d'afficher le bouton/d'appeler l'API (mais le backend bloque correctement l'action) | 🟠 Écart mineur (à vérifier si un leader peut effectivement naviguer vers la page d'une autre équipe) | backend/controllers/teamController.js, frontend/src/pages/teams/TeamMembers.tsx |
| US-3.3 | **Non** — `getTeamWorkload` ne vérifie ni le rôle ni l'appartenance à l'équipe demandée | Frontend appelle l'endpoint via `/api/team/my` pour le cas normal, mais l'endpoint `/api/team/:id/workload` reste exploitable directement par n'importe quel rôle authentifié | 🔴 Incohérence de scope | backend/controllers/teamController.js (getTeamWorkload), backend/routes/team.js |
| US-3.4 | Oui — `getTeamTickets` scope par `$or:[{leaderId},{members}]`, assignation protégée par `verifyTeamLeaderOfTicket` | Oui | ✅ Conforme | backend/controllers/teamController.js, backend/routes/ticket.js |
| US-3.5 | Oui — `getMyTeam` scope par `$or:[{leaderId},{members}]` | Oui | ✅ Conforme | backend/controllers/teamController.js (getMyTeam) |
| US-3.6 | Analytics (`/api/analytics`) correctement scopées par équipe du leader. MAIS `getTeamById` (détail d'équipe) et `getAllTeams` (liste) n'ont **aucun** contrôle de rôle — accessibles à tech/user authentifiés | Frontend n'expose ces vues qu'aux admins dans l'UI, mais rien n'empêche un appel direct à l'API | 🔴 Incohérence de scope | backend/controllers/teamController.js (getTeamById, getAllTeams) |
| US-4.1 | Oui — verifyAdmin sur la route + recheck contrôleur | Oui — bouton admin only | ✅ Conforme | backend/routes/project.js, frontend/src/pages/Projects.tsx |
| US-4.2 | Oui — middleware `verifyProjectLeader` (managerId===req.user.id, ou admin) | **Non** — bouton "Ajouter membre" affiché pour TOUT leader sur TOUTE carte projet, sans vérifier `project.managerId` (bug déjà connu) | 🔴 Incohérence de scope (déjà identifié) | frontend/src/pages/Projects.tsx (canManageMembers, ligne ~139/465) |
| US-4.3 | Oui — `verifyProjectLeader` sur create/delete task | **Non** — bouton "Add Task" du Kanban (`canManageTasks`) affiché pour tout leader sans vérifier `project.managerId` (même classe de bug que 4.2, pas encore listé explicitement) | 🔴 Incohérence de scope (nouveau) | frontend/src/pages/Projects.tsx (canManageTasks, ligne ~138/619) |
| US-4.4 | Oui — scope strict `assignedTo===userId` + statut uniquement | Oui — fix déjà appliqué dans ProjectDetail.tsx (ownership + res.ok + drag désactivé) | ✅ Conforme (déjà corrigé) | backend/controllers/projectController.js, frontend/src/pages/projects/ProjectDetail.tsx |
| US-4.5 | Oui — `verifyProjectAccess` (member ou manager) | Oui | ✅ Conforme | backend/routes/project.js |
| US-4.6 | Oui — admin only, auto-ajout des membres d'équipe si teamId fourni | Oui — sélecteur équipe admin only | ✅ Conforme | backend/controllers/projectController.js |
| US-4.7 | Oui — verifyAdmin | Oui — bouton admin only | ✅ Conforme | backend/routes/project.js, frontend/src/pages/Projects.tsx |
| Transverse 4a (leader ne change jamais le statut) | Oui — bloc `role==='leader'` rejette explicitement tout changement de `status` | Oui — champ statut en lecture seule pour leader dans le drawer | ✅ Conforme | backend/controllers/projectController.js, frontend/src/pages/projects/ProjectDetail.tsx |
| Transverse 4b (user aucun accès projets) | Oui — `role==='user'` reçoit `[]` | Oui — `canSeeProjects=false`, route bloquée | ✅ Conforme | backend/controllers/projectController.js, frontend/src/theme.ts, frontend/src/App.tsx |
| US-5.1 | Oui — verifyToken seul, accessible à tous rôles | Oui | ✅ Conforme | backend/routes/IA.js, frontend/src/pages/AIAssistant.tsx |
| US-5.2 | Oui — `createTicket` rejette explicitement role='tech' | Oui — blocage UI identique côté IA | ✅ Conforme | backend/controllers/ticketController.js, frontend/src/pages/AIAssistant.tsx |
| US-5.3 | Oui — verifyAdmin sur la route | Oui — route protégée par permission admin only | ✅ Conforme | backend/routes/IA.js, frontend/src/pages/CompanyContext.tsx |
| US-5.4 | Oui — toutes les routes chatHistory filtrent par `userId: req.user.id` (y compris get/update/delete by id, empêchant l'IDOR) | Oui | ✅ Conforme | backend/routes/chatHistory.js |
| US-5.5 | Oui — middleware dédié (rôle admin/leader) sur la création | Oui — bouton conditionné au même rôle | ✅ Conforme | backend/routes/knowledgeBase.js, frontend/src/pages/KnowledgeBase.tsx |
| US-5.6 | `getAllArticles`/`search`/`suggestions` filtrent bien par `buildVisibilityFilter`. MAIS **`searchKnowledge` (module IA)** interroge `KnowledgeBase.find` SANS filtre de visibilité — fuite d'articles non publiés / hors rôle / hors équipe via l'assistant IA (confirmé par lecture directe) | Frontend ne contrôle pas cette route (appelée côté IA) | 🔴 Incohérence de scope (nouveau) | backend/controllers/IAController.js (searchKnowledge, ligne ~249) |
| US-5.7 | Oui — comment/react/rate scope correct (propriété vérifiée pour delete) | Oui | ✅ Conforme | backend/controllers/knowledgeBaseController.js |
| US-5.8 | Oui — `updateArticle` vérifie maintenant `createdBy===req.user.id` sauf admin (déjà corrigé) ; suppression verifyAdmin | Oui | ✅ Conforme (déjà corrigé) | backend/controllers/knowledgeBaseController.js |

**Total : 31 ✅ Conforme · 5 🟠 Écart mineur · 6 🔴 Incohérence de scope** (dont 2 déjà connus/déjà corrigés : US-2.3/2.5/4.4/5.8 ; restent 4 vrais 🔴 nouveaux + le bug US-4.2 déjà connu non corrigé + 1 nouveau de même classe US-4.3).

---

## Bugs déjà connus (mentionnés pour mémoire, détaillés dans le prompt — non re-démontrés ici)

1. `frontend/src/pages/projects/ProjectDetail.tsx` → `handleDrop` — **déjà corrigé** dans cette session (ownership check, `res.ok` check, drag désactivé visuellement).
2. `frontend/src/pages/Projects.tsx` → bouton "Ajouter un membre" (`canManageMembers = isLeader`) — **pas encore corrigé**.
3. `backend/controllers/ticketController.js` (`assignTicket`, `updateTicket` branche leader, `escalateTicket`) — **déjà corrigé** dans cette session.
4. `backend/controllers/knowledgeBaseController.js` → `updateArticle` — **déjà corrigé** dans cette session.

---

## Nouvelles incohérences trouvées (🔴, vérifiées par lecture directe du code)

### N1 — `backend/controllers/historyController.js` : aucun contrôle d'accès sur l'historique (US-2.8)
```js
const getTicketHistory = async (req, res) => {
  try {
    const history = await History.find({ ticketId: req.params.id })
      .populate('userId', 'name role')
      .sort({ createdAt: 1 });
    res.json(history);   // ← aucune vérification de rôle/scope avant de renvoyer
  } catch (error) { ... }
};
```
N'importe quel utilisateur authentifié (y compris `user`) peut lire l'historique de n'importe quel ticket en devinant/énumérant son ID, alors que `getTicketById` (même module, `ticketController.js`) applique un contrôle d'accès scope-précis sur la même donnée. Le patron correct existe déjà dans ce même projet, juste pas dans ce fichier.

### N2 — `backend/controllers/teamController.js` : `getTeamWorkload` sans contrôle (US-3.3)
```js
const getTeamWorkload = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'name email role');
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    const workload = await Promise.all(team.members.map(getMemberWorkload));
    res.json({ teamId: team._id, teamName: team.name, members: workload });
    // ← aucune vérification que req.user est admin, leader DE cette équipe, ou membre
  } catch (err) { ... }
};
```
Route : `backend/routes/team.js:22` — `router.get('/:id/workload', verifyToken, getTeamWorkload)`. Un tech ou un leader d'une autre équipe peut consulter la charge de travail nominative de n'importe quelle équipe.

### N3 — `backend/controllers/teamController.js` : `getTeamById` et `getAllTeams` sans contrôle (US-3.6)
```js
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)...   // pas de check rôle/scope
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()...                   // idem, route /all accessible à tout rôle
```
Routes : `backend/routes/team.js:19` (`/all`) et `:23` (`/:id`), toutes deux derrière `verifyToken` seul. N'importe quel rôle authentifié (y compris `user`) peut lister toutes les équipes avec leurs stats SLA/tickets et voir le détail nominatif de n'importe quelle équipe — alors que le rapport prévoit ces vues comme réservées à admin (toutes équipes) ou leader (sa propre équipe uniquement).

### N4 — `backend/controllers/IAController.js` : `searchKnowledge` sans filtre de visibilité (US-5.6)
```js
const searchKnowledge = async (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: "query is required" });
  try {
    const articles = await KnowledgeBase.find(
      { $text: { $search: query } },   // ← pas de buildVisibilityFilter(role, userId)
      { score: { $meta: 'textScore' }, title: 1, category: 1, _id: 1 }
    ).sort({ score: { $meta: 'textScore' } }).limit(3);
    res.json({ articles });
  } catch (err) { ... }
};
```
Tous les autres points d'entrée KB (`getAllArticles`, `searchArticles`, `getSuggestions`) appliquent `buildVisibilityFilter(role, userId)` ; cette route, utilisée par l'assistant IA, ne le fait pas — elle peut suggérer/citer des articles `draft` ou restreints à un rôle/équipe à un utilisateur qui n'y a normalement pas accès.

### N5 — `frontend/src/pages/Projects.tsx` : `canManageTasks` sans scope projet (US-4.3, même classe que le bug déjà connu sur `canManageMembers`)
```js
const canManageTasks = isLeader;     // ligne ~138, global, pas de scope projet
...
{kanbanProject && canManageTasks && (   // ligne ~619
  <Button ... onClick={() => setCreateTaskDialog(kanbanProject)}>Add Task</Button>
)}
```
Le bouton "Add Task" du Kanban est visible pour tout leader, quel que soit le projet sélectionné, sans vérifier `project.managerId === currentUserId`. Le backend (`verifyProjectLeader`) bloquera correctement la requête si le leader n'est pas manager de ce projet, mais l'UI est trompeuse exactement comme pour le bouton "Ajouter membre" déjà signalé.

---

## Écarts mineurs (🟠 — à signaler, pas à corriger sans validation)

- **`backend/controllers/ticketController.js` (updateTicket)** : rien n'empêche explicitement un *leader* de repasser un ticket de `closed` à `resolved` (le rapport, Tableau 2.3, réserve cette transition à l'admin). Le check actuel ne porte que sur l'entrée dans l'état `closed`, pas sur la sortie. À clarifier : faut-il restreindre cette transition spécifique à l'admin seul ?
- **`frontend/src/pages/Projects.tsx` (lignes ~538 et ~964)** : la création de tâche depuis l'onglet "Tâches" et la suppression de tâche dans le tiroir de détail sont conditionnées par `canCreate` (= `isAdmin`), alors que le backend (`verifyProjectLeader`) autorise aussi le leader manager du projet. Résultat : un leader manager légitime ne voit pas ces boutons bien que le backend l'autoriserait. C'est une incohérence *sous-permissive* (pas une fuite de sécurité) — à clarifier si c'est voulu (admin supervise, leader gère via le Kanban) avant de toucher au code.
- **`backend/controllers/teamController.js` / `frontend/src/pages/teams/TeamMembers.tsx` (US-3.2)** : le scope backend d'`addMember`/`removeMember` est correctement vérifié (`team.leaderId === req.user.id`). Le frontend ne pré-vérifie pas ce scope avant d'afficher le bouton, mais je n'ai pas trouvé de route permettant à un leader de naviguer vers la page de membres d'une équipe qui n'est pas la sienne — à confirmer avant de juger ce point exploitable.
- **`frontend/src/pages/Profile.tsx`** : en cas d'échec de `/api/users/me`, le fallback de décodage JWT peut produire un `profile._id` vide, ce qui enverrait un `PUT /api/profile/` sans ID. L'erreur est catchée côté UI ; impact limité à un message d'erreur affiché plutôt qu'à une fuite de données.
- **US-2.10 (export CSV)** : généré entièrement côté client, aucun endpoint backend dédié ni trace d'audit serveur de l'export. Pas un trou de sécurité (la page est déjà admin-only), mais un écart d'architecture par rapport à un export "officiel" côté serveur.

---

## Écarts documentaires (rapport décrit une fonctionnalité absente du code, sans bug de sécurité)

- **US-5.6 — "domaine d'expertise" du technicien pour filtrer la KB** : ce concept n'existe ni dans `backend/schemas/user.js` ni dans `backend/schemas/knowledgeBase.js`. Le filtrage réel se fait uniquement par `role` + `teamId` (via `visibility.roles` / `visibility.teamIds`). Le rapport mentionne un critère que le code n'implémente pas — à reformuler dans le rapport, ou à considérer comme une fonctionnalité non développée (à votre décision, ce n'est pas un bug).

---

**Fin de la Phase 1.** J'attends votre confirmation avant de passer à la Phase 2 (corrections).
Pour la Phase 2, en plus des corrections fermes A/B/C/D déjà spécifiées dans votre prompt (dont A, B, C sont déjà appliquées dans cette session — seul D reste à faire), les 🔴 nouveaux à corriger avec le même principe (`verifyProjectLeader`/`getTicketById` comme patron) seraient : N1, N2, N3, N4, N5 ci-dessus. Les 🟠 ne seront pas touchés sans votre feu vert explicite.

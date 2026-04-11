Voici le spec détaillé pour l'intégration GitHub Gist :

---

## Spec — Sync GitHub Gist pour TroupeManager

### Vue d'ensemble

Ajouter une couche de persistance optionnelle via GitHub Gist. Le MJ configure une fois son token, crée un Gist, partage l'URL. Les joueurs lisent en anonyme. L'écriture est réservée au MJ.

L'UX doit être simple, pour des MJs non techniques

---

### Architecture

```
src/
  services/
    gist.ts          # API GitHub Gist (fetch wrapper)
  hooks/
    useGistSync.ts   # Hook React : lecture/écriture + état de sync
  components/
    settings/
      GistSettings.tsx   # UI de configuration dans SettingsView
```

`GistSettings` s'intègre dans le `SettingsView` existant, en nouvelle section sous la réinitialisation.

---

### Modèle de données

**URL de partage**
```
https://troupe.example.com/?gist=<GIST_ID>
```
Le `GIST_ID` est lu au démarrage via `new URLSearchParams(window.location.search).get('gist')`.

**localStorage (MJ uniquement)**
```
troupe-gist-id      → string   (ex: "a1b2c3d4e5f6...")
troupe-gist-token   → string   (Personal Access Token GitHub)
```
Ces deux clés sont séparées du state campagne existant.

**Format du Gist**
Un seul fichier dans le Gist, nommé `troupe-manager.json`, contenant le `CampaignState` sérialisé. Description du Gist : `"TroupeManager — [nom de campagne]"`.

---

### `src/services/gist.ts`

Interface publique :

```typescript
interface GistFile {
  content: string;
}

interface GistResponse {
  id: string;
  files: Record<string, GistFile>;
  updated_at: string;
}

// Lire un Gist (sans token — accès anonyme)
export async function fetchGist(gistId: string): Promise<CampaignState>

// Créer un nouveau Gist (token requis)
export async function createGist(state: CampaignState, token: string): Promise<string> // retourne gistId

// Mettre à jour un Gist existant (token requis)
export async function updateGist(gistId: string, state: CampaignState, token: string): Promise<void>
```

Toutes les fonctions lèvent une `GistError` typée en cas d'échec :
```typescript
class GistError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'RATE_LIMIT' | 'NETWORK' | 'PARSE'
  ) { super(message) }
}
```

Headers systématiques :
```
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
Authorization: Bearer <token>   // uniquement si token présent
```

---

### `src/hooks/useGistSync.ts`

```typescript
type SyncStatus =
  | 'idle'
  | 'loading'      // lecture initiale en cours
  | 'saving'       // écriture en cours
  | 'synced'       // dernière op réussie
  | 'error'        // erreur, message disponible
  | 'readonly'     // gistId présent mais pas de token → lecture seule

interface UseGistSyncReturn {
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
  errorMessage: string | null
  gistId: string | null
  isReadonly: boolean
  loadFromGist: () => Promise<void>
  saveToGist: () => Promise<void>
  createAndLink: (token: string) => Promise<string>  // retourne gistId
  unlinkGist: () => void
}
```

**Comportements :**

- Au montage : si `?gist=` dans l'URL → `loadFromGist()` automatiquement, puis dispatch `LOAD_STATE`
- Si token présent en localStorage → `syncStatus = 'synced'` (mode MJ)
- Si gistId présent mais pas de token → `syncStatus = 'readonly'` (mode joueur)
- `saveToGist()` est appelé automatiquement après chaque dispatch qui modifie le state (via `useEffect` sur `state` dans `CampaignContext` ou `App`), avec un **debounce de 2 secondes**
- En mode readonly, `saveToGist()` est un no-op silencieux
- Les erreurs `RATE_LIMIT` affichent un message spécifique : "Limite GitHub atteinte, réessai dans 60s"
- Les erreurs `UNAUTHORIZED` effacent le token de localStorage et passent en readonly

---

### `src/components/settings/GistSettings.tsx`

Section dans `SettingsView`, avec trois états d'affichage :

**État A — Non configuré (pas de gistId)**
```
┌─────────────────────────────────────────────┐
│ Partage GitHub Gist                          │
│                                              │
│ Partagez votre campagne avec vos joueurs.    │
│                                              │
│ Token GitHub (scope: gist)  [___________] 👁 │
│                                              │
│ [ Créer un Gist et obtenir le lien ]         │
└─────────────────────────────────────────────┘
```
- Le champ token est `type="password"` avec toggle visibilité
- Lien vers `https://github.com/settings/tokens/new?scopes=gist` en dessous du champ
- Bouton désactivé si token vide

**État B — Configuré (MJ, token + gistId présents)**
```
┌─────────────────────────────────────────────┐
│ Partage GitHub Gist                    ✅ MJ │
│                                              │
│ Lien de partage :                            │
│ https://troupe.app/?gist=abc123  [Copier]    │
│                                              │
│ Dernière sync : il y a 3 secondes            │
│ ● Synchronisé  /  ⟳ Sauvegarde...           │
│                                              │
│ [Synchroniser maintenant]  [Déconnecter]     │
└─────────────────────────────────────────────┘
```
- L'URL de partage inclut le domaine courant (`window.location.origin`)
- "Copier" utilise `navigator.clipboard.writeText`
- Le statut de sync est animé (spinner si `saving`, checkmark si `synced`)
- "Déconnecter" supprime token + gistId du localStorage, retire `?gist` de l'URL, repasse en mode local

**État C — Lecture seule (joueur, gistId sans token)**
```
┌─────────────────────────────────────────────┐
│ Partage GitHub Gist               👁 Lecture │
│                                              │
│ Gist : abc123...                             │
│ Dernière sync : il y a 12 secondes           │
│                                              │
│ [↻ Rafraîchir]                               │
│                                              │
│ Vous êtes le MJ ? Entrez votre token :       │
│ [___________]  [Configurer]                  │
└─────────────────────────────────────────────┘
```

---

### Intégration dans `App.tsx`

```typescript
// Pseudo-code d'intégration
function AppContent() {
  const { state, dispatch } = useCampaign()
  const { syncStatus, saveToGist, loadFromGist } = useGistSync()

  // Auto-save debounced après chaque changement de state
  useEffect(() => {
    const timer = setTimeout(() => saveToGist(), 2000)
    return () => clearTimeout(timer)
  }, [state])

  // Indicateur de sync dans le header
  // ...
}
```

Un petit indicateur de statut dans le header (à droite de la date) :
- `saving` → spinner amber
- `synced` → point vert + "Sync"
- `error` → point rouge + "Erreur" (cliquable → toast avec détail)
- `readonly` → œil gris + "Lecture"
- `idle` (local uniquement) → rien

---

### Gestion des conflits

Pas de merge — **last write wins**. Le MJ est le seul à écrire. Si deux onglets MJ sont ouverts simultanément (edge case), la dernière sauvegarde gagne. Pas de détection de conflit nécessaire pour ce cas d'usage.

---

### Polling (mode joueur)

En mode readonly, polling automatique toutes les **30 secondes** via `setInterval` dans `useGistSync`. Le polling s'arrête si :
- L'onglet est en arrière-plan (`document.visibilityState === 'hidden'`)
- Une erreur `NOT_FOUND` ou `RATE_LIMIT` est reçue

---

### Tests à écrire

`src/services/gist.test.ts` :
- `fetchGist` parse correctement un `CampaignState` depuis la réponse API
- `fetchGist` lève `GistError('NOT_FOUND')` sur 404
- `fetchGist` lève `GistError('RATE_LIMIT')` sur 403 avec header `X-RateLimit-Remaining: 0`
- `createGist` retourne un gistId string sur 201
- `updateGist` appelle PATCH avec le bon body

Utiliser `vi.stubGlobal('fetch', ...)` pour mocker `fetch` dans Vitest.

---

### Points d'attention

- **Ne jamais logger le token** (ni en console, ni dans les erreurs remontées à l'UI)
- Le token est stocké en clair dans localStorage — avertir l'utilisateur dans l'UI : *"Stocké localement sur ce navigateur uniquement"*
- Le Gist est créé en **secret** par défaut (`public: false`) — non indexé, accessible uniquement par URL directe
- Valider que le JSON parsé depuis le Gist a bien la forme `CampaignState` avant le dispatch (même validation légère que dans `useLocalStorage.ts`)
- Sur `createAndLink` : mettre à jour `window.history.replaceState` pour ajouter `?gist=` dans l'URL sans recharger la page
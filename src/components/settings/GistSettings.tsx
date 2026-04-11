import { useState } from 'react';
import { useGistSyncContext } from '../../context/gistSyncContext';

function formatRelative(date: Date | null): string {
  if (!date) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return 'à l’instant';
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}

export function GistSettings() {
  const {
    syncStatus,
    lastSyncedAt,
    errorMessage,
    gistId,
    createAndLink,
    unlinkGist,
    saveToGist,
    loadFromGist,
    setTokenAndReload,
  } = useGistSyncContext();

  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  const isReadonly = syncStatus === 'readonly';
  const isConfigured = !!gistId && !isReadonly;
  const isUnconfigured = !gistId;

  const shareUrl =
    gistId && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?gist=${gistId}`
      : '';

  const handleCreate = async () => {
    if (!tokenInput.trim()) return;
    setBusy(true);
    try {
      await createAndLink(tokenInput.trim());
      setTokenInput('');
    } catch {
      // error is surfaced via sync.errorMessage
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback('Copié !');
    } catch {
      setCopyFeedback('Échec copie');
    }
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleConfigureToken = () => {
    if (!tokenInput.trim()) return;
    setTokenAndReload(tokenInput.trim());
    setTokenInput('');
  };

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-amber-400">Partage GitHub Gist</h3>
        {isConfigured && (
          <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-300 border border-green-700/60 rounded">
            MJ
          </span>
        )}
        {isReadonly && (
          <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 border border-gray-600 rounded">
            Lecture
          </span>
        )}
      </div>

      {isUnconfigured && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            Partagez votre campagne avec vos joueurs via un Gist GitHub.
          </p>
          <div className="space-y-1">
            <label className="block text-xs text-gray-400">
              Token GitHub (scope : gist)
            </label>
            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_..."
                className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer"
                aria-label={showToken ? 'Masquer le token' : 'Afficher le token'}
              >
                {showToken ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=gist&description=TroupeManager"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-block text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Créer un token GitHub →
            </a>
          </div>
          <button
            onClick={handleCreate}
            disabled={!tokenInput.trim() || busy}
            className="w-full px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
          >
            {busy ? 'Création…' : 'Créer un Gist et obtenir le lien'}
          </button>
          <p className="text-[11px] text-gray-500">
            ⚠ Le token est stocké localement sur ce navigateur uniquement.
          </p>
        </div>
      )}

      {isConfigured && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs text-gray-400">Lien de partage</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs bg-gray-900 border border-gray-700 rounded font-mono text-gray-300"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer min-w-[72px]"
              >
                {copyFeedback || 'Copier'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Dernière sync : <span className="text-gray-200">{formatRelative(lastSyncedAt)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              {syncStatus === 'saving' && (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300">Sauvegarde…</span>
                </>
              )}
              {syncStatus === 'synced' && (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-300">Synchronisé</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-300">Erreur</span>
                </>
              )}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void saveToGist()}
              className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer"
            >
              Synchroniser maintenant
            </button>
            <button
              onClick={unlinkGist}
              className="px-3 py-2 text-xs bg-red-900/60 hover:bg-red-800/80 border border-red-800/60 rounded transition-colors cursor-pointer"
            >
              Déconnecter
            </button>
          </div>
        </div>
      )}

      {isReadonly && (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              Gist : <span className="font-mono text-gray-300">{gistId?.slice(0, 8)}…</span>
            </div>
            <div>
              Dernière sync :{' '}
              <span className="text-gray-200">{formatRelative(lastSyncedAt)}</span>
            </div>
          </div>
          <button
            onClick={() => void loadFromGist()}
            className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer"
          >
            ↻ Rafraîchir
          </button>
          <div className="pt-3 border-t border-gray-700 space-y-2">
            <p className="text-xs text-gray-400">Vous êtes le MJ ? Entrez votre token :</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_..."
                className="flex-1 px-3 py-2 text-xs bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={handleConfigureToken}
                disabled={!tokenInput.trim()}
                className="px-3 py-2 text-xs bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
              >
                Configurer
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && syncStatus === 'error' && (
        <div className="text-xs text-red-300 bg-red-900/30 border border-red-800/40 rounded px-3 py-2">
          {errorMessage}
        </div>
      )}
    </section>
  );
}

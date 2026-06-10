'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  PiFolderDuotone,
  PiFolderLockDuotone,
  PiFileDuotone,
  PiHouseDuotone,
  PiCaretRightBold,
  PiPlusBold,
  PiUploadDuotone,
  PiPencilDuotone,
  PiTrashDuotone,
  PiDownloadDuotone,
  PiLockKeyDuotone,
  PiLockSimpleDuotone,
  PiSquaresFourDuotone,
  PiListDuotone,
  PiMagnifyingGlassDuotone,
  PiStarFill,
  PiStar,
  PiDotsThreeOutlineVerticalFill,
  PiEyeDuotone,
  PiCopySimpleDuotone,
  PiShareNetworkDuotone,
  PiUsersDuotone,
  PiX,
  PiArrowsOutDuotone,
  PiArrowsInDuotone,
  PiDownloadSimpleDuotone,
} from 'react-icons/pi';
import { ActionIcon, Tooltip, Modal, Input, Popover } from 'rizzui';
import FolderIcon from '@core/components/icons/folder-solid';
import PdfIcon from '@core/components/icons/pdf-solid';
import DocIcon from '@core/components/icons/doc-solid';
import ImageIcon from '@core/components/icons/image-solid';
import MusicIcon from '@core/components/icons/music-solid';
import VideoIcon from '@core/components/icons/video-solid';
import XmlIcon from '@core/components/icons/xml-solid';
import cn from '@core/utils/class-names';
import { fileManagerService, FolderListing, FolderSummary, FileItemSummary, FolderPermissions } from '@/services/file-manager';

const LOCK_STORAGE_PREFIX = 'fm_unlock_';

type FileTypeKey = 'pdf' | 'doc' | 'image' | 'video' | 'audio' | 'spreadsheet' | 'archive' | 'other';

const FILE_TYPE_LABELS: Record<FileTypeKey, string> = {
  pdf: 'PDF',
  doc: 'Document',
  image: 'Image',
  video: 'Vidéo',
  audio: 'Audio',
  spreadsheet: 'Tableur',
  archive: 'Archive',
  other: 'Autre',
};

function detectFileType(item: { mime_type?: string | null; original_filename: string }): FileTypeKey {
  const mime = (item.mime_type ?? '').toLowerCase();
  const ext = (item.original_filename.split('.').pop() ?? '').toLowerCase();
  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['mp4','webm','mov','avi','mkv'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['mp3','wav','ogg','m4a','flac'].includes(ext)) return 'audio';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['doc','docx','odt','rtf','txt'].includes(ext) || mime.includes('word') || mime === 'text/plain') return 'doc';
  if (['xls','xlsx','csv','ods'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet')) return 'spreadsheet';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return 'archive';
  return 'other';
}

function FileTypeIcon({ type, className }: { type: FileTypeKey; className?: string }) {
  const Comp = ({
    pdf: PdfIcon,
    doc: DocIcon,
    image: ImageIcon,
    video: VideoIcon,
    audio: MusicIcon,
    spreadsheet: XmlIcon,
    archive: DocIcon, // no archive icon — reuse doc
    other: DocIcon,
  } as const)[type];
  return <Comp className={className} />;
}

function formatBytes(n: number) {
  if (!n) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getStoredUnlock(folderId: number | null | undefined): string | undefined {
  if (!folderId || typeof window === 'undefined') return undefined;
  try { return sessionStorage.getItem(LOCK_STORAGE_PREFIX + folderId) ?? undefined; } catch { return undefined; }
}

function rememberUnlock(folderId: number, code: string) {
  try { sessionStorage.setItem(LOCK_STORAGE_PREFIX + folderId, code); } catch {}
}

export default function FileManagerList() {
  const router = useRouter();
  const params = useSearchParams();
  const folderId = params.get('folder') ? Number(params.get('folder')) : null;

  const [listing, setListing] = useState<FolderListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [showLockSettings, setShowLockSettings] = useState(false);
  const [shareFolder, setShareFolder] = useState<{ id: number; name: string } | null>(null);
  const [previewItem, setPreviewItem] = useState<{ item: FileItemSummary; folderId: number | null } | null>(null);
  const [filesView, setFilesView] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | FileTypeKey>('');

  // Restore last-used files view
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fileManagerFilesView');
      if (saved === 'grid' || saved === 'list') setFilesView(saved);
    } catch {}
  }, []);

  const switchFilesView = (m: 'grid' | 'list') => {
    setFilesView(m);
    try { localStorage.setItem('fileManagerFilesView', m); } catch {}
  };

  const navigate = (id: number | null) => {
    const qs = id ? `?folder=${id}` : '';
    router.push(`/file-manager${qs}`);
  };

  const load = async () => {
    setLoading(true);
    try {
      const unlock = getStoredUnlock(folderId);
      const res = await fileManagerService.list(folderId, unlock);
      if (!('ok' in res) || !res.ok) {
        // locked → show prompt
        setShowLockPrompt(true);
        setListing(null);
      } else {
        setListing(res.data);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [folderId]);

  const refresh = () => load();

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>;

  if (showLockPrompt) {
    return (
      <UnlockPrompt
        folderId={folderId!}
        onCancel={() => router.push('/file-manager')}
        onUnlock={(code) => {
          rememberUnlock(folderId!, code);
          setShowLockPrompt(false);
          load();
        }}
      />
    );
  }

  if (!listing) return null;

  return (
    <div className="space-y-4">
      {/* Toolbar: breadcrumb + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <button
            onClick={() => navigate(null)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100"
          >
            <PiHouseDuotone className="h-4 w-4" />
            Racine
          </button>
          {listing.breadcrumb.map((b) => (
            <span key={b.id} className="inline-flex items-center">
              <PiCaretRightBold className="h-3 w-3 text-gray-400" />
              <button
                onClick={() => navigate(b.id)}
                className="rounded px-2 py-1 font-medium text-gray-700 hover:bg-gray-100"
              >
                {b.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {listing.folder && (
            <Tooltip size="sm" content={listing.folder.is_locked ? 'Modifier le verrouillage' : 'Verrouiller ce dossier'} placement="top" color="invert">
              <ActionIcon variant="outline" size="sm" onClick={() => setShowLockSettings(true)}>
                <PiLockKeyDuotone className="h-4 w-4" />
              </ActionIcon>
            </Tooltip>
          )}
          {listing.folder && (
            <Tooltip size="sm" content="Partager ce dossier" placement="top" color="invert">
              <ActionIcon
                variant="outline"
                size="sm"
                onClick={() => setShareFolder({ id: listing.folder!.id, name: listing.folder!.name })}
              >
                <PiUsersDuotone className="h-4 w-4" />
              </ActionIcon>
            </Tooltip>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PiUploadDuotone className="h-4 w-4" /> Importer
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PiPlusBold className="h-4 w-4" /> Nouveau dossier
          </button>
        </div>
      </div>

      {/* Empty state */}
      {listing.folders.length === 0 && listing.items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          Ce dossier est vide. Créez un sous-dossier ou importez un fichier.
        </div>
      )}

      {/* Folders — grid of cards (Employee Sheets style) */}
      {listing.folders.length > 0 && (
        <div className="@container">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Dossiers ({listing.folders.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @3xl:grid-cols-4 @7xl:grid-cols-5">
            {listing.folders.map((f) => (
              <FolderCard
                key={f.id}
                folder={f}
                onOpen={() => navigate(f.id)}
                onShare={() => setShareFolder({ id: f.id, name: f.name })}
                onChanged={refresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files — section with search, filter, view toggle, grid/list */}
      {listing.items.length > 0 && (() => {
        const filtered = listing.items
          .filter((i) => {
            if (typeFilter && detectFileType(i) !== typeFilter) return false;
            if (search.trim()) {
              const q = search.trim().toLowerCase();
              if (!i.name.toLowerCase().includes(q) && !i.original_filename.toLowerCase().includes(q)) return false;
            }
            return true;
          })
          .slice()
          .sort((a, b) => {
            // Favorites first, then by created_at desc (stable from server)
            if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
            return 0;
          });

        return (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Fichiers ({filtered.length}{filtered.length !== listing.items.length ? `/${listing.items.length}` : ''})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <form
                  autoComplete="off"
                  onSubmit={(e) => e.preventDefault()}
                  className="relative"
                >
                  {/* Honeypot: trappe l'autofill credential de Chrome sur ce champ caché plutôt que sur la recherche */}
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, width: 1, height: 1 }}
                  />
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, width: 1, height: 1 }}
                  />
                  <PiMagnifyingGlassDuotone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    name={`fm_q_${Math.random().toString(36).slice(2, 8)}`}
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="Rechercher un fichier…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-56 rounded-lg border border-gray-300 bg-white py-1 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </form>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="">Tous les types</option>
                  {Object.entries(FILE_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                  <Tooltip size="sm" content="Vue grille" placement="top" color="invert">
                    <ActionIcon
                      size="sm"
                      variant={filesView === 'grid' ? 'solid' : 'text'}
                      onClick={() => switchFilesView('grid')}
                      className={filesView === 'grid' ? 'bg-primary text-white' : 'text-gray-600'}
                      aria-label="Vue grille"
                    >
                      <PiSquaresFourDuotone className="h-4 w-4" />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip size="sm" content="Vue tableau" placement="top" color="invert">
                    <ActionIcon
                      size="sm"
                      variant={filesView === 'list' ? 'solid' : 'text'}
                      onClick={() => switchFilesView('list')}
                      className={filesView === 'list' ? 'bg-primary text-white' : 'text-gray-600'}
                      aria-label="Vue tableau"
                    >
                      <PiListDuotone className="h-4 w-4" />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
                Aucun fichier ne correspond à ces critères.
              </div>
            ) : filesView === 'grid' ? (
              <div className="@container">
                <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3 @3xl:grid-cols-4 @7xl:grid-cols-5">
                  {filtered.map((i) => (
                    <FileCard
                      key={`fg-${i.id}`}
                      item={i}
                      folderId={listing.folder?.id ?? null}
                      onChanged={refresh}
                      onPreview={(it) => setPreviewItem({ item: it, folderId: listing.folder?.id ?? null })}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Taille</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Créé le</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((i) => (
                      <FileRow
                        key={`i-${i.id}`}
                        item={i}
                        folderId={listing.folder?.id ?? null}
                        onChanged={refresh}
                        onPreview={(it) => setPreviewItem({ item: it, folderId: listing.folder?.id ?? null })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modals */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="md">
        <CreateFolderForm
          parentId={listing.folder?.id ?? null}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); }}
        />
      </Modal>

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} size="md">
        <UploadFilesForm
          folderId={listing.folder?.id ?? null}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); refresh(); }}
        />
      </Modal>

      {listing.folder && (
        <Modal isOpen={showLockSettings} onClose={() => setShowLockSettings(false)} size="md">
          <LockSettingsForm
            folder={listing.folder}
            onClose={() => setShowLockSettings(false)}
            onChanged={() => { setShowLockSettings(false); refresh(); }}
          />
        </Modal>
      )}

      {previewItem && (
        <FilePreviewModal
          item={previewItem.item}
          folderId={previewItem.folderId}
          onClose={() => setPreviewItem(null)}
        />
      )}

      <Modal isOpen={!!shareFolder} onClose={() => setShareFolder(null)} size="md">
        {shareFolder && (
          <ShareFolderForm
            folder={shareFolder}
            onClose={() => setShareFolder(null)}
            onChanged={() => { setShareFolder(null); refresh(); }}
          />
        )}
      </Modal>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function FolderCard({ folder, onOpen, onShare, onChanged }: { folder: FolderSummary; onOpen: () => void; onShare: () => void; onChanged: () => void }) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Supprimer le dossier "${folder.name}" et tout son contenu ?`)) return;
    try {
      const unlock = folder.is_locked ? prompt('Code de déverrouillage (4 chiffres)') ?? undefined : undefined;
      await fileManagerService.deleteFolder(folder.id, unlock);
      toast.success('Dossier supprimé');
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? 'Suppression impossible');
    }
  };

  // "Size" placeholder: number of files inside (since real disk size requires aggregation).
  // Replace with backend-computed size later if needed.
  const sizeLabel = folder.children_count > 0
    ? `${folder.children_count} sous-dossier${folder.children_count !== 1 ? 's' : ''}`
    : '—';
  const filesLabel = `${folder.items_count} fichier${folder.items_count !== 1 ? 's' : ''}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative rounded-lg border border-muted bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="relative mb-4 flex h-12 w-12 items-center justify-center">
          <FolderIcon className="h-12 w-12" />
          {folder.is_locked && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow ring-2 ring-white">
              <PiLockSimpleDuotone className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip size="sm" content="Partager" placement="top" color="invert">
            <ActionIcon
              as="span"
              size="sm"
              variant="text"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onShare(); }}
            >
              <PiUsersDuotone className="h-4 w-4 text-blue-500" />
            </ActionIcon>
          </Tooltip>
          <Tooltip size="sm" content="Supprimer" placement="top" color="invert">
            <ActionIcon
              as="span"
              size="sm"
              variant="text"
              onClick={handleDelete as any}
            >
              <PiTrashDuotone className="h-4 w-4 text-red-500" />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>
      {folder.is_private && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700">
          🔒 Privé
        </span>
      )}
      <h4 className="mb-1 truncate text-sm font-medium text-gray-900">
        {folder.name}
        {folder.is_locked && <span className="ml-1 text-amber-500">🔒</span>}
      </h4>
      <ul className="flex list-inside list-disc gap-3.5">
        <li className="list-none text-sm text-gray-500">{sizeLabel}</li>
        <li className="text-sm text-gray-500">{filesLabel}</li>
      </ul>
    </button>
  );
}

// ─── Shared file actions ────────────────────────────────────────────────────

function useFileActions(item: FileItemSummary, folderId: number | null, onChanged: () => void) {
  const unlock = getStoredUnlock(folderId);

  const handleDelete = async () => {
    if (!confirm(`Supprimer le fichier "${item.name}" ?`)) return;
    try {
      await fileManagerService.deleteItem(item.id, unlock);
      toast.success('Fichier supprimé');
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? 'Suppression impossible');
    }
  };

  const handleDownload = () => {
    window.open(fileManagerService.downloadUrl(item.id, unlock), '_blank');
  };

  const handleVisualize = () => {
    window.open(fileManagerService.downloadUrl(item.id, unlock), '_blank', 'noopener');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fileManagerService.downloadUrl(item.id, unlock));
      toast.success('Lien copié dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const handleShare = async () => {
    const url = fileManagerService.downloadUrl(item.id, unlock);
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: item.name, url });
      } catch {/* user cancelled */}
    } else {
      await handleCopyLink();
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await fileManagerService.toggleFavorite(item.id, unlock);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? 'Action impossible');
    }
  };

  return { handleDelete, handleDownload, handleVisualize, handleCopyLink, handleShare, handleToggleFavorite };
}

function FavoriteStar({ active, onClick, className }: { active: boolean; onClick: (e: React.MouseEvent) => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn('text-amber-400 transition hover:text-amber-500', className)}
    >
      {active ? <PiStarFill className="h-5 w-5" /> : <PiStar className="h-5 w-5 text-gray-400" />}
    </button>
  );
}

function FileActionsMenu({
  onVisualize, onCopy, onShare, onDownload, onDelete,
}: {
  onVisualize: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <Popover placement="bottom-end">
      <Popover.Trigger>
        <ActionIcon size="sm" variant="text" aria-label="Plus d'actions">
          <PiDotsThreeOutlineVerticalFill className="h-4 w-4 text-gray-600" />
        </ActionIcon>
      </Popover.Trigger>
      <Popover.Content className="z-50 min-w-[180px] p-1.5">
        <MenuButton icon={<PiEyeDuotone />} label="Visualiser" onClick={onVisualize} />
        <MenuButton icon={<PiCopySimpleDuotone />} label="Copier le lien" onClick={onCopy} />
        <MenuButton icon={<PiShareNetworkDuotone />} label="Partager" onClick={onShare} />
        <MenuButton icon={<PiDownloadDuotone />} label="Télécharger" onClick={onDownload} />
        <div className="my-1 border-t border-gray-100" />
        <MenuButton icon={<PiTrashDuotone />} label="Supprimer" onClick={onDelete} danger />
      </Popover.Content>
    </Popover>
  );
}

function MenuButton({
  icon, label, onClick, danger = false,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      {label}
    </button>
  );
}

// ─── File row / card ────────────────────────────────────────────────────────

function FileRow({ item, folderId, onChanged, onPreview }: { item: FileItemSummary; folderId: number | null; onChanged: () => void; onPreview: (item: FileItemSummary) => void }) {
  const type = detectFileType(item);
  const a = useFileActions(item, folderId, onChanged);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 w-10">
        <FavoriteStar active={item.is_favorite} onClick={(e) => { e.stopPropagation(); a.handleToggleFavorite(); }} />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="inline-flex items-center gap-3 text-gray-900 hover:text-blue-600"
        >
          <FileTypeIcon type={type} className="h-7 w-7" />
          <span className="truncate">{item.name}</span>
        </button>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{FILE_TYPE_LABELS[type]}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatBytes(item.size)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{item.created_at}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end">
          <FileActionsMenu
            onVisualize={() => onPreview(item)}
            onCopy={a.handleCopyLink}
            onShare={a.handleShare}
            onDownload={a.handleDownload}
            onDelete={a.handleDelete}
          />
        </div>
      </td>
    </tr>
  );
}

function FileCard({ item, folderId, onChanged, onPreview }: { item: FileItemSummary; folderId: number | null; onChanged: () => void; onPreview: (item: FileItemSummary) => void }) {
  const type = detectFileType(item);
  const a = useFileActions(item, folderId, onChanged);

  return (
    <div className={cn(
      'group relative rounded-lg border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg',
      item.is_favorite ? 'border-amber-300 ring-1 ring-amber-200' : 'border-muted'
    )}>
      <div className="flex items-start justify-between">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="mb-4 flex h-12 w-12 items-center justify-center"
          aria-label="Visualiser"
        >
          <FileTypeIcon type={type} className="h-10 w-10" />
        </button>
        <div className="flex items-center gap-1">
          <FavoriteStar active={item.is_favorite} onClick={(e) => { e.stopPropagation(); a.handleToggleFavorite(); }} />
          <FileActionsMenu
            onVisualize={() => onPreview(item)}
            onCopy={a.handleCopyLink}
            onShare={a.handleShare}
            onDownload={a.handleDownload}
            onDelete={a.handleDelete}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPreview(item)}
        className="block w-full text-left"
      >
        <h4 className="mb-1 truncate text-sm font-medium text-gray-900 hover:text-blue-600" title={item.name}>
          {item.name}
        </h4>
        <ul className="flex list-inside list-disc gap-3.5">
          <li className="list-none text-sm text-gray-500">{FILE_TYPE_LABELS[type]}</li>
          <li className="text-sm text-gray-500">{formatBytes(item.size)}</li>
        </ul>
      </button>
    </div>
  );
}

function UnlockPrompt({ folderId, onUnlock, onCancel }: { folderId: number; onUnlock: (code: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) { toast.error('4 chiffres requis'); return; }
    try {
      setSubmitting(true);
      const ok = await fileManagerService.verifyLock(folderId, code);
      if (ok) onUnlock(code);
      else toast.error('Code incorrect');
    } catch (e: any) {
      toast.error(e?.message ?? 'Code incorrect');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-4 flex items-center justify-center">
        <PiFolderLockDuotone className="h-16 w-16 text-amber-500" />
      </div>
      <h2 className="mb-2 text-center text-xl font-bold text-gray-900">Dossier verrouillé</h2>
      <p className="mb-5 text-center text-sm text-gray-500">Saisissez le code à 4 chiffres pour accéder à ce dossier.</p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          autoComplete="new-password"
          inputMode="numeric"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl font-mono tracking-widest"
          autoFocus
        />
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? '…' : 'Déverrouiller'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateFolderForm({
  parentId, onClose, onCreated,
}: { parentId: number | null; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [withLock, setWithLock] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nom requis'); return; }
    if (withLock && !/^\d{4}$/.test(code)) { toast.error('Code à 4 chiffres requis'); return; }
    try {
      setSubmitting(true);
      await fileManagerService.createFolder({
        name: name.trim(),
        parent_id: parentId,
        lock_code: withLock ? code : undefined,
      });
      toast.success('Dossier créé');
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Nouveau dossier</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nom *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Dossiers clients 2026"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={withLock} onChange={(e) => setWithLock(e.target.checked)} />
          <span className="text-sm text-gray-700">🔒 Protéger ce dossier avec un code à 4 chiffres</span>
        </label>
        {withLock && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Code (4 chiffres) *</label>
            <input
              type="password"
              autoComplete="new-password"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl font-mono tracking-widest"
            />
            <p className="mt-1 text-xs text-gray-500">
              ⚠ Notez ce code, il ne sera pas récupérable en cas d&apos;oubli.
            </p>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          Créer
        </button>
      </div>
    </form>
  );
}

function UploadFilesForm({
  folderId, onClose, onUploaded,
}: { folderId: number | null; onClose: () => void; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { toast.error('Sélectionnez au moins un fichier'); return; }
    try {
      setSubmitting(true);
      const unlock = getStoredUnlock(folderId);
      await fileManagerService.upload(folderId, files, unlock);
      toast.success(`${files.length} fichier${files.length > 1 ? 's' : ''} importé${files.length > 1 ? 's' : ''}`);
      onUploaded();
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de l\'import');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Importer des fichiers</h2>
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {files.length > 0 && (
        <ul className="mt-3 max-h-40 overflow-y-auto text-xs text-gray-600">
          {files.map((f, i) => (
            <li key={i} className="py-1">📎 {f.name} ({formatBytes(f.size)})</li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Import…' : 'Importer'}
        </button>
      </div>
    </form>
  );
}

function LockSettingsForm({
  folder, onClose, onChanged,
}: { folder: { id: number; name: string; is_locked: boolean }; onClose: () => void; onChanged: () => void }) {
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const apply = async (removeLock: boolean) => {
    if (folder.is_locked && currentCode.length !== 4) {
      toast.error('Code actuel (4 chiffres) requis');
      return;
    }
    if (!removeLock && newCode.length !== 4) {
      toast.error('Nouveau code (4 chiffres) requis');
      return;
    }
    try {
      setSubmitting(true);
      await fileManagerService.updateFolder(folder.id, {
        current_unlock: folder.is_locked ? currentCode : undefined,
        remove_lock: removeLock || undefined,
        lock_code: removeLock ? undefined : newCode,
      });
      toast.success(removeLock ? 'Verrouillage retiré' : 'Code mis à jour');
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        🔒 Verrouillage de « {folder.name} »
      </h2>
      <div className="space-y-4">
        {folder.is_locked && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Code actuel *</label>
            <input
              type="password"
              autoComplete="new-password"
              inputMode="numeric"
              maxLength={4}
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl font-mono tracking-widest"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {folder.is_locked ? 'Nouveau code' : 'Code à 4 chiffres'}
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl font-mono tracking-widest"
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        {folder.is_locked && (
          <button
            type="button"
            onClick={() => apply(true)}
            disabled={submitting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Retirer le verrouillage
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => apply(false)}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {folder.is_locked ? 'Changer le code' : 'Activer le verrouillage'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ShareFolderForm ────────────────────────────────────────────────────────

function ShareFolderForm({
  folder,
  onClose,
  onChanged,
}: {
  folder: { id: number; name: string };
  onClose: () => void;
  onChanged: () => void;
}) {
  const [perms, setPerms] = useState<FolderPermissions | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fileManagerService.getFolderPermissions(folder.id);
        if (!alive) return;
        setPerms(data);
        setVisibility(data.visibility);
        setSelected(new Set(data.permitted_admin_ids));
      } catch (e: any) {
        toast.error(e?.message ?? 'Impossible de charger les permissions');
        onClose();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [folder.id]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await fileManagerService.updateFolderPermissions(folder.id, {
        visibility,
        admin_ids: Array.from(selected),
      });
      toast.success('Partage mis à jour');
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmins = (perms?.admins ?? []).filter((a) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  return (
    <div className="p-6">
      <h3 className="mb-1 text-lg font-semibold">Partager « {folder.name} »</h3>
      <p className="mb-4 text-sm text-gray-500">
        Définissez qui peut voir ce dossier dans le gestionnaire de fichiers.
      </p>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={cn(
                'rounded-lg border px-4 py-3 text-left text-sm transition',
                visibility === 'public'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="font-semibold">🌐 Public</div>
              <div className="text-xs text-gray-500">Visible par tous les admins</div>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={cn(
                'rounded-lg border px-4 py-3 text-left text-sm transition',
                visibility === 'private'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="font-semibold">🔒 Privé</div>
              <div className="text-xs text-gray-500">Visible uniquement par vous et les admins sélectionnés</div>
            </button>
          </div>

          {visibility === 'private' && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Admins avec accès ({selected.size} sélectionné{selected.size !== 1 ? 's' : ''})
              </label>
              <input
                type="text"
                placeholder="Rechercher un admin…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y">
                {filteredAdmins.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">Aucun admin trouvé.</div>
                )}
                {filteredAdmins.map((a) => {
                  const isOwner = perms?.owner_id === a.id;
                  const checked = isOwner || selected.has(a.id);
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50',
                        isOwner && 'cursor-not-allowed bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isOwner}
                        onChange={() => !isOwner && toggle(a.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">
                          {a.name}
                          {isOwner && <span className="ml-2 text-xs font-normal text-gray-500">(propriétaire)</span>}
                        </div>
                        <div className="truncate text-xs text-gray-500">{a.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── FilePreviewModal ───────────────────────────────────────────────────────

function FilePreviewModal({
  item,
  folderId,
  onClose,
}: {
  item: FileItemSummary;
  folderId: number | null;
  onClose: () => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const unlock = getStoredUnlock(folderId);
  const type = detectFileType(item);
  const url = fileManagerService.downloadUrl(item.id, unlock);

  // ESC pour fermer / F pour fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else onClose();
      } else if (e.key.toLowerCase() === 'f') {
        setFullscreen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, onClose]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const renderContent = () => {
    if (type === 'image') {
      return <img src={url} alt={item.name} className="max-h-full max-w-full object-contain" />;
    }
    if (type === 'video') {
      return <video src={url} controls autoPlay className="max-h-full max-w-full" />;
    }
    if (type === 'audio') {
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <MusicIcon className="h-24 w-24" />
          <audio src={url} controls autoPlay className="w-96" />
        </div>
      );
    }
    if (type === 'pdf') {
      return <iframe src={url} title={item.name} className="h-full w-full border-0 bg-white" />;
    }
    // Fallback : ouvrir le fichier brut dans un iframe (texte, etc.) — sinon proposer download
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <FileTypeIcon type={type} className="h-24 w-24" />
        <div className="text-lg font-medium text-gray-900">{item.name}</div>
        <div className="text-sm text-gray-500">
          La prévisualisation n'est pas disponible pour ce type de fichier.
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PiDownloadSimpleDuotone className="h-4 w-4" /> Télécharger
        </a>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9500] flex items-center justify-center bg-black/70 backdrop-blur-sm',
        fullscreen && 'bg-black'
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10 transition-all',
          fullscreen ? 'h-screen w-screen rounded-none' : 'h-[85vh] w-[min(1100px,92vw)]'
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-gray-900 px-4 py-2.5 text-white">
          <FileTypeIcon type={type} className="h-6 w-6" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{item.name}</div>
            <div className="truncate text-xs text-gray-400">
              {FILE_TYPE_LABELS[type]} · {formatBytes(item.size)}
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
            title="Télécharger"
          >
            <PiDownloadSimpleDuotone className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </a>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10"
            title={fullscreen ? 'Réduire (F)' : 'Plein écran (F)'}
            aria-label={fullscreen ? 'Réduire' : 'Plein écran'}
          >
            {fullscreen ? <PiArrowsInDuotone className="h-5 w-5" /> : <PiArrowsOutDuotone className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10"
            title="Fermer (Esc)"
            aria-label="Fermer"
          >
            <PiX className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-800">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

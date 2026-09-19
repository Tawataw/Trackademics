import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, StudyResource } from '../lib/db';
import { 
  Globe, 
  Plus, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Bookmark
} from 'lucide-react';

export function StudyHub() {
  const { user } = useAuth();
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<StudyResource | null>(null);
  const [platformName, setPlatformName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time Firestore sync on users/{uid}/studyResources
  useEffect(() => {
    if (!user?.uid) {
      setResources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = dbApi.subscribeToStudyResources(
      user.uid,
      (data) => {
        setResources(data);
        setLoading(false);
      },
      (error) => {
        console.error('StudyHub subscription error:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingResource(null);
    setPlatformName('');
    setWebsiteUrl('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (resource: StudyResource, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingResource(resource);
    setPlatformName(resource.platformName);
    setWebsiteUrl(resource.url);
    setFormError('');
    setIsModalOpen(true);
  };

  // Format URL helper
  const getNormalizedUrl = (inputUrl: string): string => {
    let trimmed = inputUrl.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  };

  // Get domain for favicon and display
  const getDomain = (rawUrl: string): string => {
    try {
      const normalized = getNormalizedUrl(rawUrl);
      const parsed = new URL(normalized);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return rawUrl.replace(/^https?:\/\//, '').split('/')[0] || rawUrl;
    }
  };

  // Favicon API URL
  const getFaviconUrl = (rawUrl: string): string => {
    const domain = getDomain(rawUrl);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const trimmedName = platformName.trim();
    const trimmedUrl = websiteUrl.trim();

    if (!trimmedName) {
      setFormError('Platform Name is required.');
      return;
    }
    if (!trimmedUrl) {
      setFormError('Website URL is required.');
      return;
    }

    // Basic URL validation
    const normalized = getNormalizedUrl(trimmedUrl);
    try {
      new URL(normalized);
    } catch {
      setFormError('Please enter a valid website address (e.g., udvash.com or https://udvash.com).');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingResource) {
        await dbApi.updateStudyResource(user.uid, editingResource.id, {
          platformName: trimmedName,
          url: normalized
        });
      } else {
        await dbApi.addStudyResource(user.uid, {
          platformName: trimmedName,
          url: normalized
        });
      }
      setIsModalOpen(false);
      setEditingResource(null);
      setPlatformName('');
      setWebsiteUrl('');
    } catch (err: any) {
      console.error('Failed to save study resource:', err);
      setFormError(err.message || 'Failed to save resource. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!user?.uid || !deletingId) return;
    setIsDeleting(true);
    try {
      await dbApi.deleteStudyResource(user.uid, deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete study resource:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered resources
  const filteredResources = resources.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.platformName.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query) ||
      getDomain(item.url).toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Study Hub</h1>
              <p className="text-sm text-slate-400">
                Online coaching portals, exam websites, and learning platforms in one click
              </p>
            </div>
          </div>
        </div>

        {/* Prominent + Add Resource Button */}
        <button
          id="study-hub-add-resource-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95 transition-all duration-150 text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Resource</span>
        </button>
      </div>

      {/* Search & Filter Bar (if there are resources or active search) */}
      {(resources.length > 0 || searchQuery) && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="study-hub-search-input"
              type="text"
              placeholder="Search platforms or websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-slate-400 hidden sm:block font-medium">
            {filteredResources.length} {filteredResources.length === 1 ? 'platform' : 'platforms'} saved
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
          <p className="text-sm">Loading your study resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {searchQuery ? 'No Matching Resources Found' : 'No Study Resources Added Yet'}
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {searchQuery
              ? `No platforms matched "${searchQuery}". Try a different keyword.`
              : 'Add your online coaching portals, video libraries, and exam websites (e.g. Udvash, ACS, 10 Minute School) for instant access.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              id="study-hub-empty-add-btn"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl shadow-lg shadow-brand-500/20 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Your First Resource</span>
            </button>
          )}
        </div>
      ) : (
        /* Responsive Grid of Resource Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredResources.map((item) => {
            const targetUrl = getNormalizedUrl(item.url);
            const domain = getDomain(item.url);
            const faviconUrl = getFaviconUrl(item.url);

            return (
              <div
                key={item.id}
                id={`resource-card-${item.id}`}
                className="group relative bg-slate-800/90 hover:bg-slate-750 border border-white/10 hover:border-brand-500/40 rounded-2xl p-5 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Clickable Card Link Area */}
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl"
                  title={`Open ${item.platformName} (${targetUrl}) in new tab`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Auto Favicon with Google Favicon API */}
                    <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-white/10 p-2 flex items-center justify-center flex-shrink-0 group-hover:border-brand-500/30 transition-colors">
                      <img
                        src={faviconUrl}
                        alt={`${item.platformName} logo`}
                        className="w-7 h-7 object-contain rounded-md"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback to Globe icon if favicon fails
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon text-brand-400 text-xs font-bold uppercase';
                            fallback.innerText = item.platformName.slice(0, 2);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>

                    {/* External Link Indicator & Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`edit-resource-${item.id}`}
                        onClick={(e) => handleOpenEdit(item, e)}
                        title="Edit resource"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`delete-resource-${item.id}`}
                        onClick={(e) => handleDeleteClick(item.id, e)}
                        title="Delete resource"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Platform Title */}
                  <div className="mb-2">
                    <h3 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                      {item.platformName}
                    </h3>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <span>{domain}</span>
                    </p>
                  </div>
                </a>

                {/* Card Bottom CTA Link */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                  <span className="text-[11px] text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            id="study-hub-resource-modal"
            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingResource ? 'Edit Resource' : 'Add Online Resource'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Saved to your personal portal in real-time
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Field 1: Platform Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Platform Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="study-hub-platform-name-input"
                  type="text"
                  required
                  placeholder="e.g., Udvash, ACS, 10 Minute School"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  autoFocus
                />
              </div>

              {/* Field 2: Website URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Website URL <span className="text-rose-400">*</span>
                </label>
                <input
                  id="study-hub-website-url-input"
                  type="text"
                  required
                  placeholder="e.g., https://udvash.com or online.acs.com.bd"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Prefix with https:// is optional and added automatically if omitted.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="study-hub-submit-btn"
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingResource ? 'Save Changes' : 'Add Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div 
            id="study-hub-delete-modal"
            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-1">Remove Resource?</h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              This resource will be permanently deleted from your Study Hub.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="study-hub-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

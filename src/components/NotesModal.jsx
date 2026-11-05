import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  StickyNote,
  Plus,
  Trash2,
  Search,
  Calendar,
  Tag,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'General', label: 'General', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { id: 'Finance', label: 'Finance', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'Todo', label: 'Todo', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'Important', label: 'Important', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { id: 'Personal', label: 'Personal', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
];

const DEFAULT_NOTES = [
  {
    id: 'note_1',
    title: 'Monthly Ledger Review',
    content: 'Review department base payroll and overhead utility bills before the 10th of every month.',
    category: 'Finance',
    timestamp: '2026-11-04 10:30 AM',
  },
  {
    id: 'note_2',
    title: 'GST & Invoice Filing',
    content: 'Gather vendor vouchers and credit receipts for Q3 GST reconciliation.',
    category: 'Todo',
    timestamp: '2026-11-05 09:15 AM',
  },
];

export default function NotesModal({ isOpen, onClose }) {
  const [notes, setNotes] = useState(() => {
    try {
      const stored = localStorage.getItem('sts_user_notes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading sts_user_notes:', e);
    }
    return DEFAULT_NOTES;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState('');

  // Persist notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sts_user_notes', JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save sts_user_notes:', e);
    }
  }, [notes]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a note title.');
      return;
    }
    if (!content.trim()) {
      setFormError('Please enter some note content.');
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newNote = {
      id: `note_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      category,
      timestamp: `${formattedDate} ${formattedTime}`,
    };

    setNotes((prev) => [newNote, ...prev]);
    setTitle('');
    setContent('');
    setCategory('General');
    setFormError('');
    setIsAdding(false);
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-auto max-h-[90vh] overflow-hidden bg-[#0c1424] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-fadeIn text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Notes & Records</h3>
              <p className="text-[11px] text-slate-400">Quick thoughts, memos & financial reminders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer text-sm leading-none flex items-center justify-center w-7 h-7"
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Action Bar (Search & Add Button) */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, content, or tag..."
              className="w-full pl-8 pr-7 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAdding((prev) => !prev);
              setFormError('');
            }}
            className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95 ${
              isAdding
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isAdding ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </>
            )}
          </button>
        </div>

        {/* Add Note Form (Collapsible) */}
        {isAdding && (
          <form
            onSubmit={handleAddNote}
            className="mb-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn"
          >
            {formError && (
              <div className="flex items-center space-x-1.5 text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Note Title (e.g. GST Filing Deadline)"
                className="w-full px-3 py-2 bg-[#0c1424] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-semibold"
                autoFocus
              />
            </div>

            <div>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Write your note or quick thoughts here..."
                className="w-full px-3 py-2 bg-[#0c1424] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
              />
            </div>

            {/* Category selection & submit */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                      category === cat.id
                        ? `${cat.color} ring-1 ring-emerald-500/40`
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer ml-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </form>
        )}

        {/* Notes List / Grid View */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh] sm:max-h-[55vh]">
          {filteredNotes.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <FileText className="w-8 h-8 text-slate-600 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-400">
                {searchQuery
                  ? 'No notes match your search.'
                  : 'No notes created yet. Click "+ Add Note" to create one.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const catObj = CATEGORIES.find((c) => c.id === note.category) || CATEGORIES[0];
              return (
                <div
                  key={note.id}
                  className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition group relative"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catObj.color}`}
                        >
                          {note.category || 'General'}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{note.title}</h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer flex-shrink-0"
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed break-words font-sans">
                    {note.content}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-2.5 h-2.5 text-slate-500" />
                      <span>{note.timestamp}</span>
                    </span>
                    <span>#{note.id.replace('note_', '')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'} saved</span>
          <span className="text-emerald-400 font-medium">Auto-saved locally</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

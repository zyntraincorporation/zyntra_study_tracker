import { useEffect, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { FileText, Save, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { notesAPI } from '../lib/api';
import { getBSTDateString } from '../lib/schedule';
import { LoadingCard } from '../components/ui/Shared';
import { useUIStore } from '../store';

const NOTES_PAGE_SIZE = 30;
const NOTES_QUERY_KEY = ['notes-all', NOTES_PAGE_SIZE];

export default function NotesPage() {
  const toast = useUIStore((s) => s.toast);
  const qc = useQueryClient();
  const today = getBSTDateString();
  const textRef = useRef(null);

  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [viewDate, setViewDate] = useState(null);

  const { data: todayNote, isLoading: loadingToday } = useQuery({
    queryKey: ['note-today'],
    queryFn: () => notesAPI.getToday().then((r) => r.data),
  });

  const {
    data: pagedNotes,
    isLoading: loadingHistory,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: NOTES_QUERY_KEY,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => notesAPI.getAll({
      page: pageParam,
      limit: NOTES_PAGE_SIZE,
    }).then((r) => r.data),
    getNextPageParam: (lastPage) => (
      lastPage.hasMore ? lastPage.page + 1 : undefined
    ),
  });

  useEffect(() => {
    setContent(todayNote?.note?.content || '');
  }, [todayNote?.date, todayNote?.note?.content]);

  const saveMutation = useMutation({
    mutationFn: () => notesAPI.save({ content, date: today }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['note-today'] });
      qc.invalidateQueries({ queryKey: ['notes-all'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => toast('Save failed', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (date) => notesAPI.delete(date),
    onSuccess: (_, date) => {
      qc.invalidateQueries({ queryKey: ['note-today'] });
      qc.invalidateQueries({ queryKey: ['notes-all'] });
      if (viewDate === date) setViewDate(null);
    },
    onError: () => toast('Delete failed', 'error'),
  });

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (content.trim()) saveMutation.mutate();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [content, saveMutation.mutate]);

  const notes = (pagedNotes?.pages || [])
    .flatMap((page) => page.items)
    .filter((note) => note.date !== today);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Daily Notes</h2>
        <p className="text-xs text-white/40 mt-1">
          Keep your daily study notes in one place. Full history is available below.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-neon-blue" />
            <p className="text-sm font-semibold text-white">Today&apos;s note</p>
            <span className="text-xs text-white/30">{today}</span>
          </div>
          {saved && <span className="text-xs text-neon-green animate-fade-in">Saved</span>}
        </div>

        {loadingToday ? (
          <LoadingCard rows={3} />
        ) : (
          <>
            <textarea
              ref={textRef}
              className="input resize-none w-full text-sm leading-relaxed"
              rows={8}
              placeholder={'What did you study today? Where did you get stuck? What should you revisit later?\n\nUse Ctrl+S to save quickly.'}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaved(false);
              }}
            />

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-white/25">{content.length} characters</span>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !content.trim()}
                className="btn-primary text-sm"
              >
                <Save size={14} />
                {saveMutation.isPending ? 'Saving...' : 'Save note'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="section-heading !mb-0">All notes</p>
          <span className="text-xs text-white/30">Loaded in pages of {NOTES_PAGE_SIZE}</span>
        </div>

        {loadingHistory ? (
          <LoadingCard rows={5} />
        ) : notes.length === 0 ? (
          <div className="card p-6 text-center text-sm text-white/30">No historical notes yet.</div>
        ) : (
          <>
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.date} className="card overflow-hidden">
                  <button
                    onClick={() => setViewDate(viewDate === note.date ? null : note.date)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <FileText size={14} className="text-white/30 shrink-0" />
                    <span className="text-xs text-white/50 shrink-0">{note.date}</span>
                    <span className="text-xs text-white/40 flex-1 truncate ml-2">
                      {note.content.slice(0, 80)}{note.content.length > 80 ? '...' : ''}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(note.date);
                        }}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      {viewDate === note.date
                        ? <ChevronDown size={14} className="text-white/30" />
                        : <ChevronRight size={14} className="text-white/30" />}
                    </div>
                  </button>

                  {viewDate === note.date && (
                    <div className="px-4 pb-4 border-t border-white/[0.05]">
                      <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap mt-3">
                        {note.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn-secondary w-full"
              >
                {isFetchingNextPage ? 'Loading more...' : 'Load more notes'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

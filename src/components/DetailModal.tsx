import { useEffect } from 'react';
import { X, Star, Clock3, Calendar, Bookmark, Play, Heart, Film, User } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { formatDuration, trailerUrl } from '@/lib/movies';

export function DetailModal({
  movie, inWatchlist, saved, onClose, onToggleWatchlist, onToggleLike,
}: {
  movie: Movie;
  inWatchlist: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleWatchlist: () => void;
  onToggleLike: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close detail-close" onClick={onClose} aria-label="Close"><X size={22} /></button>
        <div className="detail-backdrop">
          <img src={movie.backdrop} alt={movie.title} />
          <div className="detail-backdrop-shade" />
        </div>
        <div className="detail-body">
          <div className="detail-poster">
            <img src={movie.poster} alt={movie.title} />
            <button className="card-play detail-play" aria-label={`Play ${movie.title}`} onClick={() => window.open(trailerUrl(movie), '_blank')}><Play size={20} fill="currentColor" /></button>
          </div>
          <div className="detail-header">
            <h2>{movie.title}</h2>
            <div className="detail-meta">
              <span><Calendar size={14} /> {movie.year}</span>
              <span><Clock3 size={14} /> {formatDuration(movie.duration)}</span>
              <span className="rating"><Star size={14} fill="currentColor" /> {movie.rating.toFixed(1)}</span>
              <span className="detail-type"><Film size={14} /> {movie.media_type === 'movie' ? 'Movie' : 'Series'}</span>
            </div>
            <div className="detail-genres">{movie.genres.map((g) => <span key={g} className="genre-tag">{g}</span>)}</div>
          </div>
          <p className="detail-tagline">{movie.tagline}</p>
          <p className="detail-overview">{movie.overview}</p>
          <div className="detail-credits">
            <div className="credit-row"><User size={15} /><span><strong>Director</strong> {movie.director}</span></div>
            <div className="credit-row"><Film size={15} /><span><strong>Cast</strong> {movie.cast.join(', ')}</span></div>
          </div>
          <div className="detail-actions">
            <button className={inWatchlist ? 'primary-button saved-btn' : 'primary-button'} onClick={onToggleWatchlist}>
              <Bookmark size={16} fill={inWatchlist ? 'currentColor' : 'none'} />
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
            <button className={saved ? 'action-button liked big-action' : 'action-button big-action'} onClick={onToggleLike} aria-label="Like">
              <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

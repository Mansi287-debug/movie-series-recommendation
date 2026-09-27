import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Bell, Bookmark, Check, ChevronDown, Clock3, Compass, Film,
  Heart, HelpCircle, Home, Info, LayoutGrid, LogOut, Menu, Play, Search,
  Settings, Sparkles, Star, Tv, Zap, Loader2, X,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { movies, fitsDuration, formatDuration, trailerUrl } from '@/lib/movies';
import type { Category, Duration, Mood, Movie, WatchlistItem } from '@/lib/types';
import { AuthModal } from '@/components/AuthModal';
import { DetailModal } from '@/components/DetailModal';

const moods: { label: Mood; icon: typeof Sparkles }[] = [
  { label: 'Relaxed', icon: Sparkles },
  { label: 'Excited', icon: Zap },
  { label: 'Romantic', icon: Heart },
  { label: 'Focused', icon: Compass },
  { label: 'Surprised', icon: Star },
];

const durations: { label: Duration; icon: typeof Clock3 }[] = [
  { label: 'Under 30 min', icon: Zap },
  { label: '30–60 min', icon: Clock3 },
  { label: '1–2 hours', icon: Film },
  { label: '2+ hours', icon: Tv },
];

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [activeType, setActiveType] = useState<Category>('Movies');
  const [activeMood, setActiveMood] = useState<Mood>('Relaxed');
  const [activeDuration, setActiveDuration] = useState<Duration>('1–2 hours');
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [surpriseIndex, setSurpriseIndex] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadWatchlist = useCallback(async () => {
    if (!user) { setWatchlist([]); return; }
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('added_at', { ascending: false });
    if (error) { showToast('Could not load watchlist'); return; }
    setWatchlist((data ?? []) as WatchlistItem[]);
  }, [user, showToast]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const categoryMovies = useMemo(
    () => movies.filter((m) => m.category === activeType),
    [activeType],
  );

  const recommended = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = categoryMovies;
    if (query) {
      result = result.filter((m) =>
        `${m.title} ${m.genres.join(' ')} ${m.cast.join(' ')} ${m.director}`.toLowerCase().includes(query),
      );
    }
    if (activeMood !== 'Surprised') {
      const moodFiltered = result.filter((m) => m.moods.includes(activeMood));
      if (moodFiltered.length > 0) result = moodFiltered;
    }
    const durationFiltered = result.filter((m) => fitsDuration(m, activeDuration));
    return durationFiltered.length > 0 ? durationFiltered : result;
  }, [categoryMovies, search, activeMood, activeDuration]);

  const surprisePool = useMemo(() => {
    const pool = categoryMovies.filter(
      (m) => activeMood === 'Surprised' || m.moods.includes(activeMood),
    );
    return pool.length > 0 ? pool : categoryMovies;
  }, [categoryMovies, activeMood]);

  const surprise = surprisePool[surpriseIndex % surprisePool.length] ?? categoryMovies[0];

  const watchlistIds = useMemo(() => new Set(watchlist.map((w) => w.movie_id)), [watchlist]);

  const inWatchlist = useCallback(
    (movie: Movie) => watchlistIds.has(movie.id),
    [watchlistIds],
  );

  const toggleWatchlist = useCallback(async (movie: Movie) => {
    if (!user) { setAuthOpen(true); return; }
    if (inWatchlist(movie)) {
      const { error } = await supabase.from('watchlist').delete().eq('movie_id', movie.id).eq('user_id', user.id);
      if (error) { showToast('Could not remove from watchlist'); return; }
      setWatchlist((prev) => prev.filter((w) => w.movie_id !== movie.id));
      showToast(`Removed "${movie.title}" from your watchlist`);
    } else {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          movie_id: movie.id,
          media_type: movie.media_type,
          title: movie.title,
          poster: movie.poster,
          rating: movie.rating,
          year: movie.year,
        })
        .select()
        .single();
      if (error) { showToast('Could not add to watchlist'); return; }
      setWatchlist((prev) => [data as WatchlistItem, ...prev]);
      showToast(`Added "${movie.title}" to your watchlist`);
    }
  }, [user, inWatchlist, showToast]);

  const toggleLike = useCallback((movie: Movie) => {
    setLiked((prev) => prev.includes(movie.id) ? prev.filter((id) => id !== movie.id) : [...prev, movie.id]);
  }, []);

  const handleSurprise = () => {
    setSurpriseIndex((prev) => prev + 1);
  };

  const heroMovie = recommended[0] ?? categoryMovies[0] ?? movies[0];

  const displayList = showAll ? recommended : recommended.slice(0, 6);

  return (
    <div className="app-shell">
      {mobileMenu && <div className="mobile-backdrop" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Sparkles size={17} fill="currentColor" /></span><span>Cine<span>Match</span></span></div>
        <nav className="side-nav">
          <p className="nav-label">EXPLORE</p>
          <SideLink icon={Home} label="Home" active />
          <SideLink icon={Compass} label="Discover" />
          <SideLink icon={Sparkles} label="Coming Soon" />
          <p className="nav-label library-label">LIBRARY</p>
          <SideLink icon={LayoutGrid} label="Recent" />
          <SideLink icon={Heart} label="Liked" count={liked.length || undefined} />
          <SideLink icon={Star} label="Top Rated" />
          <SideLink icon={Bookmark} label="Watchlist" count={watchlist.length || undefined} />
          <p className="nav-label library-label">GENERAL</p>
          <SideLink icon={Settings} label="Settings" />
          <SideLink icon={HelpCircle} label="Help" />
          {user ? (
            <button className="side-link" onClick={async () => { await signOut(); setMobileMenu(false); }}>
              <LogOut size={17} /><span>Log Out</span>
            </button>
          ) : (
            <button className="side-link" onClick={() => { setAuthOpen(true); setMobileMenu(false); }}>
              <LogOut size={17} /><span>Sign In</span>
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="mini-avatar">{user.email?.[0]?.toUpperCase() ?? 'U'}</div>
              <div><strong>{user.email?.split('@')[0] ?? 'User'}</strong><span>{user.email}</span></div>
            </>
          ) : (
            <>
              <div className="mini-avatar">G</div>
              <div><strong>Guest</strong><span>Not signed in</span></div>
            </>
          )}
          <ChevronDown size={14} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu size={20} /></button>
          <div className="media-tabs">
            {(['Movies', 'Series'] as Category[]).map((type) => (
              <button key={type} className={activeType === type ? 'active' : ''} onClick={() => { setActiveType(type); setShowAll(false); }}>{type}</button>
            ))}
          </div>
          <label className="search-box">
            <Search size={19} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search titles, genres, cast..." />
            <kbd>⌘ K</kbd>
          </label>
          <button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button>
          {user ? (
            <div className="profile">
              <div className="profile-avatar">{user.email?.[0]?.toUpperCase() ?? 'U'}</div>
              <div><strong>{user.email?.split('@')[0]}</strong><span>{user.email}</span></div>
            </div>
          ) : (
            <button className="primary-button signin-btn" onClick={() => setAuthOpen(true)}>Sign In</button>
          )}
        </header>

        {loading ? (
          <div className="page-loader"><Loader2 size={32} className="spin" /></div>
        ) : (
          <div className="content">
            <section className="hero">
              <img src={heroMovie.backdrop} alt={heroMovie.title} />
              <div className="hero-overlay" />
              <div className="hero-copy">
                <div className="eyebrow"><Sparkles size={15} fill="currentColor" /> {heroMovie.tag.toUpperCase()}</div>
                <h1>{heroMovie.title}</h1>
                <p>{heroMovie.overview.slice(0, 180)}...</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => window.open(trailerUrl(heroMovie), '_blank')}>
                    <Play size={16} fill="currentColor" /> Watch Trailer
                  </button>
                  <button className="secondary-button" onClick={handleSurprise}>
                    <Zap size={15} fill="currentColor" /> Surprise Me
                  </button>
                  <button className="secondary-button" onClick={() => setDetailMovie(heroMovie)}>
                    <Info size={15} /> More Info
                  </button>
                </div>
                <div className="featured-meta">
                  <strong>Featured · {heroMovie.title}</strong>
                  <span>{heroMovie.year}</span>
                  <span className="rating"><Star size={14} fill="currentColor" /> {heroMovie.rating.toFixed(1)}</span>
                  <span><Clock3 size={14} /> {formatDuration(heroMovie.duration)}</span>
                </div>
              </div>
              <div className="carousel-dots"><b /><i /><i /><i /></div>
            </section>

            <section className="preference-grid">
              <div className="preference-card">
                <div className="section-kicker">01 · FEEL FIRST</div>
                <div className="section-heading">
                  <h2>What's your mood?</h2>
                  <span className="selected-chip">{activeMood}</span>
                </div>
                <div className="option-grid">
                  {moods.map(({ label, icon: Icon }) => (
                    <button key={label} className={activeMood === label ? 'option selected' : 'option'} onClick={() => setActiveMood(label)}>
                      <Icon size={18} /><span>{label}</span>
                      {activeMood === label && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="preference-card">
                <div className="section-kicker">02 · FIT THE MOMENT</div>
                <div className="section-heading">
                  <h2>How much time do you have?</h2>
                  <Clock3 size={19} className="orange-icon" />
                </div>
                <div className="option-grid duration-grid">
                  {durations.map(({ label, icon: Icon }) => (
                    <button key={label} className={activeDuration === label ? 'option selected' : 'option'} onClick={() => setActiveDuration(label)}>
                      <Icon size={16} /><span>{label}</span>
                      {activeDuration === label && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="section-block" id="recommendations">
              <div className="section-title-row">
                <div>
                  <div className="section-kicker">MADE FOR YOU</div>
                  <h2>Recommended {activeType.toLowerCase()} tonight</h2>
                </div>
                {recommended.length > 6 && (
                  <button className="text-button" onClick={() => setShowAll(!showAll)}>
                    {showAll ? 'Show less' : `View all (${recommended.length})`} <ArrowRight size={16} />
                  </button>
                )}
              </div>
              {displayList.length === 0 ? (
                <div className="empty-state">
                  <Film size={48} />
                  <h3>No matches found</h3>
                  <p>Try a different mood, time, or search term.</p>
                </div>
              ) : (
                <div className="movie-grid">
                  {displayList.map((item) => (
                    <MovieCard
                      key={item.id}
                      movie={item}
                      liked={liked.includes(item.id)}
                      saved={inWatchlist(item)}
                      onClick={() => setDetailMovie(item)}
                      onLike={(e) => { e.stopPropagation(); toggleLike(item); }}
                      onSave={(e) => { e.stopPropagation(); toggleWatchlist(item); }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="surprise-banner">
              <div className="surprise-glow" />
              <div className="surprise-text">
                <div className="eyebrow"><Sparkles size={15} fill="currentColor" /> NOT SURE WHAT TO WATCH?</div>
                <h2>Let serendipity<br /><em>take the wheel.</em></h2>
                <p>One perfect pick, based on your mood and the time you have right now.</p>
                <button className="primary-button" onClick={handleSurprise}>Surprise me <Zap size={16} fill="currentColor" /></button>
              </div>
              <div className="surprise-pick">
                <img src={surprise.poster} alt={surprise.title} />
                <div className="match-badge">{Math.round(70 + (surprise.rating - 7) * 12)}% MATCH</div>
                <div className="pick-details">
                  <div className="section-kicker">YOUR PERFECT PICK</div>
                  <h3>{surprise.title}</h3>
                  <div className="pick-meta">
                    {surprise.year}<span>•</span>{surprise.genres.join(', ')}<span>•</span>{formatDuration(surprise.duration)}
                    <span className="rating"><Star size={13} fill="currentColor" /> {surprise.rating.toFixed(1)}</span>
                  </div>
                  <p>"A carefully chosen story for a {activeMood.toLowerCase()} moment, with just the right amount of atmosphere."</p>
                  <button className="outline-button" onClick={() => setDetailMovie(surprise)}><Info size={15} /> View details</button>
                </div>
              </div>
            </section>

            {watchlist.length > 0 && user && (
              <section className="section-block">
                <div className="section-title-row">
                  <div>
                    <div className="section-kicker">SAVED FOR LATER</div>
                    <h2>Your watchlist</h2>
                  </div>
                </div>
                <div className="movie-grid">
                  {watchlist.slice(0, 6).map((item) => {
                    const movie = movies.find((m) => m.id === item.movie_id);
                    if (!movie) return null;
                    return (
                      <MovieCard
                        key={item.id}
                        movie={movie}
                        liked={liked.includes(movie.id)}
                        saved={true}
                        onClick={() => setDetailMovie(movie)}
                        onLike={(e) => { e.stopPropagation(); toggleLike(movie); }}
                        onSave={(e) => { e.stopPropagation(); toggleWatchlist(movie); }}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      {detailMovie && (
        <DetailModal
          movie={detailMovie}
          inWatchlist={inWatchlist(detailMovie)}
          saved={liked.includes(detailMovie.id)}
          onClose={() => setDetailMovie(null)}
          onToggleWatchlist={() => toggleWatchlist(detailMovie)}
          onToggleLike={() => toggleLike(detailMovie)}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
  );
}

function SideLink({ icon: Icon, label, active = false, count }: { icon: typeof Home; label: string; active?: boolean; count?: number }) {
  return (
    <button className={`side-link ${active ? 'active' : ''}`}>
      <Icon size={17} /><span>{label}</span>
      {count ? <small>{count}</small> : null}
    </button>
  );
}

function MovieCard({
  movie, liked, saved, onClick, onLike, onSave,
}: {
  movie: Movie;
  liked: boolean;
  saved: boolean;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
  onSave: (e: React.MouseEvent) => void;
}) {
  return (
    <article className="movie-card" onClick={onClick}>
      <div className="poster">
        <img src={movie.poster} alt={movie.title} />
        <div className="poster-shade" />
        <span className="movie-tag">{movie.tag}</span>
        <button className="card-play" aria-label={`Play ${movie.title}`} onClick={(e) => { e.stopPropagation(); window.open(trailerUrl(movie), '_blank'); }}>
          <Play size={16} fill="currentColor" />
        </button>
        <div className="card-actions">
          <button className={liked ? 'action-button liked' : 'action-button'} onClick={onLike} aria-label="Like">
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button className={saved ? 'action-button saved' : 'action-button'} onClick={onSave} aria-label="Save">
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="movie-info">
        <div><h3>{movie.title}</h3><p>{movie.genres.join(' · ')}</p></div>
        <span className="rating"><Star size={13} fill="currentColor" /> {movie.rating.toFixed(1)}</span>
      </div>
      <div className="movie-footer">
        <span>{movie.year}</span><span>•</span><span>{formatDuration(movie.duration)}</span>
      </div>
    </article>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

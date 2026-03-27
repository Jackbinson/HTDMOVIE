import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Ticket, TrendingUp, Loader2, AlertCircle, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOpenTrailer, setIsOpenTrailer] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [moviesResponse, trendingResponse] = await Promise.all([
          axios.get(`${API_URL}/movies`),
          axios.get(`${API_URL}/trending`)
        ]);

        const movieList = moviesResponse.data?.success ? moviesResponse.data.data : [];
        const trendingList = trendingResponse.data?.success ? trendingResponse.data.data : [];
        const heroMovie = trendingList.length > 0 ? trendingList[0] : movieList[0] || null;

        setFeaturedMovie(heroMovie);

        if (heroMovie) {
          setMovies(movieList.filter((movie) => movie.id !== heroMovie.id));
        } else {
          setMovies(movieList);
        }
      } catch (error) {
        console.error('Loi lay danh sach phim:', error);
        setErrorMsg('Khong the tai du lieu tu may chu.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p className="text-xl font-semibold tracking-wider animate-pulse">Dang chuan bi rap chieu...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">{errorMsg}</h2>
      </div>
    );
  }

  const featuredImageUrl = featuredMovie?.poster_url
    ? `http://localhost:5000${featuredMovie.poster_url}`
    : 'https://placehold.co/1920x1080/1a1a1a/FFF?text=NO+BANNER';

  const trailerId = featuredMovie?.trailer_id || 'Way9Dexny3w';

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans overflow-x-hidden">
      <Navbar />

      {featuredMovie && (
        <div className="relative w-full h-[70vh] md:h-[80vh] flex items-center">
          <div className="absolute inset-0 w-full h-full">
            <img
              src={featuredImageUrl}
              alt={featuredMovie.title || featuredMovie.movie_name}
              className="w-full h-full object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full mt-20">
            <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-[0_0_10px_rgba(229,9,20,0.8)]">
              Phim dang trend nhat
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-2xl">
              {featuredMovie.title || featuredMovie.movie_name}
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8 line-clamp-3 font-light text-justify drop-shadow-md">
              {featuredMovie.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={`/movie/${featuredMovie.id}`}
                className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(229,9,20,0.4)]"
              >
                <Ticket className="w-6 h-6" />
                DAT VE NGAY
              </Link>

              <button
                onClick={() => setIsOpenTrailer(true)}
                className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg font-bold text-lg transition-all duration-300 hover:-translate-y-1"
              >
                <Play className="w-6 h-6 fill-white" />
                XEM TRAILER
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <TrendingUp className="w-8 h-8 text-red-600" />
          <h2 className="text-3xl font-extrabold uppercase tracking-wider m-0">
            Phim Dang Chieu
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {movies.map((movie) => {
            const imgUrl = movie.poster_url
              ? `http://localhost:5000${movie.poster_url}`
              : 'https://placehold.co/300x450/2d2d2d/FFF?text=NO+POSTER';

            return (
              <Link
                to={`/movie/${movie.id}`}
                key={movie.id}
                className="group flex flex-col bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 hover:border-red-900/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(229,9,20,0.2)] cursor-pointer"
              >
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                    <Ticket className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 delay-100" />
                  </div>
                  <img
                    src={imgUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                </div>

                <div className="p-4 flex flex-col flex-grow justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase truncate mb-1 group-hover:text-red-500 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <span>{movie.duration} phut</span>
                      <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                      <span>Rap {movie.room_id}</span>
                    </div>
                  </div>
                  <div className="font-bold text-green-400 text-lg">
                    {Number(movie.price).toLocaleString()}d
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Dialog
        open={isOpenTrailer}
        onClose={() => setIsOpenTrailer(false)}
        className="relative z-[100]"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-black text-left shadow-[0_0_50px_rgba(229,9,20,0.3)] transition-all sm:my-8 w-full max-w-5xl border border-gray-800">
              <button
                onClick={() => setIsOpenTrailer(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors border border-gray-600 hover:border-red-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full aspect-video bg-gray-900">
                {isOpenTrailer && (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                    title="Movie Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Home;

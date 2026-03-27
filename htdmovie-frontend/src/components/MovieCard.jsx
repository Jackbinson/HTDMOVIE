import React from 'react';
const MovieCard = ({title, image, genre}) => { 
    return (
        <div className="movie-card">
            <img src={image} alt={title} className='movie-poster' />
            <div className="movie-info">
                <h3 className='movie-title'>{title}</h3>
                <p className="movie-genre">{genre || 'Đang cập nhật'}</p>
            </div>
        </div>
    )
}

export default MovieCard;
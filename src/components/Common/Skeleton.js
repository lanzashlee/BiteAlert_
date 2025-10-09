import React from 'react';
import './Skeleton.css';

const Line = ({ width = '100%', height = 14, rounded = 8, className = '' }) => (
  <div
    className={`skeleton-line ${className}`}
    style={{ width, height, borderRadius: rounded }}
  />
);

export const SkeletonCard = ({ lines = 3, withAvatar = false, style = {} }) => {
  const arr = Array.from({ length: lines });
  return (
    <div className="skeleton-card" style={style}>
      {withAvatar && <div className="skeleton-avatar" />}
      <div className="skeleton-content">
        {arr.map((_, i) => (
          <Line key={i} width={`${90 - i * 8}%`} />
        ))}
      </div>
    </div>
  );
};

const Skeleton = ({ cards = 3 }) => {
  const arr = Array.from({ length: cards });
  return (
    <div className="skeleton-grid">
      {arr.map((_, idx) => (
        <SkeletonCard key={idx} lines={4} withAvatar={true} />
      ))}
    </div>
  );
};

export default Skeleton;



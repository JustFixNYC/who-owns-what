import React, { useRef, useState, useEffect } from 'react';


export const LazyLoadWhenVisible: React.FC = props => {
  if (!('IntersectionObserver' in window)) {
    return <div>{props.children}</div>;
  }

  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const { current } = ref;
    if (!current) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      });
    });
    obs.observe(current);

    return () => {
      obs.unobserve(current);
    };
  }, [ref]);

  return <div ref={ref}>{hasBeenVisible && props.children}</div>
};

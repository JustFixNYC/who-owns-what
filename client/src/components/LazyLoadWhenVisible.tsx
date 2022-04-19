import React, { useRef, useState, useEffect } from "react";
import { FixedLoadingLabel } from "./Loader";

type LazyLoadProps = {
  children?: React.ReactNode;
  showLoader?: boolean;
};

export const LazyLoadWhenVisible: React.FC<LazyLoadProps> = (props) => {
  const { children, showLoader } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const componentBeforeVisible = showLoader ? <FixedLoadingLabel /> : <></>;

  useEffect(() => {
    const { current } = ref;
    if (!current) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
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

  if (!("IntersectionObserver" in window)) {
    return <div>{children}</div>;
  }

  return <div ref={ref}>{hasBeenVisible ? children : componentBeforeVisible}</div>;
};

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const FETCH_INTERVAL = 5000;

// https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function useIntervalCounter(intervalMs: number): number {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCounter(Date.now());
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs]);

  return counter;
}

function useLatestFileText(url: string, intervalMs: number): string | undefined {
  const [text, setText] = useState<string | undefined>();
  const counter = useIntervalCounter(intervalMs);

  useEffect(() => {
    let isActive = true;

    const getText = async () => {
      const res = await fetch(url);
      if (res.status === 200) {
        const content = await res.text();
        if (isActive) {
          setText(content);
        }
      }
    };

    getText().catch((e) => {
      console.log(`Error when fetching ${url}`, e);
    });

    return () => {
      isActive = false;
    };
  }, [counter, url]);

  return text;
}

export const VersionUpgrader: React.FC<{
  currentVersion: string;
}> = ({ currentVersion }) => {
  const loc = useLocation();
  const url = loc.pathname + loc.search;
  const prevUrl = usePrevious(url);
  const latestVersion = useLatestFileText("/version.txt", FETCH_INTERVAL);

  useEffect(() => {
    const didUrlChange = prevUrl && prevUrl !== url;
    const isNewVersionAvailable = latestVersion && currentVersion !== latestVersion;
    if (didUrlChange && isNewVersionAvailable) {
      // The user just navigated to a new page and we have a new
      // version available, so simulate a "hard" page navigation
      // rather than a "soft" pushState-based one.
      window.location.reload();
    }
  }, [url, prevUrl, currentVersion, latestVersion]);

  return null;
};

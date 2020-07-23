import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

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

type VersionUpgraderProps = {
  /** The current version of our front-end. */
  currentVersion: string;

  /**
   * The URL pointing to a text file containing the latest version
   * of the front-end that is available.
   */
  latestVersionUrl: string;

  /**
   * How frequently to check to see if a new version is available,
   * in seconds.
   */
  checkIntervalSecs: number;
};

/**
 * A component that regularly checks to see if a new version of
 * the front-end is available.
 *
 * Once a new version is available, we wait until the user navigates
 * to a new page, and then immediately reload it to simulate a
 * "hard" page navigation rather than a "soft" `pushState`-based one.
 */
export const VersionUpgrader: React.FC<VersionUpgraderProps> = ({
  currentVersion,
  latestVersionUrl,
  checkIntervalSecs,
}) => {
  const loc = useLocation();
  const url = loc.pathname + loc.search;
  const prevUrl = usePrevious(url);
  const latestVersion = useLatestFileText(latestVersionUrl, checkIntervalSecs * 1000);
  const didUrlChange = prevUrl && prevUrl !== url;
  const canUpgradeVersion = latestVersion && currentVersion !== latestVersion;

  useEffect(() => {
    if (canUpgradeVersion) {
      if (didUrlChange) {
        window.location.reload();
      } else {
        console.log(
          "A new version of the front-end is available, will upgrade on next page navigation."
        );
      }
    }
  }, [didUrlChange, canUpgradeVersion]);

  return null;
};

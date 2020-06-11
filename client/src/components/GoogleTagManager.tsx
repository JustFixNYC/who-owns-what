import React, { useState, useEffect } from "react";

/**
 * Google Tag Manager reports the title of the landing page when it
 * initializes, but because we only render the <title> on the client-side
 * via React, we need to wait until it's rendered before we initialize
 * GTM.
 *
 * This inserts the GTM script tag on mount, which is assumed to also
 * be when the <title> tag should be set. This should ensure that
 * GTM reports the correct landing page title.
 */
export const GoogleTagManager: React.FC<{}> = () => {
  const [gtmId, setGtmId] = useState("");

  useEffect(() => {
    // This <meta> tag is set in our index.html.
    const metaEl = document.querySelector('meta[name="jf-gtm-id"]');
    const metaGtmId = metaEl && metaEl.getAttribute("content");
    if (metaGtmId) {
      setGtmId(metaGtmId);
    }
  }, []);

  return gtmId ? (
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${gtmId}`}></script>
  ) : null;
};

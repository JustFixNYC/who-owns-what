export interface GTMDataLayer {
  push(obj: GTMDataLayerObject): void;
}

declare global {
  interface Window {
    /**
     * A reference to the dataLayer global object, provided by the GTM snippet.
     *
     * However, it won't exist if the app hasn't been configured to support GTM.
     */
    dataLayer: GTMDataLayer | undefined;
  }
}

/** Data layer event to send when a user subscribes to our mailing list. */
type GTMSubscribeToMailingListEvent = {
  event: "jf.subscribeToMailingList";
};

export type GTMDataLayerObject = GTMSubscribeToMailingListEvent;

export function getDataLayer(): GTMDataLayer {
  return window.dataLayer || [];
}

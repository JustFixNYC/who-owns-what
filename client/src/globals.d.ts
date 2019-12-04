import { google } from "google-maps";

declare global {
  interface Window {
    gtag: Gtag.Gtag;
    google: google;
  }
}

import { google } from "google-maps";
import Rollbar from 'rollbar';

declare global {
  interface Window {
    gtag: Gtag.Gtag;
    google: google;
    Rollbar: Rollbar;
  }
}

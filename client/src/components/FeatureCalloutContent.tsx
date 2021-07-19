import Timeline_gif from "../assets/img/Feature_callout_gifs/Timeline.gif";
import Spanish_gif from "../assets/img/Feature_callout_gifs/Spanish.gif";
import URLS_gif from "../assets/img/Feature_callout_gifs/URLS.gif";
import LastSold_gif from "../assets/img/Feature_callout_gifs/LastSold.gif";
import { t } from "@lingui/macro";

export const getFeatureCalloutContent = () => [
  {
    title: t`Timeline Tab`,
    description: t`Click the Timeline tab to view info about your building over time.`,
    img: Timeline_gif,
  },
  {
    title: t`Spanish Support`,
    description: t`Who Owns What is now available in Spanish. Click “ES” in the upper right corner to switch your language.`,
    img: Spanish_gif,
  },
  {
    title: t`Unique Tab URLs`,
    description: t`It's now possible to share links to specific tabs (Overview, Timeline, Portfolio, & Summary).`,
    img: URLS_gif,
  },
  {
    title: t`Last Sold`,
    description: t`The Overview and Portfolio tabs now display the date and price from when your building was last sold.`,
    img: LastSold_gif,
  },
];

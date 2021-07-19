import Gif311Data from "../assets/img/Feature_callout_gifs/311-data.gif";
import GifLandlordInfo from "../assets/img/Feature_callout_gifs/landlord-info.gif";
import GifDropdowns from "../assets/img/Feature_callout_gifs/dropdowns.gif";
import GifPortfolioTabRedo from "../assets/img/Feature_callout_gifs/portfolio-tab-redo.gif";
import { t } from "@lingui/macro";

export const getFeatureCalloutContent = () => [
  {
    title: t`311 Complaints Data`,
    description: t`See the most common complaints reported by tenants to 311, now on the Overview and Portfolio tabs.`,
    img: Gif311Data,
  },
  {
    title: t`Clearer Landlord Contact Info`,
    description: t`We reorganized the contact details for each individual and corporate entities associated with a property on the Overview tab.`,
    img: GifLandlordInfo,
  },
  {
    title: t`More Mobile Friendly`,
    description: t`A new set of dropdown menus and design tweaks make it more comfortable to use Who Owns What on the go`,
    img: GifDropdowns,
  },
  {
    title: t`Portfolio Table Redesign`,
    description: t`We overhauled the Portfolio tab to help make navigating this large table of data easier, especially for mobile phones.`,
    img: GifPortfolioTabRedo,
  },
];

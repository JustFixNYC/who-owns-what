import amplitude from "amplitude-js";

// Initiate Amplitude instance
// See https://javascript.plainenglish.io/adding-analytics-to-your-react-application-b584265f9fae for more details

const API_KEY = process.env.REACT_APP_AMPLITUDE_API_KEY;
if (!API_KEY) throw new Error("No Amplitude API key defined!");
amplitude.getInstance().init(API_KEY);

export { amplitude };

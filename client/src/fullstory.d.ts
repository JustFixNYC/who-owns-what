/**
 * Inject the FullStory script and start recording the current user's session.
 *
 * This function is idempotent--it only does anything on the first time it's called,
 * and subsequent calls won't do anything harmful.
 *
 * This exists so that we can trigger FullStory recording from front-end events
 * instead of recording every single visitor to the site (which causes us to
 * run out of FullStory recording credits very quickly).
 */
declare function justfix_startFullStoryRecording();

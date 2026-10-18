// Loaded only when account sign-in is configured. Never part of the first paint bundle.
export{initializeApp,getApps}from'@firebase/app';
export{getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,GithubAuthProvider,OAuthProvider,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,signOut}from'@firebase/auth';
// Keeps this module a real chunk: the sign-in SDK must never merge into first paint.
const marker='auth-runtime-lazy';
export function authRuntimeMarker(){return marker}

// Loaded only when account sign-in is configured. Never part of the first paint bundle.
export{initializeApp,getApps}from'@firebase/app';
export{getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,GithubAuthProvider,OAuthProvider,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,signOut}from'@firebase/auth';

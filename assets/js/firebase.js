const firebaseConfig = {
  apiKey: "AIzaSyAkKYyCmj518f0TaizCh7h35vBdL3TWwSU",
  authDomain: "ai-powered-time-tracking.firebaseapp.com",
  projectId: "ai-powered-time-tracking",
  storageBucket: "ai-powered-time-tracking.firebasestorage.app",
  messagingSenderId: "733398594598",
  appId: "1:733398594598:web:ba68714a22075c648e62e7"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
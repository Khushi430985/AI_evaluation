// assets/js/app.js

// Elements
const emailInput = document.getElementById('email');
const pwdInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const googleBtn = document.getElementById('googleBtn');
const msg = document.getElementById('msg');

if(signupBtn){
  signupBtn.addEventListener('click', async () => {
    msg.textContent = '';
    const email = emailInput.value.trim();
    const password = pwdInput.value.trim();
    if(!email || !password){ msg.textContent = 'Enter email & password'; return; }
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      // redirect to home (replace with your home page)
      window.location.href = 'home.html';
    } catch(e) { msg.textContent = e.message; }
  });
}

if(loginBtn){
  loginBtn.addEventListener('click', async () => {
    msg.textContent = '';
    const email = emailInput.value.trim();
    const password = pwdInput.value.trim();
    if(!email || !password){ msg.textContent = 'Enter email & password'; return; }
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'home.html';
    } catch(e) { msg.textContent = e.message; }
  });
}

if(googleBtn){
  googleBtn.addEventListener('click', async () => {
    msg.textContent = '';
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      window.location.href = 'home.html';
    } catch(e) { msg.textContent = e.message; }
  });
}

// If user already logged in and lands on index.html, send to home
auth.onAuthStateChanged(user => {
  if(user){
    const path = window.location.pathname.split('/').pop();
    if(path === '' || path === 'index.html') {
      window.location.href = 'home.html';
    }
  }
});
/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBo8Q_4L9RbE27ZZY1d_NSqRmn7a4sHUmY",
  authDomain: "filler-4bb67.firebaseapp.com",
  projectId: "filler-4bb67",
  storageBucket: "filler-4bb67.appspot.com",
  messagingSenderId: "816839483915",
  appId: "1:816839483915:web:535fcb314904c91915dd0e"
};

// Initialize Firebase
initializeApp(firebaseConfig);

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyYourFirebaseApiKey",
  authDomain: "insurance-8accd.firebaseapp.com",
  projectId: "insurance-8accd",
  storageBucket: "insurance-8accd.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app

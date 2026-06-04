import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyB8kLF4Enf-Tbt4Meqco0LI25pavGDoz_I",
  authDomain: "gudangwarna-9eec7.firebaseapp.com",
  databaseURL: "https://gudangwarna-9eec7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gudangwarna-9eec7",
  storageBucket: "gudangwarna-9eec7.firebasestorage.app",
  messagingSenderId: "467676948459",
  appId: "1:467676948459:web:7fda08ea40c0daae471bae"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getDatabase(app)

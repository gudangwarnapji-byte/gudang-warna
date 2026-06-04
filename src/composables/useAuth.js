import { ref } from 'vue'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, provider } from '../firebase'

const ADMIN_EMAILS = ['manoramasnif@gmail.com']

export const user = ref(null)
export const currentRole = ref('guest')
export const authReady = ref(false)

export function useAuth() {
  const loginGoogle = () =>
    signInWithPopup(auth, provider).catch(e => alert(e.message))

  const doLogout = () => signOut(auth)

  const initAuth = (cb) => {
    onAuthStateChanged(auth, u => {
      user.value = u
      currentRole.value = u && ADMIN_EMAILS.includes(u.email) ? 'admin' : 'guest'
      authReady.value = true
      if (cb) cb(u)
    })
  }

  return { loginGoogle, doLogout, initAuth }
}

// Redirection côté serveur vers le dashboard pour n'avoir qu'une seule source de vérité
import { redirect } from 'next/navigation'

export default function RedirectToDashboard() {
  redirect('/dashboard')
}

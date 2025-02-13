import { supabase } from '../lib/supabase'

// Import the image using a different syntax for Vite
const fullLogo = new URL('../assets/logos/full.png', import.meta.url).href

const AuthComponent = () => {
  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
          hd: 'encorelm.com',
        },
      },
    })
    if (error) console.error('Error signing in:', error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="mb-8 flex justify-center">
          <img 
            src={fullLogo} 
            alt="Company Logo" 
            className="h-48 w-auto"
          />
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

export default AuthComponent
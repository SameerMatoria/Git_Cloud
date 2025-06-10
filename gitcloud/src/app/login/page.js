'use client';

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = 'http://192.168.0.100:5000/auth/github';
  };

  const handleGoHome = () => {
    window.location.href = 'http://192.168.0.100:3000';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Welcome to GitCloud</h1>
      <p className="text-lg text-gray-700 mb-8 max-w-xl">
        GitCloud is a collaborative platform that syncs your GitHub projects to the cloud. 
        Manage, visualize, and share your repositories with ease.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleLogin}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
        >
          Login with GitHub
        </button>

        <button
          onClick={handleGoHome}
          className="bg-white border border-gray-400 text-gray-800 px-6 py-2 rounded hover:bg-gray-100 transition"
        >
          Go to Home
        </button>
      </div>

      <div className="mt-12 text-sm text-gray-500 max-w-lg">
        <p>
          We use GitHub OAuth to securely log you in without handling your passwords. 
          By logging in, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
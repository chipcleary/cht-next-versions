export default function Home() {
  const isLocal = !process.env.APP_VERSION;
  const version = process.env.APP_VERSION || 'local';

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">CHT Next Versions Example</h1>

      <div className={`mt-4 p-4 rounded-md ${isLocal ? 'bg-cyan-50' : 'bg-lime-50'}`}>
        {isLocal ? (
          <p>👩‍💻 Running locally in development mode</p>
        ) : (
          <p>🚀 Deployed version: {version}</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Deployment Information</h2>
        <ul className="mt-2 space-y-2">
          <li><strong>Version:</strong> {version}</li>
          <li><strong>Environment:</strong> {process.env.NODE_ENV}</li>
          <li><strong>Runtime:</strong> {isLocal ? 'Local' : 'Cloud Run'}</li>
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">About This Example</h2>
        <p className="mt-2">
          This is a minimal example showing version-based deployments using CHT Next Versions.
          Each deployment gets its own URL and service account.
        </p>

        {isLocal ? (
          <div className="mt-4">
            <h3 className="text-xl font-semibold">Local Development</h3>
            <p className="mt-2">
              You're running the app locally. To deploy to Cloud Run:
            </p>
            <pre className="mt-2 bg-gray-50 p-4 rounded-md">
              npm run deploy staging
            </pre>
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="text-xl font-semibold">Deployment Commands</h3>
            <pre className="mt-2 bg-gray-50 p-4 rounded-md">
              {`npm run deploy staging
npm run deploy prod
npm run deploy feature-x`}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}

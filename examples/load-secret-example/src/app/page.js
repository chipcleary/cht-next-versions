'use client';

import { parseSecret } from '../config/secrets';

export default function Home() {
  const isLocal = !process.env.APP_VERSION;
  const version = process.env.APP_VERSION || 'local';

  console.log('(Home) version:', process.env.APP_VERSION);
  console.log('(Home) secret:', process.env.APP_CONFIG);

  //  const secret = parseSecret(process.env.APP_CONFIG, 'APP_VERSION', version);
  //  console.log("Loaded Secret:", secret);
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">CHT Next Versions - Load Secret Example</h1>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">About This Example</h2>
        <p className="mt-2">
          This example shows how to load secrets using CHT Next Versions. It reads the Google Secret
          <code> {'{APP_VERSION}_CONFIG'}</code> and writes it to{' '}
          <code>process.env.APP_CONFIG</code>.
        </p>
        <p className="mt-2">
          Note that while the secret is specific to the APP_VERSION, the env var is always the same.
          This allows you to pull different config data in for different <code>APP_VERSIONs</code>.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Deployment Information</h2>
        <ul className="mt-2 space-y-2">
          <li>
            <strong>Version:</strong> {version}
          </li>
          <li>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </li>
          <li>
            <strong>Runtime:</strong> {isLocal ? 'Local' : 'Cloud Run'}
          </li>
        </ul>
      </div>

      {isLocal ? (
        <div className="mt-4 p-4 rounded-md bg-red-50">
          <p>👩‍💻 Running locally in development mode. Config data not displayed.</p>
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-md bg-lime-50">
          <p>👩‍💻 Not running locally. More details coming.</p>
          <p>
            <code>process.env.APP_CONFIG:</code>
            <code>{process.env.APP_CONFIG}</code>
          </p>
        </div>
      )}
    </main>
  );
}

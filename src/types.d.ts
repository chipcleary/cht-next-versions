// Even though the project uses js, this helps with IDE support

export interface Config {
  /** GCP region for deployment (default: 'us-central1') */
  region?: string;

  /** Artifact Registry repository name (default: 'cloud-run-source-deploy') */
  repository?: string;

  /** Deployment hooks */
  hooks?: {
    /** Run after successful deployment */
    postDeploy?: (version: string, url: string) => Promise<void>;
  };
}

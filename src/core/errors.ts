/**
 * Custom error class for provider-specific errors
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public providerName: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function validateFrontendEnvironment(
  environment: Record<string, string | undefined>,
  production?: boolean,
): string | undefined

export function copyDirectAdminRelease(projectRoot?: string): Promise<string>

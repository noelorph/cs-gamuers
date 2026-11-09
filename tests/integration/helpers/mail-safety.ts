export function assertNativeMailTestReady(): void {
  const project = process.env.TEST_SUPABASE_PROJECT_REF;
  if (
    project !== 'ggiccvcrkydcimveyrfi' ||
    process.env.AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF !== project
  )
    throw new Error(
      'Native mail tests blocked: verify the actual TEST Send Email Hook and safe delivery configuration before setting AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF. A rejected Auth transaction can already have sent mail.'
    );
}

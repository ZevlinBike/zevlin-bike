declare module "shippo" {
  // Minimal types to keep TS happy if @types are absent.
  const shippo: (apiToken: string) => any;
  export default shippo;
}


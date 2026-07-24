export interface ConfiguredAccount {
  accountId: string;
}

export interface ConfigureAccountDetailsResult {
  updated: ConfiguredAccount[];
  notFound: string[];
}

#!/usr/bin/env node

import { runCliV2 } from "../cli_v2";

runCliV2().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

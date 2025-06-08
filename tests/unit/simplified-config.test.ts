import { join } from "path";
import { loadConfig } from "../../src/utils/config";

describe("config loader", () => {
  const fixtureDir = join(__dirname, "../fixtures/simplified-config-basic");

  it("loads rules and targets from simplified config", async () => {
    const config = await loadConfig(fixtureDir);
    expect(config?.ides).toEqual(["cursor", "codex"]);
    expect(config?.rules).toHaveProperty("local-rule");
    expect(config?.rules).toHaveProperty("override-rule");
  });
});

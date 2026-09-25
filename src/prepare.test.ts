import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { prepareClaudeRequest, SYSTEM_IDENTITY_PREFIX } from "./index.ts"

describe("prepareClaudeRequest", () => {
  it("shapes a clean request: identity + billing header, relocates system prompt, PascalCase-prefixes tools and tool_choice", () => {
    const input = JSON.stringify({
      model: "claude-opus-4-6",
      system: [{ type: "text", text: "You are a helpful assistant." }],
      tools: [{ name: "bash" }, { name: "read" }],
      tool_choice: { type: "tool", name: "bash" },
      messages: [{ role: "user", content: "hello" }],
    })

    const output = prepareClaudeRequest(input)
    assert.equal(typeof output, "string")
    const parsed = JSON.parse(output as string) as {
      system: Array<{ type: string; text: string }>
      tools: Array<{ name: string }>
      tool_choice: { type: string; name: string }
      messages: Array<{ role: string; content: string }>
    }

    // Billing header is injected as system[0].
    assert.ok(
      parsed.system[0].text.startsWith("x-anthropic-billing-header"),
      `Expected system[0] to be the billing header, got: ${parsed.system[0].text}`,
    )
    // Identity prefix is kept as its own system entry (system[1]).
    assert.equal(parsed.system[1].text, SYSTEM_IDENTITY_PREFIX)
    // Only billing + identity remain in system; the real prompt is relocated.
    assert.equal(parsed.system.length, 2)
    // The real system prompt is relocated into the first user message.
    assert.ok(
      parsed.messages[0].content.includes("You are a helpful assistant."),
      "Original system prompt should be relocated into the first user message",
    )
    // tools[].name and tool_choice.name are both mcp_-prefixed PascalCase.
    assert.equal(parsed.tools[0].name, "mcp_Bash")
    assert.equal(parsed.tools[1].name, "mcp_Read")
    assert.equal(parsed.tool_choice.name, "mcp_Bash")
  })

  it("is idempotent: re-shaping its own output is byte-identical (no double-prefixing)", () => {
    const clean = JSON.stringify({
      model: "claude-opus-4-6",
      system: [{ type: "text", text: "You are a helpful assistant." }],
      tools: [{ name: "bash" }],
      tool_choice: { type: "tool", name: "bash" },
      messages: [{ role: "user", content: "hello" }],
    })

    // First pass shapes the request (billing marker + mcp_Bash present).
    const shaped = prepareClaudeRequest(clean) as string
    const shapedParsed = JSON.parse(shaped) as {
      tools: Array<{ name: string }>
      tool_choice: { name: string }
    }
    assert.equal(shapedParsed.tools[0].name, "mcp_Bash")
    assert.equal(shapedParsed.tool_choice.name, "mcp_Bash")

    // Second pass on the already-shaped body must be a byte-identical no-op.
    const again = prepareClaudeRequest(shaped)
    assert.equal(again, shaped, "Already-shaped request must be byte-identical")

    const againParsed = JSON.parse(again as string) as {
      tools: Array<{ name: string }>
      tool_choice: { name: string }
    }
    assert.equal(againParsed.tools[0].name, "mcp_Bash")
    assert.notEqual(
      againParsed.tools[0].name,
      "mcp_Mcp_Bash",
      "Tool name must not be double-prefixed",
    )
    assert.equal(againParsed.tool_choice.name, "mcp_Bash")
  })

  it("leaves an already-shaped request untouched (explicit billing marker + mcp_Bash)", () => {
    const alreadyShaped = JSON.stringify({
      model: "claude-opus-4-6",
      system: [
        {
          type: "text",
          text: "x-anthropic-billing-header: cc_version=1.2.3; cc_entrypoint=cli; cch=fa690;",
        },
        { type: "text", text: SYSTEM_IDENTITY_PREFIX },
      ],
      tools: [{ name: "mcp_Bash" }],
      tool_choice: { type: "tool", name: "mcp_Bash" },
      messages: [{ role: "user", content: "hello" }],
    })

    const output = prepareClaudeRequest(alreadyShaped)
    assert.equal(
      output,
      alreadyShaped,
      "System already shaped -> byte-identical output",
    )

    const parsed = JSON.parse(output as string) as {
      tools: Array<{ name: string }>
      tool_choice: { name: string }
    }
    assert.equal(parsed.tools[0].name, "mcp_Bash")
    assert.notEqual(parsed.tools[0].name, "mcp_Mcp_Bash")
    assert.equal(parsed.tool_choice.name, "mcp_Bash")
  })
})

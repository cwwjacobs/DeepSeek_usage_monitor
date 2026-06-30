#!/usr/bin/env npx tsx
/**
 * DeepSeek Usage Monitor — CLI Entry Point
 *
 * Usage:
 *   npx tsx cli.ts
 *   npm start
 *
 * Requires DEEPSEEK_API_KEY environment variable to show balance.
 */

import React from "react";
import { render } from "ink";
import { Monitor } from "./src/monitor";

const inkInstance = render(React.createElement(Monitor), { exitOnCtrlC: true });
inkInstance.waitUntilExit().then(() => process.exit(0));

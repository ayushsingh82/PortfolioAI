import { handleEns } from "./handler/ens.js";
import type { SkillGroup } from "@xmtp/message-kit";

export const skills: SkillGroup[] = [
  {
    name: "Ens Domain Bot",
    tag: "@ens",
    description: "Register ENS domains.",
    skills: [
      {
        skill: "/register [domain]",
        handler: handleEns,
        description:
          "Register a new ENS domain. Returns a URL to complete the registration process.",
        examples: ["/register vitalik.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/info [domain]",
        handler: handleEns,
        description:
          "Get detailed information about an ENS domain including owner, expiry date, and resolver.",
        examples: ["/info nick.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/renew [domain]",
        handler: handleEns,
        description:
          "Extend the registration period of your ENS domain. Returns a URL to complete the renewal.",
        examples: ["/renew fabri.base.eth"],
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/check [domain]",
        handler: handleEns,
        examples: ["/check vitalik.eth", "/check fabri.base.eth"],
        description: "Check if a domain is available.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/cool [domain]",
        examples: ["/cool vitalik.eth"],
        handler: handleEns,
        description: "Get cool alternatives for a .eth domain.",
        params: {
          domain: {
            type: "string",
          },
        },
      },
      {
        skill: "/reset",
        examples: ["/reset"],
        handler: handleEns,
        description: "Reset the conversation.",
        params: {},
      },
      {
        skill: "/tip [address]",
        description: "Show a URL for tipping a domain owner.",
        handler: handleEns,
        examples: ["/tip 0x1234567890123456789012345678901234567890"],
        params: {
          address: {
            type: "string",
          },
        },
      },
      {
        skill: "/portfolio [address] [chainId]",
        description:
          "Get profit and loss data for the given address using the 1inch API.",
        handler: handleEns,
        examples: ["/portfolio 0x1453b01609d09CcB6787338C96A549Fc449715f...  base"],
        params: {
          address: {
            type: "string",
          },
        }
      },
      {
        skill: "/swap [fromToken] [toToken] [amount]",
        description: "Get a quote for swapping tokens using 1inch (Supported tokens: ETH/USDC/USDT/DAI/WETH)",
        handler: handleEns,
        examples: ["/swap fromToken=ETH toToken=USDC amount=1000000000000000000"],
        params: {
          fromToken: {
            type: "string",
          },
          toToken: {
            type: "string",
          },
          amount: {
            type: "string",
          }
        },
      },
      {
        skill: "/hi",
        handler: handleEns,
        description: "Get a welcome message and guide to using the platform",
        examples: ["/hi"],
        params: {},
      },
      {
        skill: "/ens",
        handler: handleEns,
        description: "Get creative and available ENS name suggestions",
        examples: ["/ens"],
        params: {},
      },
    ],
  },
];

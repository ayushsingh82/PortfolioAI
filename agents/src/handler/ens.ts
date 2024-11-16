import { HandlerContext, SkillResponse } from "@xmtp/message-kit";
import { getUserInfo, clearInfoCache, isOnXMTP } from "@xmtp/message-kit";
import { isAddress } from "viem";
import { clearMemory } from "@xmtp/message-kit";
import axios from "axios";

export const frameUrl = "https://ens.steer.fun/";
export const ensUrl = "https://app.ens.domains/";
export const txpayUrl = "https://txpay.vercel.app";

// Add these token addresses as constants
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  eth: {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  bsc: {
    BNB: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
  }
};

export async function handleEns(
  context: HandlerContext,
): Promise<SkillResponse | undefined> {
  const {
    message: {
      sender,
      content: { skill, params },
    },
  } = context;

  if (skill == "reset") {
    clearMemory();
    return { code: 200, message: "Conversation reset." };
  } else if (skill == "renew") {
    const { domain } = params;
    if (!domain) {
      return {
        code: 400,
        message: "Missing required parameters. Please provide domain.",
      };
    }

    const data = await getUserInfo(domain);

    if (!data?.address || data?.address !== sender?.address) {
      return {
        code: 403,
        message:
          "Looks like this domain is not registered to you. Only the owner can renew it.",
      };
    }

    let url_ens = frameUrl + "frames/manage?name=" + domain;
    return { code: 200, message: `${url_ens}` };
  } else if (skill == "register") {
    const { domain } = params;
    let url_ens = ensUrl + domain;
    await context.send(url_ens);
  } else if (skill == "info") {
    const { domain } = params;

    const data = await getUserInfo(domain);
    if (!data?.ensDomain) {
      return {
        code: 404,
        message: "Domain not found.",
      };
    }

    const formattedData = {
      Address: data?.address,
      "Avatar URL": data?.ensInfo?.avatar,
      Description: data?.ensInfo?.description,
      ENS: data?.ensDomain,
      "Primary ENS": data?.ensInfo?.ens_primary,
      GitHub: data?.ensInfo?.github,
      Resolver: data?.ensInfo?.resolverAddress,
      Twitter: data?.ensInfo?.twitter,
      URL: `${ensUrl}${domain}`,
    };

    let message = "Domain information:\n\n";
    for (const [key, value] of Object.entries(formattedData)) {
      if (value) {
        message += `${key}: ${value}\n`;
      }
    }
    message += `\n\nWould you like to tip the domain owner for getting there first 🤣?`;
    message = message.trim();
    if (await isOnXMTP(context.client, context.v2client, sender?.address)) {
      await context.send(
        `Ah, this domains is in XMTP, you can message it directly: https://converse.xyz/dm/${domain}`,
      );
    }
    return { code: 200, message };
  } else if (skill == "check") {
    const { domain } = params;

    if (!domain) {
      return {
        code: 400,
        message: "Please provide a domain name to check.",
      };
    }

    const data = await getUserInfo(domain);
    if (!data?.address) {
      let message = `Looks like ${domain} is available! Here you can register it: ${ensUrl}${domain} or would you like to see some cool alternatives?`;
      return {
        code: 200,
        message,
      };
    } else {
      let message = `Looks like ${domain} is already registered!`;
      await context.executeSkill("/cool " + domain);
      return {
        code: 404,
        message,
      };
    }
  } else if (skill == "tip") {
    const { address } = params;
    if (!address) {
      return {
        code: 400,
        message: "❌ Please provide an address or ENS name to tip.\nExample: /tip humanagent.eth",
      };
    }

    try {
      let recipientAddress = address;
      let ensName = "";

      // Check if input is ENS name
      if (address.endsWith('.eth')) {
        const ensData = await getUserInfo(address);
        if (!ensData?.address) {
          return {
            code: 400,
            message: "❌ Could not resolve ENS name. Please check if it exists.",
          };
        }
        recipientAddress = ensData.address;
        ensName = address;
      }

      const bscUsdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
      const chainId = 56;
      const amount = "100000";

      await context.send(
        `💝 Tip Details\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 Recipient: ${ensName || recipientAddress.slice(0, 6) + '...' + recipientAddress.slice(-4)}\n` +
        `💰 Amount: 0.1 USDC\n` +
        `🔗 Chain: BSC\n` +
        `🏦 Token Contract: ${bscUsdcAddress.slice(0, 6)}...${bscUsdcAddress.slice(-4)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📱 Steps:\n` +
        `1. Make sure you're on BSC network\n` +
        `2. Click the link below\n` +
        `3. Confirm transaction\n` +
        `4. Track your transaction:\n` +
        `   • BSCScan 💫 : https://bscscan.com/address/${recipientAddress}\n` +
        `   • Blockscout 💫 : https://blockscout.com/bsc/mainnet/address/${recipientAddress}/tokens`
      );

      await context.send(
        `🚀 Click to send tip:\n${txpayUrl}/?recipientAddress=${recipientAddress}&tokenAddress=${bscUsdcAddress}&chainId=${chainId}&amount=0.1`
      );

      return {
        code: 200,
        message: `💫 View transaction details:\n` +
                 `• BSCScan 💫 : https://bscscan.com/token/${bscUsdcAddress}?a=${recipientAddress}\n` +
                 `• Blockscout 💫 : https://blockscout.com/bsc/mainnet/address/${recipientAddress}/tokens`
      };

    } catch (error) {
      console.error("Error generating tip link:", error);
      return {
        code: 500,
        message: "❌ Failed to generate tip link. Please try again.",
      };
    }
  } else if (skill == "cool") {
    const { domain } = params;
    return {
      code: 200,
      message: `${generateCoolAlternatives(domain)}`,
    };
  } else if (skill === "portfolio") {
    const { address, chain = "eth" } = params;

    // Hardcoded mapping for ayush.eth
    if (address === "ayush.eth") {
      const ayushAddress = "0x1453b01609d09CcB6787338C96A549Fc449715f4";
      console.log("Using hardcoded address for ayush.eth:", ayushAddress);
      params.address = ayushAddress;
    }

    // Check if the input is a valid address or ENS name
    if (!isAddress(params.address)) {
      try {
        const data = await getUserInfo(params.address);
        if (!data?.address) {
          return { code: 400, message: "❌ Invalid address or ENS name provided." };
        }
        params.address = data.address;
      } catch (error) {
        return { code: 400, message: "❌ Could not resolve ENS name. Please use a valid address." };
      }
    }

    console.log("Fetching portfolio data for address:", params.address);

    try {
      const chainIdMap: Record<string, { id: number, name: string }> = {
        bsc: { id: 56, name: "BSC" },
        eth: { id: 1, name: "ETH" },
        polygon: { id: 137, name: "POLYGON" },
        arbitrum: { id: 42161, name: "ARBITRUM" },
        optimism: { id: 10, name: "OPTIMISM" },
        base: { id: 8453, name: "BASE" }
      };

      const selectedChain = chainIdMap[chain.toLowerCase()];
      if (!selectedChain) {
        throw new Error(`Invalid chain: ${chain}`);
      }

      const response = await axios.get(
        "https://api.1inch.dev/portfolio/portfolio/v4/overview/erc20/profit_and_loss",
        {
          headers: {
            Authorization: "Bearer xDxGzCSlftybzYlijocx1yZRky74jkU5",
          },
          params: { addresses: params.address, chain_id: selectedChain.id },
        }
      );

      console.log("Response Data:", response.data);
  
      const newdtaa = response.data.result.map((item: any) => ({
        abs_profit_usd: item.abs_profit_usd,
        roi: item.roi,
      }));

      await context.send(
        `📊 Portfolio Analysis\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 Address: ${params.address.slice(0, 6)}...${params.address.slice(-4)}\n` +
        `💰 Profit/Loss: $${Number(newdtaa[0].abs_profit_usd).toFixed(2)}\n` +
        `📈 ROI: ${(Number(newdtaa[0].roi) * 100).toFixed(2)}%\n` +
        `🔗 Chain: ${selectedChain.name}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );

      return {
        code: 200,
        message: `🔍 View more details on explorer:\n${chain === 'bsc' ? 'https://bscscan.com/address/' : 'https://etherscan.io/address/'}${params.address}`,
      };

    } catch (error) {
      console.error("Error fetching portfolio data:", error);
      return {
        code: 500,
        message: `❌ Failed to fetch portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  } else if (skill === "swap") {
    const { fromToken, toToken, amount, chain = "bsc" } = params;
    
    if (!fromToken || !toToken || !amount) {
      return {
        code: 400,
        message: "Please provide fromToken, toToken, and amount parameters.",
      };
    }

    console.log("Fetching swap quote for:", { fromToken, toToken, amount, chain });

    try {
      const chainIdMap: Record<string, number> = {
        bsc: 56,
        eth: 1,
        polygon: 137,
        arbitrum: 42161,
        optimism: 10,
        base: 8453
      };

      const chainId = chainIdMap[chain.toLowerCase()];
      
      if (!chainId) {
        throw new Error(`Invalid chain: ${chain}`);
      }

      const fromTokenUpper = (fromToken as string).toUpperCase();
      const toTokenUpper = (toToken as string).toUpperCase();

      if (!TOKEN_ADDRESSES[chain.toLowerCase()] || 
          !TOKEN_ADDRESSES[chain.toLowerCase()][fromTokenUpper] || 
          !TOKEN_ADDRESSES[chain.toLowerCase()][toTokenUpper]) {
        throw new Error(`Invalid token symbol for ${chain}. Supported tokens for BSC: BNB, USDT, BUSD, USDC, WBNB`);
      }

      const fromTokenAddress = TOKEN_ADDRESSES[chain.toLowerCase()][fromTokenUpper];
      const toTokenAddress = TOKEN_ADDRESSES[chain.toLowerCase()][toTokenUpper];

      // Convert human readable amount to wei
      const amountInWei = String(Number(amount) * (10 ** 18));

      const quoteResponse = await axios.get(
        `https://api.1inch.dev/swap/v6.0/${chainId}/swap`,
        {
          headers: {
            Authorization: "Bearer xDxGzCSlftybzYlijocx1yZRky74jkU5",
          },
          params: {
            fromTokenAddress,
            toTokenAddress,
            amount: amountInWei,
            slippage: 1,
            fromAddress: sender?.address || "0x0000000000000000000000000000000000000000",
          },
        }
      );

      console.log("Quote Response:", quoteResponse.data);

      const { dstAmount, tx } = quoteResponse.data;
      const { gas, gasPrice } = tx;

      const fromAmount = Number(amount);
      const toAmount = Number(dstAmount) / (10 ** 18);
      const estimatedGasInGwei = Number(gasPrice) / (10 ** 9);

      await context.send(
        `💱 Swap Quote Details\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 Chain: BSC (BNB Chain)\n` +
        `📤 From: ${fromAmount} ${fromTokenUpper}\n` +
        `📥 To: ${toAmount.toFixed(2)} ${toTokenUpper}\n` +
        `⛽ Gas: ${gas} units @ ${estimatedGasInGwei} GWEI\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );

      return {
        code: 200,
        message: `🚀 Ready to swap? Click here:\n` +
                 `https://app.1inch.io/#/${chainId}/simple/swap/${fromTokenAddress}/${toTokenAddress}`,
      };

    } catch (error) {
      console.error("Error fetching swap quote:", error);
      return {
        code: 500,
        message: `❌ Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  } else if (skill === "hi") {
    const welcomeMessage = `
╔════════════════════════════════╗
║     ✨ ENS DOMAIN BOT ✨      ║
╚═══════════════════════════════╝

🎮 𝗠𝗔𝗜𝗡 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦:

📌 𝗗𝗼𝗺𝗮𝗶𝗻 𝗠𝗮𝗻𝗮𝗴𝗲𝗺𝗲𝗻𝘁
   • /register [domain] ➜ Register new domain
   • /info [domain] ➜ Get domain details
   • /ens ➜ Available domains
   • /check [domain] ➜ Check availability
   • /renew [domain] ➜ Extend registration
   
💎 𝗗𝗲𝗙𝗶 𝗧𝗼𝗼𝗹𝘀
   • /swap [fromToken] [toToken] [amount]
     └─ Example: /swap BNB USDT 1
     └─ Supported: BNB, USDT, BUSD, USDC
   
   • /portfolio [address] [chain]
     └─ Example: /portfolio 0x1234...5678 eth
     └─ View profit/loss and ROI

🎲 𝗘𝘅𝘁𝗿𝗮 𝗙𝗲𝗮𝘁𝘂𝗿𝗲𝘀
   • /cool [domain] ➜ Get creative suggestions
   • /tip [address] ➜ Send tips to owners

┏━━━━━━━━ 𝗤𝗨𝗜𝗖𝗞 𝗦𝗧𝗔𝗥𝗧 ━━━━━━━┓
  1. /check vitalik.eth
  2. /swap BNB USDT 1
  3. /portfolio [your-address] eth
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

❓ Need help? Type /hi anytime!`;

    await context.send(welcomeMessage);

    return {
      code: 200,
      message: `✨ Welcome! Try any command above to get started! ✨`,
    };
  } else if (skill === "ens") {
    try {
      const prefixes = ["web3", "defi", "nft", "dao", "meta"];
      const suffixes = ["dev", "pro", "guru", "master", "wizard"];
      const suggestions = [];

      // First message to show we're working
      await context.send(
        `🎨 Generating ENS Suggestions\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `Please wait while I check availability...`
      );

      // Generate domain suggestions with error handling
      for (let i = 0; i < 5; i++) {
        try {
          const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          const suggestion = `${randomPrefix}${randomSuffix}.eth`;
          
          try {
            const data = await getUserInfo(suggestion);
            if (!data?.address) {
              suggestions.push(`✅ ${suggestion} - Available!`);
            } else {
              suggestions.push(`❌ ${suggestion} - Taken`);
            }
          } catch (error) {
            console.error(`Error checking domain ${suggestion}:`, error);
            suggestions.push(`⚠️ ${suggestion} - Status unknown`);
          }
        } catch (error) {
          console.error("Error generating suggestion:", error);
          continue;
        }
      }

      // Add year-based and numeric suggestions without checking availability
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      suggestions.push(`💫 ${year}web3.eth - Try this!`);
      suggestions.push(`💫 defi${randomNum}.eth - Try this!`);

      // Send the results via context.send
      await context.send(
        `🎯 ENS Name Suggestions\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `${suggestions.join('\n')}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );

      // Return the registration link
      return {
        code: 200,
        message: `💡 Register any available name at:\n${ensUrl}\n\n✨ Try /cool [domain] for more suggestions!`
      };

    } catch (error) {
      console.error("Error in ENS command:", error);
      return {
        code: 500,
        message: `❌ Something went wrong while generating suggestions.\n` +
                `Try these formats instead:\n` +
                `• [year]web3.eth\n` +
                `• defi[number].eth\n` +
                `• web3[name].eth`
      };
    }
  } else {
    return { code: 400, message: "Skill not found." };
  }
  
}

export const generateCoolAlternatives = (domain: string) => {
  const suffixes = ["lfg", "cool", "degen", "moon", "base", "gm"];
  const alternatives = [];
  for (let i = 0; i < 5; i++) {
    const randomPosition = Math.random() < 0.5;
    const baseDomain = domain.replace(/\.eth$/, "");
    alternatives.push(
      randomPosition
        ? `${suffixes[i]}${baseDomain}.eth`
        : `${baseDomain}${suffixes[i]}.eth`,
    );
  }

  const cool_alternativesFormat = alternatives
    .map(
      (alternative: string, index: number) => `${index + 1}. ${alternative} ✨`,
    )
    .join("\n");
  return cool_alternativesFormat;
};

export async function clear() {
  clearMemory();
  clearInfoCache();
}
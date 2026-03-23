export const intentAbi = [
  {
    type: "event",
    name: "IntentCreated",
    inputs: [
      { name: "intentId", type: "bytes32", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "intentType", type: "uint8", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "function",
    name: "createIntentWithSig",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "intentType", type: "uint8" },
      { name: "sourceChain", type: "uint256" },
      { name: "targetChains", type: "uint256[]" },
      {
        name: "provided",
        type: "tuple[]",
        components: [
          { name: "token", type: "address" },
          { name: "chainId", type: "uint256" },
          { name: "amount", type: "uint256" }
        ]
      },
      {
        name: "expected",
        type: "tuple[]",
        components: [
          { name: "token", type: "address" },
          { name: "chainId", type: "uint256" },
          { name: "amount", type: "uint256" }
        ]
      },
      {
        name: "constraints",
        type: "tuple",
        components: [
          { name: "deadline", type: "uint256" },
          { name: "maxSlippageBps", type: "uint256" },
          { name: "minimumOutputs", type: "uint256[]" },
          { name: "allowedExecutors", type: "address[]" }
        ]
      },
      {
        name: "feePayment",
        type: "tuple",
        components: [
          { name: "token", type: "address" },
          { name: "paymentChain", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "sponsor", type: "address" },
          { name: "usePaymaster", type: "bool" }
        ]
      },
      { name: "nonce", type: "uint256" },
      { name: "memo", type: "bytes" },
      { name: "signature", type: "bytes" }
    ],
    outputs: [{ name: "", type: "bytes32" }]
  }
] as const;

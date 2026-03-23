export const routerAbi = [
  {
    type: "event",
    name: "MessageRouted",
    inputs: [
      { name: "messageId", type: "bytes32", indexed: true },
      { name: "destinationChain", type: "uint256", indexed: true },
      { name: "receiver", type: "address", indexed: true }
    ],
    anonymous: false
  },
  {
    type: "function",
    name: "routeMessage",
    stateMutability: "payable",
    inputs: [
      { name: "destinationChainId", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "payload", type: "bytes" },
      { name: "preferredProtocols", type: "uint8[]" },
      { name: "deadline", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "getProtocolStats",
    stateMutability: "view",
    inputs: [{ name: "protocol", type: "uint8" }],
    outputs: [
      { name: "totalMessages", type: "uint256" },
      { name: "successfulMessages", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getAdapterStats",
    stateMutability: "view",
    inputs: [
      { name: "chainId", type: "uint256" },
      { name: "protocol", type: "uint8" }
    ],
    outputs: [
      { name: "reliabilityScore", type: "uint256" },
      { name: "avgLatency", type: "uint256" },
      { name: "totalMessages", type: "uint256" },
      { name: "successfulMessages", type: "uint256" },
      { name: "active", type: "bool" }
    ]
  }
] as const;

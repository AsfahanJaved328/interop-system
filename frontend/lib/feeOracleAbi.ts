export const feeOracleAbi = [
  {
    type: "function",
    name: "estimateFee",
    stateMutability: "view",
    inputs: [
      { name: "destinationChainId", type: "uint256" },
      { name: "messageType", type: "uint8" },
      { name: "urgency", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

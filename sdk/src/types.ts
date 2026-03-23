export type ChainId = number;

export interface CrossChainMessage {
  messageId: string;
  sourceChainId: ChainId;
  destinationChainId: ChainId;
  sourceAddress: string;
  destinationAddress: string;
  payload: string;
  messageType: string;
  gasLimit: string;
  value: string;
  nonce: string;
  timestamp: string;
  fee: string;
  metadata: string;
}

export interface IntentRequest {
  sourceChain: ChainId;
  targetChains: ChainId[];
  deadline: number;
}

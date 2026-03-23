"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount, useChainId, useSignTypedData, useWriteContract } from "wagmi";
import {
  createPublicClient,
  encodeAbiParameters,
  encodePacked,
  http,
  keccak256,
  parseEventLogs,
  toBytes,
  toHex,
  zeroAddress
} from "viem";
import { intentAbi } from "../../lib/intentAbi";
import { downloadCsv } from "../../lib/csv";

const steps = ["Type", "Details", "Review", "Confirm"];

export default function IntentsPage() {
  const [step, setStep] = useState(0);
  const [intents, setIntents] = useState<any[]>([]);
  const [intentFilter, setIntentFilter] = useState("");
  const [intentPage, setIntentPage] = useState(0);
  const [intentPageSize] = useState(5);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [historySource, setHistorySource] = useState<"chain" | "empty">("empty");
  const [mounted, setMounted] = useState(false);
  const [nonce, setNonce] = useState(0);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const schema = z.object({
    give: z.string().min(1, "Enter the amount you give"),
    receive: z.string().min(1, "Enter the minimum you receive"),
    deadline: z
      .string()
      .min(1, "Select a deadline")
      .refine((value) => new Date(value).getTime() > Date.now(), "Deadline must be in the future"),
    solver: z.string().optional()
  });
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { give: "", receive: "", deadline: "", solver: "" }
  });
  const filteredIntents = intents.filter((intent) =>
    `${intent.id} ${intent.user}`.toLowerCase().includes(intentFilter.toLowerCase())
  );

  useEffect(() => {
    const intentContract =
      process.env.NEXT_PUBLIC_INTENT_CONTRACT ||
      "0x0000000000000000000000000000000000000000";
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

    async function loadOnChain() {
      if (intentContract === "0x0000000000000000000000000000000000000000") return false;
      const client = createPublicClient({ transport: http(rpcUrl) });
      const logs = await client.getLogs({
        address: intentContract as `0x${string}`,
        event: {
          type: "event",
          name: "IntentCreated",
          inputs: [
            { name: "intentId", type: "bytes32", indexed: true },
            { name: "user", type: "address", indexed: true },
            { name: "intentType", type: "uint8", indexed: false }
          ]
        },
        fromBlock: 0n,
        toBlock: "latest"
      });
      const parsed = parseEventLogs({ abi: intentAbi, logs });
      const list = parsed
        .slice(-25)
        .reverse()
        .map((log) => ({
          id: log.args.intentId,
          name: `Intent ${log.args.intentId.toString().slice(0, 6)}`,
          user: log.args.user,
          status: "Pending"
        }));
      setIntents(list);
      setHistorySource("chain");
      return true;
    }

    loadOnChain().catch(() => {
      setIntents([]);
      setHistorySource("empty");
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIntentPage(0);
  }, [intentFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Intent</h1>
      <motion.div whileHover={{ y: -3 }} className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <div className="mb-6 flex gap-3 text-xs text-slate-400">
          {steps.map((stepName, index) => (
            <span
              key={stepName}
              className={`rounded-full px-3 py-1 ${
                index === step ? "bg-[#4F46E5] text-white" : "bg-black/30"
              }`}
            >
              {index + 1} {stepName}
            </span>
          ))}
        </div>

        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {["Swap", "Bridge", "Yield", "NFT", "Custom"].map((type) => (
              <button key={type} className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                <div className="text-sm font-semibold">{type}</div>
                <div className="text-xs text-slate-400">Cross-chain {type.toLowerCase()} flow</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <form className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl bg-black/30 p-3"
              placeholder="You give amount"
              {...form.register("give")}
            />
            <input
              className="rounded-xl bg-black/30 p-3"
              placeholder="You get minimum"
              {...form.register("receive")}
            />
            <input
              className="rounded-xl bg-black/30 p-3"
              type="datetime-local"
              {...form.register("deadline")}
            />
            <input
              className="rounded-xl bg-black/30 p-3"
              placeholder="Preferred solver"
              {...form.register("solver")}
            />
          </form>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
            <div className="text-xs text-slate-400">Review</div>
            <div className="mt-2 flex flex-col gap-2">
              <div>Give: {form.watch("give") || "-"}</div>
              <div>Receive: {form.watch("receive") || "-"}</div>
              <div>Deadline: {form.watch("deadline") || "-"}</div>
              <div>Solver: {form.watch("solver") || "Any"}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
            Intent submitted successfully. Track status in the dashboard.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            type="button"
          >
            Back
          </button>
          <button
            className="rounded-xl bg-[#4F46E5] px-6 py-2 text-sm font-semibold"
            onClick={async () => {
              if (step === 1) {
                const ok = await form.trigger();
                if (!ok) {
                  setSubmitStatus("Please fix the fields in Step 2.");
                  return;
                }
              }
              setStep(Math.min(3, step + 1));
            }}
            type="button"
          >
            {step === 3 ? "Done" : "Continue"}
          </button>
          <button
            className="rounded-xl bg-[#10B981] px-6 py-2 text-sm font-semibold text-black"
            disabled={!mounted || !isConnected}
            type="button"
            onClick={form.handleSubmit(async (values) => {
              try {
                setSubmitStatus(null);
                if (!address) {
                  setSubmitStatus("Connect wallet to sign.");
                  return;
                }
                const intentContract =
                  process.env.NEXT_PUBLIC_INTENT_CONTRACT ||
                  "0x0000000000000000000000000000000000000000";
                const sourceChain = chainId || 1;
                const giveAmount = Math.floor(Number(values.give) * 1e6);
                const receiveAmount = Math.floor(Number(values.receive) * 1e6);
                if (!Number.isFinite(giveAmount) || !Number.isFinite(receiveAmount)) {
                  setSubmitStatus("Amounts must be valid numbers.");
                  return;
                }

                const targetChains = [BigInt(sourceChain)];
                const provided = [
                  {
                    token: zeroAddress,
                    chainId: BigInt(sourceChain),
                    amount: BigInt(giveAmount)
                  }
                ];
                const expected = [
                  {
                    token: zeroAddress,
                    chainId: BigInt(sourceChain),
                    amount: BigInt(receiveAmount)
                  }
                ];
                const deadline = Math.floor(new Date(values.deadline).getTime() / 1000);
                const minOutputs = [BigInt(receiveAmount)];
                const allowedExecutors: `0x${string}`[] = [];

                const TOKEN_AMOUNT_TYPEHASH = keccak256(
                  toBytes("TokenAmount(address token,uint256 chainId,uint256 amount)")
                );
                const EXECUTION_CONSTRAINTS_TYPEHASH = keccak256(
                  toBytes(
                    "ExecutionConstraints(uint256 deadline,uint256 maxSlippageBps,bytes32 minimumOutputsHash,bytes32 allowedExecutorsHash)"
                  )
                );
                const FEE_PAYMENT_TYPEHASH = keccak256(
                  toBytes("FeePayment(address token,uint256 paymentChain,uint256 amount,address sponsor,bool usePaymaster)")
                );

                const targetChainsHash = keccak256(encodePacked(["uint256[]"], [targetChains]));
                const providedHashes = provided.map((item) =>
                  keccak256(
                    encodeAbiParameters(
                      [
                        { type: "bytes32" },
                        { type: "address" },
                        { type: "uint256" },
                        { type: "uint256" }
                      ],
                      [TOKEN_AMOUNT_TYPEHASH, item.token, item.chainId, item.amount]
                    )
                  )
                );
                const expectedHashes = expected.map((item) =>
                  keccak256(
                    encodeAbiParameters(
                      [
                        { type: "bytes32" },
                        { type: "address" },
                        { type: "uint256" },
                        { type: "uint256" }
                      ],
                      [TOKEN_AMOUNT_TYPEHASH, item.token, item.chainId, item.amount]
                    )
                  )
                );
                const providedHash = keccak256(encodePacked(["bytes32[]"], [providedHashes]));
                const expectedHash = keccak256(encodePacked(["bytes32[]"], [expectedHashes]));
                const minOutputsHash = keccak256(encodePacked(["uint256[]"], [minOutputs]));
                const allowedExecutorsHash = keccak256(encodePacked(["address[]"], [allowedExecutors]));
                const constraintsHash = keccak256(
                  encodeAbiParameters(
                    [
                      { type: "bytes32" },
                      { type: "uint256" },
                      { type: "uint256" },
                      { type: "bytes32" },
                      { type: "bytes32" }
                    ],
                    [
                      EXECUTION_CONSTRAINTS_TYPEHASH,
                      BigInt(deadline),
                      BigInt(50),
                      minOutputsHash,
                      allowedExecutorsHash
                    ]
                  )
                );
                const feePaymentHash = keccak256(
                  encodeAbiParameters(
                    [
                      { type: "bytes32" },
                      { type: "address" },
                      { type: "uint256" },
                      { type: "uint256" },
                      { type: "address" },
                      { type: "bool" }
                    ],
                    [
                      FEE_PAYMENT_TYPEHASH,
                      zeroAddress,
                      BigInt(sourceChain),
                      BigInt(0),
                      zeroAddress,
                      false
                    ]
                  )
                );
                const memoHash = keccak256(toBytes("frontend"));

                const signature = await signTypedDataAsync({
                  domain: {
                    name: "InteropIntent",
                    version: "1",
                    chainId: sourceChain,
                    verifyingContract: intentContract as `0x${string}`
                  },
                  primaryType: "IntentSig",
                  types: {
                    IntentSig: [
                      { name: "user", type: "address" },
                      { name: "intentType", type: "uint8" },
                      { name: "sourceChain", type: "uint256" },
                      { name: "targetChainsHash", type: "bytes32" },
                      { name: "providedHash", type: "bytes32" },
                      { name: "expectedHash", type: "bytes32" },
                      { name: "constraintsHash", type: "bytes32" },
                      { name: "feePaymentHash", type: "bytes32" },
                      { name: "nonce", type: "uint256" },
                      { name: "memoHash", type: "bytes32" }
                    ]
                  },
                  message: {
                    user: address,
                    intentType: 0,
                    sourceChain: BigInt(sourceChain),
                    targetChainsHash,
                    providedHash,
                    expectedHash,
                    constraintsHash,
                    feePaymentHash,
                    nonce: BigInt(nonce),
                    memoHash
                  }
                });

                if (intentContract !== "0x0000000000000000000000000000000000000000") {
                  await writeContractAsync({
                    address: intentContract as `0x${string}`,
                    abi: intentAbi,
                    functionName: "createIntentWithSig",
                    args: [
                      address,
                      0,
                      BigInt(sourceChain),
                      targetChains,
                      provided,
                      expected,
                      {
                        deadline: BigInt(deadline),
                        maxSlippageBps: BigInt(50),
                        minimumOutputs: minOutputs,
                        allowedExecutors
                      },
                      {
                        token: zeroAddress,
                        paymentChain: BigInt(sourceChain),
                        amount: BigInt(0),
                        sponsor: zeroAddress,
                        usePaymaster: false
                      },
                      BigInt(nonce),
                      toHex("frontend"),
                      signature
                    ]
                  });
                }

                const res = await fetch("/api/intents", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    ...values,
                    address,
                    signature,
                    nonce,
                    intentContract,
                    sourceChain
                  })
                });
                const json = await res.json();
                setSubmitStatus(`Intent submitted: ${json.intentId}`);
                setStep(3);
                setNonce((current) => current + 1);
              } catch {
                setSubmitStatus("Failed to submit intent");
              }
            })}
          >
            Sign + Submit
          </button>
        </div>
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="mt-2 text-xs text-red-400">
            {Object.values(form.formState.errors)[0]?.message?.toString() ||
              "Please fill all required fields in Step 2 before submitting."}
          </div>
        )}
        {submitStatus && <div className="mt-3 text-xs text-slate-300">{submitStatus}</div>}
      </motion.div>

      <div className="rounded-2xl bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent Intents</h2>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"
            onClick={() => downloadCsv("intent-history.csv", filteredIntents)}
          >
            Export CSV
          </button>
        </div>
        <div className="mt-3">
          <input
            className="w-full rounded-xl bg-black/30 p-2 text-sm"
            placeholder="Filter by id or address"
            value={intentFilter}
            onChange={(event) => setIntentFilter(event.target.value)}
          />
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {intents.length === 0 && (
            <div className="text-slate-400">
              {historySource === "chain"
                ? "No intents have been created on this local chain yet."
                : "Deploy the local contracts and sign an intent to populate history."}
            </div>
          )}
          {filteredIntents
            .slice(intentPage * intentPageSize, intentPage * intentPageSize + intentPageSize)
            .map((intent) => (
              <div key={intent.id} className="flex justify-between border-b border-white/10 pb-2">
                <span>{intent.name || "Intent"}</span>
                <span className="text-amber-400">{intent.status || "Pending"}</span>
              </div>
            ))}
          {filteredIntents.length > intentPageSize && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <button
                className="rounded-lg border border-white/10 px-2 py-1"
                disabled={intentPage === 0}
                onClick={() => setIntentPage((prev) => Math.max(prev - 1, 0))}
              >
                Prev
              </button>
              <span>
                Page {intentPage + 1} / {Math.max(1, Math.ceil(filteredIntents.length / intentPageSize))}
              </span>
              <button
                className="rounded-lg border border-white/10 px-2 py-1"
                disabled={(intentPage + 1) * intentPageSize >= filteredIntents.length}
                onClick={() =>
                  setIntentPage((prev) =>
                    (prev + 1) * intentPageSize >= filteredIntents.length ? prev : prev + 1
                  )
                }
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

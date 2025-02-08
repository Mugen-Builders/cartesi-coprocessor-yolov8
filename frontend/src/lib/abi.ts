export const TreeDetectorABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_taskIssuerAddress", type: "address", internalType: "address" },
      { name: "_machineHash", type: "bytes32", internalType: "bytes32" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "computationSent",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "coprocessorCallbackOutputsOnly",
    inputs: [
      { name: "_machineHash", type: "bytes32", internalType: "bytes32" },
      { name: "_payloadHash", type: "bytes32", internalType: "bytes32" },
      { name: "outputs", type: "bytes[]", internalType: "bytes[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "machineHash",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "runExecution",
    inputs: [{ name: "input", type: "bytes", internalType: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "taskIssuer",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract ITaskIssuer" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ResultReceived",
    inputs: [
      {
        name: "payloadHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "imageHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "ComputationNotFound",
    inputs: [{ name: "payloadHash", type: "bytes32", internalType: "bytes32" }],
  },
  {
    type: "error",
    name: "InsufficientFunds",
    inputs: [
      { name: "value", type: "uint256", internalType: "uint256" },
      { name: "balance", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "InvalidOutputLength",
    inputs: [{ name: "length", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "InvalidOutputSelector",
    inputs: [
      { name: "selector", type: "bytes4", internalType: "bytes4" },
      { name: "expected", type: "bytes4", internalType: "bytes4" },
    ],
  },
  {
    type: "error",
    name: "MachineHashMismatch",
    inputs: [
      { name: "current", type: "bytes32", internalType: "bytes32" },
      { name: "expected", type: "bytes32", internalType: "bytes32" },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedCaller",
    inputs: [{ name: "caller", type: "address", internalType: "address" }],
  },
];
